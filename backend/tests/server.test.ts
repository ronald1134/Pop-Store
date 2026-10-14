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
  const orders: Array<{
    id: number
    userId: number
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
      findMany: async () => [...products.values()],
      findUnique: async ({ where }: any) => products.get(where.id) ?? null,
      create: async ({ data }: any) => {
        const product = { id: nextProductId++, ...data, createdAt: new Date() }
        products.set(product.id, product)
        return product
      },
      update: async ({ where, data }: any) => {
        const product = { ...products.get(where.id), ...data }
        products.set(where.id, product)
        return product
      },
      delete: async ({ where }: any) => {
        const product = products.get(where.id)
        if (product) products.delete(where.id)
        return product
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

test('carrinho exige autenticação e mantém os itens isolados por usuário', async () => {
  const database = createTestDatabase()
  const firstUser = database.addUser({
    email: 'primeiro@example.com',
    role: 'CUSTOMER',
  })
  const secondUser = database.addUser({
    email: 'segundo@example.com',
    role: 'CUSTOMER',
  })

  await withApi(database.prisma, async (baseUrl) => {
    const anonymousResponse = await fetch(`${baseUrl}/api/cart`)
    assert.equal(anonymousResponse.status, 401)

    const addResponse = await fetch(
      `${baseUrl}/api/cart/items`,
      jsonRequest({ productId: 1 }, signToken(firstUser.id)),
    )
    assert.equal(addResponse.status, 201)

    const firstCartResponse = await fetch(`${baseUrl}/api/cart`, {
      headers: { Authorization: `Bearer ${signToken(firstUser.id)}` },
    })
    assert.equal((await firstCartResponse.json()).length, 1)

    const secondCartResponse = await fetch(`${baseUrl}/api/cart`, {
      headers: { Authorization: `Bearer ${signToken(secondUser.id)}` },
    })
    assert.equal((await secondCartResponse.json()).length, 0)

    const missingProductResponse = await fetch(
      `${baseUrl}/api/cart/items`,
      jsonRequest({ productId: 999 }, signToken(firstUser.id)),
    )
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
        { items: [{ productId: 1, quantity: 2 }], total: 50 },
        signToken(firstUser.id),
      ),
    )
    assert.equal(orderResponse.status, 201)

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
