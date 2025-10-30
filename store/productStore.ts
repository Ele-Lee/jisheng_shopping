import { atom } from 'jotai'
import { Product } from '@/types'

export const productsAtom = atom<Product[]>([])

export const productsLoadedAtom = atom<boolean>(false)
