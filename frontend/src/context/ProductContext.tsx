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
  addToCart: (product: Product) => Promise<void>
  removeFromCart: (id: number) => Promise<void>
  clearCart: () => Promise<void>
  total: number
  loading: boolean
  refreshProducts: () => Promise<void>
  loginSession: (payload: { token: string; user: UserProfile }) => Promise<void>
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
  addToCart: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
  total: 0,
  loading: true,
  refreshProducts: async () => {},
  loginSession: async () => {},
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
    if (user) {
      localStorage.removeItem(CART_STORAGE_KEY)
      return
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart, user])

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

  const loadUserCart = async (authToken: string) => {
    const response = await fetch(`${API_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    if (!response.ok) {
      throw new Error('Não foi possível carregar o carrinho')
    }

    const data = (await response.json()) as Array<{ product: Product; quantity: number }>
    setCart(data.flatMap((item) => Array.from({ length: item.quantity }, () => item.product)))
  }

  useEffect(() => {
    if (user && token) {
      loadUserCart(token).catch((error) => console.error(error))
    }
  }, [])

  const addToCart = async (product: Product) => {
    if (user && token) {
      const response = await fetch(`${API_URL}/api/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      })

      if (!response.ok) {
        throw new Error('Não foi possível reservar o produto')
      }
    }

    setCart((prev) => [...prev, product])
  }

  const removeFromCart = async (id: number) => {
    if (user && token) {
      const response = await fetch(`${API_URL}/api/cart/items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Não foi possível remover o produto')
      }
    }

    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const clearCart = async () => {
    if (user && token) {
      const response = await fetch(`${API_URL}/api/cart`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Não foi possível limpar o carrinho')
      }
    }

    setCart([])
  }

  const loginSession = async ({ token: nextToken, user: nextUser }: { token: string; user: UserProfile }) => {
    const productQuantities = Object.entries(
      cart.reduce<Record<number, number>>((acc, item) => {
        acc[item.id] = (acc[item.id] ?? 0) + 1
        return acc
      }, {}),
    )

    try {
      await Promise.all(
        productQuantities.map(([productId, quantity]) =>
          fetch(`${API_URL}/api/cart/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${nextToken}`,
            },
            body: JSON.stringify({ productId: Number(productId), quantity }),
          }).then((response) => {
            if (!response.ok) {
              throw new Error('Não foi possível sincronizar o carrinho')
            }
          }),
        ),
      )
      await loadUserCart(nextToken)
    } catch (error) {
      console.error(error)
    }

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
