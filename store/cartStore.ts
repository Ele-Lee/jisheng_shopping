import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { Product } from '@/types'

export interface CartItem {
  productId: number
  quantity: number
  product: Product
}

export const cartAtom = atomWithStorage<CartItem[]>('cart', [])

export const cartTotalItemsAtom = atom((get) => {
  const cart = get(cartAtom)
  return cart.reduce((sum, item) => sum + item.quantity, 0)
})

export const cartTotalPriceAtom = atom((get) => {
  const cart = get(cartAtom)
  return cart.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0)
})
