'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import { useAtom } from 'jotai'
import { userInfoAtom, userIdAtom } from '@/store/userStore'

interface OrderItem {
  id: number
  user_id: number
  product_id: number
  quantity: number
  created_at: string
  updated_at: string
  product: Product
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toasts, error: showError, removeToast } = useToast()
  
  const [userId] = useAtom(userIdAtom)
  const [userInfo, setUserInfo] = useAtom(userInfoAtom)
  
  const userPoints = userInfo?.points ?? 0

  useEffect(() => {
    if (!userId) {
      showError('请先登录')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
      return
    }

    fetch(`/api/orders?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch orders:', err)
        setLoading(false)
      })
  }, [userId, router])

  const getTotalPrice = () => {
    return orders.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0)
  }

  const getTotalItems = () => {
    return orders.reduce((sum, item) => sum + item.quantity, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white shadow-sm z-10 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-2xl">
            ←
          </button>
          <h1 className="text-lg font-bold">订单记录</h1>
          <button
            onClick={() => router.push('/address')}
            className="ml-auto text-sm text-blue-500 underline"
          >
            地址
          </button>
          <div className="text-sm">
            <span className="text-gray-600">积分：</span>
            <span className="text-red-500 font-bold">{userPoints}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">暂无订单记录</p>
            <button
              onClick={() => router.push('/list')}
              className="bg-blue-500 text-white! px-6 py-2 rounded-lg"
            >
              去购物
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 bg-white rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  共 {getTotalItems()} 件商品
                </div>
                <div className="text-lg">
                  <span className="text-gray-600">总消耗：</span>
                  <span className="text-red-500 font-bold">{getTotalPrice()}积分</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {orders.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-3">
                  <div className="flex gap-3 mb-2">
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
                        <p className="text-sm text-gray-600">x{item.quantity}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-xs text-gray-400">
                      下单时间：{new Date(item.created_at).toLocaleString('zh-CN')}
                    </p>
                    <p className="text-sm font-bold text-gray-700">
                      小计：{(item.product.price || 0) * item.quantity}积分
                    </p>
                  </div>
                </div>
              ))}
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
