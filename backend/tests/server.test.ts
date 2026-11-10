import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AddressInfo } from 'node:net'
import type { PrismaClient } from '@prisma/client'
import { createApp } from '../src/server.js'
import { signToken } from '../src/auth.js'

type TestUser = {
  id: number
  name: string
  email: string
  password: string
  role: string
  createdAt: Date
}

type TestProduct = {
  id: number
  title: string
  category: string
  price: number
  image: string
  description: string
  rating: number
  createdAt: Date
}

function createTestDatabase() {
  const users = new Map<number, TestUser>()
  const products = new Map<number, TestProduct>()
  const cartItems = new Map<
    string,
    {
      id: number
      userId: number
      productId: number
      quantity: number
      createdAt: Date
      updatedAt: Date
    }
  >()
  const favorites = new Map<string, {
    id: number
    userId: number
    productId: number
    createdAt: Date
  }>()
  const reviews = new Map<string, {
    id: number
    userId: number
    productId: number
    rating: number
    comment: string
    createdAt: Date
    updatedAt: Date
  }>()
  const orders: Array<{
    id: number
    userId: number
    subtotal: number
    shipping: number
    total: number
    createdAt: Date
    items: Array<{
      productId: number
      quantity: number
      product: TestProduct | undefined
    }>
  }> = []
  let nextUserId = 1
  let nextProductId = 1
  let nextCartItemId = 1
  let nextFavoriteId = 1
  let nextReviewId = 1
  let nextOrderId = 1

  const addUser = (
    values: Partial<TestUser> & Pick<TestUser, 'email' | 'role'>,
  ) => {
    const user: TestUser = {
      id: values.id ?? nextUserId++,
      name: values.name ?? 'Usuário de teste',
      email: values.email,
      password: values.password ?? 'hash-de-teste',
      role: values.role,
      createdAt: values.createdAt ?? new Date(),
    }
    users.set(user.id, user)
    return user
  }

  const sampleProduct = {
    title: 'Livro de teste',
    category: 'Livro',
    price: 25,
    image: '/images/livro.png',
    description: 'Descrição do produto de teste',
    rating: 5,
    createdAt: new Date(),
  }
  products.set(nextProductId, { id: nextProductId++, ...sampleProduct })

  const prismaMock = {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.id !== undefined) return users.get(where.id) ?? null
        return (
          [...users.values()].find((user) => user.email === where.email) ?? null
        )
      },
      create: async ({ data }: any) => addUser(data),
      update: async ({ where, data }: any) => {
        const user = users.get(where.id)
        if (!user) throw new Error('Usuário não encontrado')
        const updatedUser = { ...user, ...data }
        users.set(where.id, updatedUser)
        return updatedUser
      },
      findMany: async ({ where = {} }: any = {}) =>
        [...users.values()].filter(
          (user) => !where.role || user.role === where.role,
        ),
      delete: async ({ where }: any) => {
        const user = users.get(where.id)
        if (user) users.delete(where.id)
        return user
      },
    },
    product: {
      findMany: async ({ include }: any = {}) =>
        [...products.values()].map((product) =>
          include?.reviews
            ? {
                ...product,
                reviews: [...reviews.values()]
                  .filter((review) => review.productId === product.id)
                  .map((review) => ({ rating: review.rating })),
              }
            : product,
        ),
      findUnique: async ({ where }: any) => products.get(where.id) ?? null,
      create: async ({ data }: any) => {
        const product = { id: nextProductId++, ...data, createdAt: new Date() }
        products.set(product.id, product)
        return product
      },
      update: async ({ where, data }: any) => {
        const product = { ...products.get(where.id)!, ...data }
        products.set(product.id, product)
        return product
      },
      delete: async ({ where }: any) => {
        const product = products.get(where.id)
        if (product) products.delete(where.id)
        return product
      },
    },
    favorite: {
      findMany: async ({ where }: any) =>
        [...favorites.values()]
          .filter((favorite) => favorite.userId === where.userId)
          .map((favorite) => ({ ...favorite, product: products.get(favorite.productId) })),
      upsert: async ({ where, create }: any) => {
        const key = `${where.userId_productId.userId}:${where.userId_productId.productId}`
        let favorite = favorites.get(key)
        if (!favorite) {
          favorite = { id: nextFavoriteId++, ...create, createdAt: new Date() }
          favorites.set(key, favorite!)
        }
        return { ...favorite!, product: products.get(favorite!.productId) }
      },
      deleteMany: async ({ where }: any) => {
        for (const [key, favorite] of favorites) {
          if (favorite.userId === where.userId && favorite.productId === where.productId) {
            favorites.delete(key)
          }
        }
        return { count: 1 }
      },
    },
    review: {
      findMany: async ({ where }: any) =>
        [...reviews.values()]
          .filter((review) => review.productId === where.productId)
          .map((review) => ({
            ...review,
            user: { name: users.get(review.userId)?.name ?? 'Usuário de teste' },
          })),
      upsert: async ({ where, update, create }: any) => {
        const key = `${where.userId_productId.userId}:${where.userId_productId.productId}`
        const existing = reviews.get(key)
        const review = existing
          ? { ...existing, ...update, updatedAt: new Date() }
          : {
              id: nextReviewId++,
              ...create,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
        reviews.set(key, review)
        return {
          ...review,
          user: { name: users.get(review.userId)?.name ?? 'Usuário de teste' },
        }
      },
      aggregate: async ({ where }: any) => {
        const productReviews = [...reviews.values()].filter(
          (review) => review.productId === where.productId,
        )
        return {
          _avg: {
            rating: productReviews.length
              ? productReviews.reduce((sum, review) => sum + review.rating, 0) /
                productReviews.length
              : null,
          },
        }
      },
    },
    cartItem: {
      findMany: async ({ where }: any) =>
        [...cartItems.values()]
          .filter((item) => item.userId === where.userId)
          .map((item) => ({ ...item, product: products.get(item.productId) })),
      upsert: async ({ where, update, create }: any) => {
        const key = `${where.userId_productId.userId}:${where.userId_productId.productId}`
        const existing = cartItems.get(key)
        const item = existing
          ? {
              ...existing,
              quantity: existing.quantity + update.quantity.increment,
              updatedAt: new Date(),
            }
          : {
              id: nextCartItemId++,
              ...create,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
        cartItems.set(key, item)
        return { ...item, product: products.get(item.productId) }
      },
      deleteMany: async ({ where }: any) => {
        for (const [key, item] of cartItems) {
          if (
            (!where.userId || item.userId === where.userId) &&
            (!where.productId || item.productId === where.productId)
          ) {
            cartItems.delete(key)
          }
        }
        return { count: 1 }
      },
    },
    orderItem: {
      count: async () => 0,
    },
    order: {
      count: async ({ where }: any) =>
        orders.filter((order) => order.userId === where.userId).length,
      create: async ({ data }: any) => {
        const order = {
          id: nextOrderId++,
          userId: data.userId,
          subtotal: data.subtotal,
          shipping: data.shipping,
          total: data.total,
          createdAt: new Date(),
          items: data.items.create.map(
            (item: { productId: number; quantity: number }) => ({
              ...item,
              product: products.get(item.productId),
            }),
          ),
        }
        orders.push(order)
        return order
      },
      findMany: async ({ where }: any) =>
        orders.filter((order) => order.userId === where.userId),
    },
    $transaction: async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
  }

  return { prisma: prismaMock as unknown as PrismaClient, addUser }
}

