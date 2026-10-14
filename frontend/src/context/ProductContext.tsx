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
const catalogImage = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

const demoProducts: Product[] = [
  {
    id: 1,
    title: 'One Piece Vol. 1',
    category: 'Mangá',
    price: 29.9,
    image: catalogImage('images/catalog/one-piece-vol-1.png'),
    description: 'Primeiro volume da aventura mais famosa da cultura pop.',
    rating: 5,
  },
  {
    id: 2,
    title: 'O Hobbit',
    category: 'Livro',
    price: 39.9,
    image: catalogImage('images/catalog/o-hobbit.png'),
    description: 'Uma leitura clássica para fãs de fantasia e aventura.',
    rating: 4,
  },
  {
    id: 3,
    title: 'Batman: Ano Um',
    category: 'HQ',
    price: 44.9,
    image: catalogImage('images/catalog/batman-ano-um.png'),
    description: 'História emblemática do cavaleiro das trevas.',
    rating: 5,
  },
  {
    id: 4,
    title: 'Kindle Colorsoft',
    category: 'Kindle',
    price: 329.9,
    image: catalogImage('images/catalog/Kindle-Colorsoft.png'),
    description: 'Leitura leve, prática, perfeita para fãs de livros digitais.',
    rating: 4,
  },
  {
    id: 5,
    title: 'Caneca Geek',
    category: 'Acessório',
    price: 49.9,
    image: catalogImage('images/catalog/caneca-geek.png'),
    description: 'Caneca com design para quem vive na cultura pop.',
    rating: 4,
  },
  {
    id: 6,
    title: 'Dragon Ball',
    category: 'Mangá',
    price: 45,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUXYuzCOjvPE6kZpdhgUkdBOw48hRjIL1_JpIyddsXOQ&s=10',
    description: 'Dragon Ball volume 22',
    rating: 5,
  },
  {
    id: 9,
    title: 'ben 10 dynamite',
    category: 'HQ',
    price: 37.99,
    image: 'https://www.comicsandsignatures.com/cdn/shop/files/0426DE0608.jpg?v=1775022294',
    description: 'ben 10 reboot',
    rating: 4,
  },
  {
    id: 10,
    title: 'Chainsaw Man Vol. 1',
    category: 'Mangá',
    price: 37.9,
    image: 'https://covers.openlibrary.org/b/isbn/9781974709939-L.jpg',
    description: 'O início da jornada de Denji e Pochita.',
    rating: 4.8,
  },
  {
    id: 11,
    title: 'Demon Slayer Vol. 1',
    category: 'Mangá',
    price: 39.9,
    image: 'https://covers.openlibrary.org/b/isbn/9781974700523-L.jpg',
    description: 'Tanjiro parte em busca de uma cura para sua irmã.',
    rating: 4.9,
  },
  {
    id: 12,
    title: 'Watchmen',
    category: 'HQ',
    price: 89.9,
    image: 'https://covers.openlibrary.org/b/isbn/9781401245252-L.jpg',
    description: 'Uma investigação muda a visão de um grupo de vigilantes.',
    rating: 4.9,
  },
  {
    id: 13,
    title: 'Sandman: Prelúdios e Noturnos',
    category: 'HQ',
    price: 79.9,
    image: 'https://covers.openlibrary.org/b/isbn/9781401225759-L.jpg',
    description: 'O começo da saga de Sonho e dos Perpétuos.',
    rating: 4.8,
  },
  {
    id: 14,
    title: 'Duna',
    category: 'Livro',
    price: 59.9,
    image: 'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg',
    description: 'Intrigas, profecias e disputas pelo planeta Arrakis.',
    rating: 4.7,
  },
  {
    id: 15,
    title: 'Coraline',
    category: 'Livro',
    price: 44.9,
    image: 'https://covers.openlibrary.org/b/isbn/9780380977789-L.jpg',
    description: 'Uma porta secreta leva Coraline a um mundo inquietante.',
    rating: 4.6,
  },
  {
    id: 16,
    title: 'Caderno de Anotações Geek',
    category: 'Acessório',
    price: 34.9,
    image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=85',
    description: 'Caderno para registrar leituras, ideias e coleções.',
    rating: 4.5,
  },
]

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
    if (!API_URL) {
      setProducts(demoProducts)
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/products`)
      if (!response.ok) {
        throw new Error('Não foi possível carregar os produtos da API')
      }

      const data = await response.json()
      setProducts(
        data.map((product: Product) => ({
          ...product,
          image: product.image.startsWith('http') ? product.image : catalogImage(product.image),
        })),
      )
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setProducts(demoProducts)
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
