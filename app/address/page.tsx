'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import { Area } from 'react-vant'
import { areaList } from '@vant/area-data'
import { useAtom } from 'jotai'
import { userInfoAtom, userIdAtom } from '@/store/userStore'
import { cartAtom } from '@/store/cartStore'

export default function AddressPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromCart = searchParams.get('from') === 'cart'

  const [phone, setPhone] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [addressList, setAddressList] = useState<string[]>([])
  const [shippingNote, setShippingNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toasts, success, error: showError, removeToast } = useToast()
  
  const [userId] = useAtom(userIdAtom)
  const [userInfo, setUserInfo] = useAtom(userInfoAtom)
  const [, setCart] = useAtom(cartAtom)

  useEffect(() => {
    if (!userId) {
      showError('请先登录')
      setTimeout(() => router.push('/login'), 1500)
      return
    }
  }, [userId, router])

  useEffect(() => {
    if (userInfo) {
      setPhone(userInfo.phone || '')
      setProvince(userInfo.province || '')
      setCity(userInfo.city || '')
      setDistrict(userInfo.district || '')
      setAddress(userInfo.address || '')
      setShippingNote(userInfo.shipping_note || '')
      
      setAddressList([
        Object.entries(areaList.province_list).find(item => item[1] === userInfo.province)?.[0] || '', 
        Object.entries(areaList.city_list).find(item => item[1] === userInfo.city)?.[0] || '', 
        Object.entries(areaList.county_list).find(item => item[1] === userInfo.district)?.[0] || ''
      ])
    }
  }, [userInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phone || !province || !city || !district || !address) {
      showError('请填写所有必填项')
      return
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showError('请输入正确的手机号')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/users/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          phone,
          province,
          city,
          district,
          address,
          shippingNote
        })
      })

      const data = await response.json()

      if (response.ok) {
        success('地址保存成功')
        
        const updatedUserInfo = userInfo ? { 
          ...userInfo, 
          phone, 
          province, 
          city, 
          district, 
          address, 
          shipping_note: shippingNote 
        } : null
        
        if (updatedUserInfo) {
          setUserInfo(updatedUserInfo)
        }

        if (fromCart) {
          const cartData = localStorage.getItem('pendingOrder')
          if (cartData) {
            const { cartItems, totalPoints } = JSON.parse(cartData)

            const orderResponse = await fetch('/api/orders/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: parseInt(userId!),
                cartItems,
                totalPoints
              })
            })

            const orderData = await orderResponse.json()

            if (orderResponse.ok) {
              setCart([])
              localStorage.removeItem('pendingOrder')
              if (updatedUserInfo) {
                setUserInfo({ ...updatedUserInfo, points: orderData.newPoints })
              }
              success('订单提交成功')
              setTimeout(() => {
                router.push('/orders')
              }, 1500)
            } else {
              showError(orderData.error || '订单提交失败')
              setSubmitting(false)
            }
          } else {
            setTimeout(() => {
              router.push('/cart')
            }, 1500)
          }
        } else {
          setTimeout(() => {
            router.back()
          }, 1500)
        }
      } else {
        showError(data.error || '保存失败')
        setSubmitting(false)
      }
    } catch (error) {
      console.error('Failed to save address:', error)
      showError('网络错误')
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
          <h1 className="text-lg font-bold">填写收货地址</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="bg-white rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              手机号 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
              }}
              placeholder="请输入手机号"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              所在地区 <span className="text-red-500">*</span>
            </label>
            <Area
              popup={{
                round: true,
              }}
              title='省市区选择器'
              value={addressList}
              areaList={areaList}
              onConfirm={(values, result, indexes) => {
                if (values.filter(row => row).length > 2) {
                  setAddressList(values)
                  setProvince(result[0]?.text)
                  setCity(result[1]?.text)
                  setDistrict(result[2]?.text)
                } else {
                  setAddressList([])
                  setProvince('')
                  setCity('')
                  setDistrict('')
                }
              }}
             
            >
              {(_, selectRows, actions) => {
                return (
                  <div
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => actions.open()}
                  >
                    {selectRows.filter(row => row).length > 2 ? selectRows.map(row => row?.text).join(',') : '选择地区'}
                  </div>
                )
              }}
            </Area>
          </div>

          <div >
            <label className="block text-sm font-medium mb-2">
              详细地址 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="请输入详细地址，如街道、门牌号等"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
           
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              邮寄备注（选填）
            </label>
            <textarea
              value={shippingNote}
              onChange={(e) => setShippingNote(e.target.value)}
              placeholder="如有特殊要求可在此备注"
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-500 text-white! py-3 rounded-lg font-medium disabled:bg-gray-400"
        >
          {submitting ? '保存中...' : '保存地址'}
        </button>
      </form>

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
