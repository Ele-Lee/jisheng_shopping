'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import { useAtom, useAtomValue } from 'jotai'
import { userInfoAtom, userIdAtom } from '@/store/userStore'
import { cartAtom, cartTotalItemsAtom, cartTotalPriceAtom, CartItem } from '@/store/cartStore'
import { productsAtom, productsLoadedAtom } from '@/store/productStore'

export default function ListPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [navigating, setNavigating] = useState(false)
  const [activeTab, setActiveTab] = useState(500)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { toasts, error: showError, removeToast } = useToast()
  
  const [userId] = useAtom(userIdAtom)
  const [userInfo, setUserInfo] = useAtom(userInfoAtom)
  const [cart, setCart] = useAtom(cartAtom)
  const totalItems = useAtomValue(cartTotalItemsAtom)
  const totalPrice = useAtomValue(cartTotalPriceAtom)
  const [products, setProducts] = useAtom(productsAtom)
  const [productsLoaded, setProductsLoaded] = useAtom(productsLoadedAtom)
  
  const userPoints = userInfo?.points ?? 0
  const isLeader = ['局领导', '警航支队', '综管', '一大队', '二大队', '三大队'].includes(userInfo?.department_name ?? '')

  const tabs = [100, 200, 300, 400, 500]

  useEffect(() => {
    if (userId && !userInfo) {
      fetch(`/api/users/info?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUserInfo(data.user)
          }
        })
        .catch(err => console.error('Failed to fetch user info:', err))
    }
  }, [userId, userInfo, setUserInfo])

  useEffect(() => {
    if (!productsLoaded && userId) {
      fetch(`/api/products?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          setProducts(data.products || [])
          setProductsLoaded(true)
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to fetch products:', err)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [productsLoaded, userId, setProducts, setProductsLoaded])

  const filteredProducts = products.filter(p => p.price === activeTab)
  

  const getCartQuantity = (productId: number) => {
    const item = cart.find(c => c.productId === productId)
    return item ? item.quantity : 0
  }

  const parseSpecification = (spec: string | null | undefined): string => {
    if (!spec) return '暂无规格信息'
    
    try {
      const parsed = JSON.parse(spec)
      if (parsed && typeof parsed === 'object' && parsed.richText && Array.isArray(parsed.richText)) {
        return parsed.richText
          .map((item: any) => item.text || '')
          .filter((text: string) => text.trim())
          .join('\n')
      }
      return spec
    } catch {
      return spec
    }
  }

  const updateQuantity = (product: Product, delta: number) => {
    const currentQuantity = getCartQuantity(product.id)
    const newQuantity = currentQuantity + delta
    const price = product.price || 100

    if (newQuantity <= 0) {
      setCart(cart.filter(c => c.productId !== product.id))
      return
    }

    const newTotalPrice = totalPrice + (delta * price)
    if (newTotalPrice > userPoints) {
      showError('积分不足')
      return
    }

    const existingItem = cart.find(c => c.productId === product.id)
    if (existingItem) {
      setCart(cart.map(c => 
        c.productId === product.id 
          ? { ...c, quantity: newQuantity }
          : c
      ))
    } else {
      setCart([...cart, { productId: product.id, quantity: newQuantity, product }])
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-bold">商品列表</h1>
          <div className="flex items-center gap-2">
            <div className="text-sm">
              <span className="text-gray-600">余额：</span>
              <span className="text-red-500 font-bold">{userPoints - totalPrice}</span>
            </div>
            <button
              onClick={() => {
                setNavigating(true)
                router.push('/orders')
              }}
              className="bg-green-500 text-white! px-3 py-2 rounded-lg text-sm"
            >
              订单记录
            </button>
            <button
              onClick={() => {
                setNavigating(true)
                router.push('/cart')
              }}
              className="relative bg-blue-500 text-white! px-3 py-2 rounded-lg text-sm"
            >
              购物车
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white! text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
        {isLeader && (
          <div className="flex border-t">
            {tabs.map(price => (
            <button
              key={price}
              onClick={() => setActiveTab(price)}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === price
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500'
              }`}
            >
              {price}积分
            </button>
            ))}
          </div>
        )}
      </div>
      <div className="px-4 pt-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">暂无商品</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const quantity = getCartQuantity(product.id)
              return (
                <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} className="w-full aspect-square object-cover" />
                  <div className="p-3">
                    <h2 className="text-sm font-semibold mb-1 line-clamp-2">{product.name}</h2>
                    <p className="text-gray-500 text-xs mb-1">{product.brand}</p>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-red-500 font-bold text-base">{product.price}积分</p>
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="text-blue-500 text-xs px-2 py-1 border border-blue-500 rounded"
                      >
                        查看明细
                      </button>
                    </div>
                    {quantity === 0 ? (
                      <button 
                        onClick={() => updateQuantity(product, 1)}
                        className="w-full bg-blue-500 text-white! py-2 rounded-lg active:bg-blue-600 transition text-sm"
                      >
                        加入购物车
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-100 rounded-lg">
                        <button
                          onClick={() => updateQuantity(product, -1)}
                          className="w-10 h-9 flex items-center justify-center text-xl text-gray-600 active:bg-gray-200"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product, 1)}
                          className="w-10 h-9 flex items-center justify-center text-xl text-blue-500 active:bg-gray-200"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedProduct && (
        <div 
          className="fixed inset-0 bg-[rgba(0,0,0,0.8)] flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
              <h3 className="font-bold text-lg">商品明细</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-500 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <img 
                  src={selectedProduct.image || 'https://via.placeholder.com/150'} 
                  alt={selectedProduct.name}
                  className="w-full rounded-lg"
                />
              </div>
              <h4 className="font-semibold text-base mb-2">{selectedProduct.name}</h4>
              <p className="text-gray-500 text-sm mb-3">{selectedProduct.brand}</p>
              <div className="border-t pt-3">
                <h5 className="font-semibold text-sm mb-2">规格明细：</h5>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {parseSpecification(selectedProduct.specification)}
                </div>
              </div>
              {/* {selectedProduct.features && (
                <div className="border-t pt-3 mt-3">
                  <h5 className="font-semibold text-sm mb-2">产品特点：</h5>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {typeof selectedProduct.features === 'string' 
                      ? selectedProduct.features 
                      : JSON.stringify(selectedProduct.features)}
                  </div>
                </div>
              )} */}
            </div>
          </div>
        </div>
      )}

      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {navigating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-gray-700">加载中...</p>
          </div>
        </div>
      )}
    </div>
  )
}