async function withApi(
  prisma: PrismaClient,
  run: (baseUrl: string) => Promise<void>,
) {
  const server = createApp(prisma).listen(0, '127.0.0.1')
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })

  const address = server.address() as AddressInfo
  const baseUrl = `http://127.0.0.1:${address.port}`

  try {
    await run(baseUrl)
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}

function jsonRequest(body: unknown, token?: string): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }
}

test('cadastro valida os dados, evita duplicidade e permite login', async () => {
  const { prisma } = createTestDatabase()

  await withApi(prisma, async (baseUrl) => {
    const invalidResponse = await fetch(
      `${baseUrl}/api/auth/register`,
      jsonRequest({
        name: 'Usuária',
        email: 'email-inválido',
        password: 'senha123',
      }),
    )
    assert.equal(invalidResponse.status, 400)

    const registration = {
      name: 'Usuária de teste',
      email: 'teste@example.com',
      password: 'senha123',
    }
    const registrationResponse = await fetch(
      `${baseUrl}/api/auth/register`,
      jsonRequest(registration),
    )
    assert.equal(registrationResponse.status, 201)

    const registered = (await registrationResponse.json()) as {
      token: string
      user: Record<string, unknown>
    }
    assert.ok(registered.token)
    assert.equal(registered.user.email, registration.email)
    assert.equal(registered.user.role, 'CUSTOMER')
    assert.equal('password' in registered.user, false)

    const duplicateResponse = await fetch(
      `${baseUrl}/api/auth/register`,
      jsonRequest(registration),
    )
    assert.equal(duplicateResponse.status, 409)

    const loginResponse = await fetch(
      `${baseUrl}/api/auth/login`,
      jsonRequest({
        email: registration.email,
        password: registration.password,
      }),
    )
    assert.equal(loginResponse.status, 200)

    const rejectedLogin = await fetch(
      `${baseUrl}/api/auth/login`,
      jsonRequest({
        email: registration.email,
        password: 'senha-incorreta',
      }),
    )
    assert.equal(rejectedLogin.status, 401)
  })
})

