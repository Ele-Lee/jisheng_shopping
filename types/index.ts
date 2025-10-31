export interface Department {
  id: number
  name: string
  description: string | null
  created_at: Date
  updated_at: Date
}

export interface User {
  id: number
  username: string
  department_id: number | null
  points: number
  recipient?: string | null
  phone?: string | null
  province?: string | null
  city?: string | null
  district?: string | null
  address?: string | null
  shipping_note?: string | null
  created_at: Date
  updated_at: Date
}

export interface UserWithDepartment extends User {
  department: Department | null
}

export interface Product {
  id: number
  category?: string | null
  brand?: string | null
  name: string
  specification?: string | null
  packageQuantity?: number
  shippingFrom?: string | null
  courierName?: string | null
  shippingRestrictions?: string | null
  marketPrice?: string | number | null
  price?: number
  jdLink?: string | null
  features?: string | null
  productCode?: string | null
  image?: string | null
  stock?: number
  created_at?: Date
  updated_at?: Date
}

export interface CartItem {
  id: number
  user_id: number
  product_id: number
  quantity: number
  created_at: Date
  updated_at: Date
}

export interface CartItemWithProduct extends CartItem {
  product: Product
}
