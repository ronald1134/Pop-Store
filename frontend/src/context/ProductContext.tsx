import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { API_URL } from '../services/api'

export type Product = {
  id: number
  title: string
  category: 'Mangá' | 'Livro' | 'HQ' | 'Kindle' | 'Acessório'
  price: number
  image: string
  description: string
  rating: number
}

export type UserProfile = {
  id: number
  name: string
  email: string
  role: string
}

type ProductContextType = {
  products: Product[]
  cart: Product[]
  user: UserProfile | null
  token: string
  isAdmin: boolean
  isAuthenticated: boolean
  addToCart: (product: Product) => void
  removeFromCart: (id: number) => void
  clearCart: () => void
  total: number
  loading: boolean
  refreshProducts: () => Promise<void>
  loginSession: (payload: { token: string; user: UserProfile }) => void
  logout: () => void
}

const AUTH_STORAGE_KEY = 'culturePopAuth'
const CART_STORAGE_KEY = 'culturePopCart'

const ProductContext = createContext<ProductContextType>({
  products: [],
  cart: [],
  user: null,
  token: '',
  isAdmin: false,
  isAuthenticated: false,
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  total: 0,
  loading: true,
  refreshProducts: async () => {},
  loginSession: () => {},
  logout: () => {},
})

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

const readStoredCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Product[]) : []
  } catch {
    return []
  }
}

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<Product[]>(() => readStoredCart())
  const [user, setUser] = useState<UserProfile | null>(() => readStoredUser())
  const [token, setToken] = useState(() => localStorage.getItem('culturePopToken') ?? '')
  const [loading, setLoading] = useState(true)

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`)
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [user])

  useEffect(() => {
    if (token) {
      localStorage.setItem('culturePopToken', token)
    } else {
      localStorage.removeItem('culturePopToken')
    }
  }, [token])

  const addToCart = (product: Product) => {
    setCart((prev) => [...prev, product])
  }

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
  }

  const loginSession = ({ token: nextToken, user: nextUser }: { token: string; user: UserProfile }) => {
    setToken(nextToken)
    setUser(nextUser)
  }

  const logout = () => {
    setUser(null)
    setToken('')
    setCart([])
  }

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price, 0),
    [cart],
  )

  return (
    <ProductContext.Provider
      value={{
        products,
        cart,
        user,
        token,
        isAdmin: user?.role === 'ADMIN',
        isAuthenticated: Boolean(user),
        addToCart,
        removeFromCart,
        clearCart,
        total,
        loading,
        refreshProducts: loadProducts,
        loginSession,
        logout,
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  return useContext(ProductContext)
}
