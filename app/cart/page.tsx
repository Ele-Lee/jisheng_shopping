'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import { useAtom } from 'jotai'
import { userInfoAtom, userIdAtom } from '@/store/userStore'
import { cartAtom, cartTotalItemsAtom, cartTotalPriceAtom } from '@/store/cartStore'

export default function CartPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [hasAddress, setHasAddress] = useState(false)
  const { toasts, success, error: showError, removeToast } = useToast()
  
  const [userId] = useAtom(userIdAtom)
  const [userInfo, setUserInfo] = useAtom(userInfoAtom)
  const [cart, setCart] = useAtom(cartAtom)
  const [totalItems] = useAtom(cartTotalItemsAtom)
  const [totalPrice] = useAtom(cartTotalPriceAtom)
  
  const userPoints = userInfo?.points ?? 0

  useEffect(() => {
    if (!userId) {
      showError('请先登录')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
      return
    }

    if (userInfo) {
      const addressComplete = !!(userInfo.phone && userInfo.province && 
                                userInfo.city && userInfo.district && userInfo.address)
      setHasAddress(addressComplete)
    }
  }, [userId, userInfo, router])

  const updateQuantity = (productId: number, delta: number) => {
    const updatedCart = cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + delta
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null
      }
      return item
    }).filter(Boolean)

    // @ts-ignore
    setCart(updatedCart)
  }

  const removeItem = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId))
  }


  const handleSubmitOrder = async () => {
    if (!userId) {
      showError('请先登录')
      return
    }

    if (cart.length === 0) {
      showError('购物车是空的')
      return
    }

    if (userPoints < totalPrice) {
      showError('积分不足')
      return
    }

    if (!hasAddress) {
      const cartItems = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price || 100
      }))
      localStorage.setItem('pendingOrder', JSON.stringify({ cartItems, totalPoints: totalPrice }))
      router.push('/address?from=cart')
      return
    }

    setSubmitting(true)

    try {
      const cartItems = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price || 100
      }))

      const params = new URLSearchParams({
        userId: userId!,
        cartItems: JSON.stringify(cartItems),
        totalPoints: totalPrice.toString()
      })
      const response = await fetch(`/api/orders/submit?${params.toString()}`)

      const data = await response.json()

      if (response.ok) {
        success('订单提交成功！')
        setCart([])
        if (userInfo) {
          setUserInfo({ ...userInfo, points: data.newPoints })
        }
        setTimeout(() => {
          router.push('/list')
        }, 1500)
      } else {
        showError(data.error || '订单提交失败')
      }
    } catch (error) {
      console.error('Failed to submit order:', error)
      showError('网络错误')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white shadow-sm z-10 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-2xl">
            ←
          </button>
          <h1 className="text-lg font-bold">购物车</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="text-sm">
              <span className="text-gray-600">余额：</span>
              <span className="text-red-500 font-bold">{userPoints - totalPrice}</span>
            </div>
            <button
              onClick={() => router.push('/orders')}
              className="bg-green-500 text-white! px-3 py-2 rounded-lg text-sm"
            >
              订单记录
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {cart.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">购物车是空的</p>
            <button
              onClick={() => router.push('/list')}
              className="bg-blue-500 text-white! px-6 py-2 rounded-lg"
            >
              去购物
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-20">
              {cart.map((item) => (
                <div key={item.productId} className="bg-white rounded-lg p-3 flex gap-3">
                  <img
                    src={item.product.image || 'https://via.placeholder.com/150'}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold line-clamp-2 mb-1">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">{item.product.brand}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-red-500 font-bold">{item.product.price}积分</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-100 rounded">
                          <button
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600"
                          >
                            -
                          </button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="w-8 h-8 flex items-center justify-center text-blue-500"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-red-500 text-sm px-2"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">
                  共 {totalItems} 件商品
                </div>
                <div className="text-lg">
                  <span className="text-gray-600">合计：</span>
                  <span className="text-red-500 font-bold">{totalPrice}积分</span>
                </div>
              </div>
              {totalPrice > userPoints && (
                <div className="mb-2 text-sm text-red-500 text-center">
                  积分不足，当前积分：{userPoints}
                </div>
              )}
              <button 
                onClick={handleSubmitOrder}
                disabled={submitting || totalPrice > userPoints}
                className="w-full bg-blue-500 text-white! py-3 rounded-lg font-medium disabled:bg-gray-400"
              >
                {submitting ? '提交中...' : '提交订单'}
              </button>
            </div>
          </>
        )}
      </div>

      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}