test('favoritos exigem autenticação e ficam isolados por usuário', async () => {
    const database = createTestDatabase()
    const firstUser = database.addUser({
      email: 'favorito@example.com',
      role: 'CUSTOMER',
    })
    const secondUser = database.addUser({
      email: 'outro-favorito@example.com',
      role: 'CUSTOMER',
    })

    await withApi(database.prisma, async (baseUrl) => {
      const anonymousResponse = await fetch(`${baseUrl}/api/favorites`)
      assert.equal(anonymousResponse.status, 401)

      const addResponse = await fetch(`${baseUrl}/api/favorites/1`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${signToken(firstUser.id)}` },
      })
      assert.equal(addResponse.status, 201)
      assert.equal((await addResponse.json()).product.id, 1)

      const firstFavoritesResponse = await fetch(`${baseUrl}/api/favorites`, {
        headers: { Authorization: `Bearer ${signToken(firstUser.id)}` },
      })
      assert.equal((await firstFavoritesResponse.json()).length, 1)

      const secondFavoritesResponse = await fetch(`${baseUrl}/api/favorites`, {
        headers: { Authorization: `Bearer ${signToken(secondUser.id)}` },
      })
      assert.equal((await secondFavoritesResponse.json()).length, 0)

      const missingProductResponse = await fetch(`${baseUrl}/api/favorites/999`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${signToken(firstUser.id)}` },
      })
      assert.equal(missingProductResponse.status, 404)

      const removeResponse = await fetch(`${baseUrl}/api/favorites/1`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${signToken(firstUser.id)}` },
      })
      assert.equal(removeResponse.status, 204)
      const afterRemoval = await fetch(`${baseUrl}/api/favorites`, {
        headers: { Authorization: `Bearer ${signToken(firstUser.id)}` },
      })
      assert.equal((await afterRemoval.json()).length, 0)
    })
})

test('avaliações são públicas, exigem autenticação para envio e atualizam a nota', async () => {
  const database = createTestDatabase()
  const firstUser = database.addUser({ email: 'avaliacao@example.com', role: 'CUSTOMER' })
  const secondUser = database.addUser({ email: 'outra-avaliacao@example.com', role: 'CUSTOMER' })

  await withApi(database.prisma, async (baseUrl) => {
    const anonymousPost = await fetch(`${baseUrl}/api/products/1/reviews`, jsonRequest({ rating: 5, comment: 'Muito bom' }))
    assert.equal(anonymousPost.status, 401)

    const invalidRating = await fetch(`${baseUrl}/api/products/1/reviews`, jsonRequest({ rating: 6, comment: 'Muito bom' }, signToken(firstUser.id)))
    assert.equal(invalidRating.status, 400)

    const firstReview = await fetch(`${baseUrl}/api/products/1/reviews`, jsonRequest({ rating: 4, comment: 'Gostei bastante' }, signToken(firstUser.id)))
    assert.equal(firstReview.status, 201)

    const secondReview = await fetch(`${baseUrl}/api/products/1/reviews`, jsonRequest({ rating: 2, comment: 'Esperava mais' }, signToken(secondUser.id)))
    assert.equal(secondReview.status, 201)

    const listResponse = await fetch(`${baseUrl}/api/products/1/reviews`)
    const list = await listResponse.json()
    assert.equal(list.totalReviews, 2)
    assert.equal(list.averageRating, 3)

    const updateReview = await fetch(`${baseUrl}/api/products/1/reviews`, jsonRequest({ rating: 5, comment: 'Mudei de ideia, adorei' }, signToken(firstUser.id)))
    assert.equal(updateReview.status, 201)

    const updatedListResponse = await fetch(`${baseUrl}/api/products/1/reviews`)
    const updatedList = await updatedListResponse.json()
    assert.equal(updatedList.totalReviews, 2)
    assert.equal(updatedList.averageRating, 3.5)

    const productsResponse = await fetch(`${baseUrl}/api/products`)
    const products = await productsResponse.json()
    assert.equal(products[0].rating, 3.5)
  })
})

test('carrinho exige autenticação e mantém os itens isolados por usuário', async () => {
  const database = createTestDatabase()
  const firstUser = database.addUser({ email: 'primeiro@example.com', role: 'CUSTOMER' })
  const secondUser = database.addUser({ email: 'segundo@example.com', role: 'CUSTOMER' })

  await withApi(database.prisma, async (baseUrl) => {
    const anonymousResponse = await fetch(`${baseUrl}/api/cart`)
    assert.equal(anonymousResponse.status, 401)

    const addResponse = await fetch(`${baseUrl}/api/cart/items`, jsonRequest({ productId: 1 }, signToken(firstUser.id)))
    assert.equal(addResponse.status, 201)

    const firstCartResponse = await fetch(`${baseUrl}/api/cart`, {
      headers: { Authorization: `Bearer ${signToken(firstUser.id)}` },
    })
    assert.equal((await firstCartResponse.json()).length, 1)

    const secondCartResponse = await fetch(`${baseUrl}/api/cart`, {
      headers: { Authorization: `Bearer ${signToken(secondUser.id)}` },
    })
    assert.equal((await secondCartResponse.json()).length, 0)

    const missingProductResponse = await fetch(`${baseUrl}/api/cart/items`, jsonRequest({ productId: 999 }, signToken(firstUser.id)))
    assert.equal(missingProductResponse.status, 404)
  })
})
test('pedidos exigem autenticação e ficam associados ao usuário autenticado', async () => {
  const database = createTestDatabase()
  const firstUser = database.addUser({
    email: 'cliente@example.com',
    role: 'CUSTOMER',
  })
  const secondUser = database.addUser({
    email: 'outro@example.com',
    role: 'CUSTOMER',
  })

  await withApi(database.prisma, async (baseUrl) => {
    const anonymousResponse = await fetch(
      `${baseUrl}/api/orders`,
      jsonRequest({ items: [], total: 25 }),
    )
    assert.equal(anonymousResponse.status, 401)

    const invalidOrderResponse = await fetch(
      `${baseUrl}/api/orders`,
      jsonRequest(
        { items: [{ productId: 1, quantity: 0 }], total: 25 },
        signToken(firstUser.id),
      ),
    )
    assert.equal(invalidOrderResponse.status, 400)

    const orderResponse = await fetch(
      `${baseUrl}/api/orders`,
      jsonRequest(
        { items: [{ productId: 1, quantity: 2 }], total: 1 },
        signToken(firstUser.id),
      ),
    )
    assert.equal(orderResponse.status, 201)
    const order = await orderResponse.json()
    assert.equal(order.subtotal, 50)
    assert.equal(order.shipping, 19.9)
    assert.equal(order.total, 69.9)

    const quoteResponse = await fetch(
      `${baseUrl}/api/checkout/quote`,
      jsonRequest({ items: [{ productId: 1, quantity: 2 }], total: 1 }),
    )
    assert.equal(quoteResponse.status, 200)
    assert.deepEqual(await quoteResponse.json(), {
      subtotal: 50,
      shipping: 19.9,
      total: 69.9,
    })

    const paymentResponse = await fetch(
      `${baseUrl}/api/payments/checkout`,
      jsonRequest(
        { items: [{ productId: 1, quantity: 2 }], total: 1 },
        signToken(firstUser.id),
      ),
    )
    assert.equal(paymentResponse.status, 200)
    assert.equal((await paymentResponse.json()).total, 69.9)

    const firstOrdersResponse = await fetch(`${baseUrl}/api/orders`, {
      headers: { Authorization: `Bearer ${signToken(firstUser.id)}` },
    })
    assert.equal((await firstOrdersResponse.json()).length, 1)

    const secondOrdersResponse = await fetch(`${baseUrl}/api/orders`, {
      headers: { Authorization: `Bearer ${signToken(secondUser.id)}` },
    })
    assert.equal((await secondOrdersResponse.json()).length, 0)
  })
})

test('somente administradores podem acessar as rotas de gestão', async () => {
  const database = createTestDatabase()
  const customer = database.addUser({
    email: 'cliente@example.com',
    role: 'CUSTOMER',
  })
  const admin = database.addUser({ email: 'admin@example.com', role: 'ADMIN' })
  const product = {
    title: 'Novo produto',
    category: 'Livro',
    price: 40,
    image: '/images/novo-produto.png',
    description: 'Descrição válida para o novo produto',
    rating: 4,
  }

  await withApi(database.prisma, async (baseUrl) => {
    const deniedResponse = await fetch(
      `${baseUrl}/api/products`,
      jsonRequest(product, signToken(customer.id)),
    )
    assert.equal(deniedResponse.status, 403)

    const allowedResponse = await fetch(
      `${baseUrl}/api/products`,
      jsonRequest(product, signToken(admin.id)),
    )
    assert.equal(allowedResponse.status, 201)

    const deniedUserList = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${signToken(customer.id)}` },
    })
    assert.equal(deniedUserList.status, 403)

    const deniedPasswordReset = await fetch(
      `${baseUrl}/api/admin/users/${customer.id}/password`,
      {
        ...jsonRequest({ newPassword: 'senhaNovaSegura' }, signToken(customer.id)),
        method: 'PATCH',
      },
    )
    assert.equal(deniedPasswordReset.status, 403)

    const resetResponse = await fetch(
      `${baseUrl}/api/admin/users/${customer.id}/password`,
      {
        ...jsonRequest({ newPassword: 'senhaNovaSegura' }, signToken(admin.id)),
        method: 'PATCH',
      },
    )
    assert.equal(resetResponse.status, 200)
    assert.deepEqual(await resetResponse.json(), {
      message: 'Senha redefinida com sucesso',
    })

    const loginWithNewPassword = await fetch(
      `${baseUrl}/api/auth/login`,
      jsonRequest({ email: customer.email, password: 'senhaNovaSegura' }),
    )
    assert.equal(loginWithNewPassword.status, 200)

    const rejectedShortPassword = await fetch(
      `${baseUrl}/api/admin/users/${customer.id}/password`,
      {
        ...jsonRequest({ newPassword: 'curta' }, signToken(admin.id)),
        method: 'PATCH',
      },
    )
    assert.equal(rejectedShortPassword.status, 400)
  })
})

test('CORS permite as origens configuradas no ambiente', async () => {
  const previousCorsOrigin = process.env.CORS_ORIGIN
  process.env.CORS_ORIGIN = 'https://loja.example.com'
  const { prisma } = createTestDatabase()

  try {
    await withApi(prisma, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/health`, {
        headers: { Origin: 'https://loja.example.com' },
      })

      assert.equal(response.status, 200)
      assert.equal(
        response.headers.get('access-control-allow-origin'),
        'https://loja.example.com',
      )
    })
  } finally {
    if (previousCorsOrigin === undefined) {
      delete process.env.CORS_ORIGIN
    } else {
      process.env.CORS_ORIGIN = previousCorsOrigin
    }
  }
})
