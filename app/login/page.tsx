'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { useSetAtom } from 'jotai'
import { userIdAtom } from '@/store/userStore'

interface Department {
  id: number
  name: string
}

export default function LoginPage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [username, setUsername] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [loading, setLoading] = useState(false)
  const setUserId = useSetAtom(userIdAtom)

  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => setDepartments(data.departments || []))
      .catch(err => console.error('Failed to fetch departments:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/auth/login?username=${encodeURIComponent(username)}&departmentId=${encodeURIComponent(departmentId)}`)

      const data = await response.json()

      if (response.ok) {
        toast.success('登录成功！')
        console.log('User data:', data.user)
        setUserId(data.user.id.toString())
        localStorage.setItem('username', data.user.username)
        setTimeout(() => {
          router.push('/list')
        }, 500)
      } else {
        toast.error(data.error || '登录失败')
      }
    } catch (error) {
      toast.error('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <Toaster position="top-center" />
      <div className="max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-800">情报指挥中心</h1>
          <p className="text-gray-600">中秋国庆值班慰问选品</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">姓名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base placeholder:text-gray-500 transition"
              placeholder="请输入姓名"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">选择部门</label>
            <div className="relative">
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white appearance-none transition"
                required
              >
                <option value="">请选择部门</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white! py-3 rounded-lg active:bg-blue-700 transition-colors text-base font-medium disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
