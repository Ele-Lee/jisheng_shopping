import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export interface UserInfo {
  id: number
  username: string
  department_id: number
  points: number
  duty_count: number
  phone?: string
  province?: string
  city?: string
  district?: string
  address?: string
  shipping_note?: string
  department_name?: string
}

export const userIdAtom = atomWithStorage<string | null>('userId', null)

export const userInfoAtom = atom<UserInfo | null>(null)


export const userPointsAtom = atom(
  (get) => get(userInfoAtom)?.points ?? 0,
  (get, set, points: number) => {
    const user = get(userInfoAtom)
    if (user) {
      set(userInfoAtom, { ...user, points })
    }
  }
)
