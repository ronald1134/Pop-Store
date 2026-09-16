import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { comparePassword, hashPassword, signToken, verifyToken } from './auth.js'

const app = express()
const prisma = new PrismaClient()
const port = Number(process.env.PORT ?? 3001)

// Lista de origens permitidas pelo backend para evitar bloqueios de CORS.
// Isso permite que o frontend, rodando em portas locais diferentes, consiga
// acessar a API sem erro de segurança no navegador.
const allowedOrigins = [
  'http://localhost:5173', // Frontend padrão no Vite
  'http://127.0.0.1:5173', // Frontend acessado pelo IP local
  'http://localhost:5174', // Outra porta local que pode ser usada
  'http://127.0.0.1:5174', // Outra origem local equivalente
]

const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Origem não permitida pelo CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json())

const productSchema = z.object({
  title: z.string().min(2),
  category: z.string().min(2),
  price: z.number().positive(),
  image: z.string().min(1),
  description: z.string().min(10),
  rating: z.number().min(0).max(5),
})

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().min(1),
    }),
  ),
  total: z.number().positive(),
})

const cartItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).default(1),
})

const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não informado' })
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.id } })

    if (!user) {
      return res.status(401).json({ message: 'Usuário inválido' })
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }

    next()
  } catch {
    return res.status(401).json({ message: 'Token inválido' })
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'API funcionando' })
})

app.get('/api/products', async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } })
  res.json(products)
})

app.post('/api/products', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acesso restrito ao administrador' })
  }

  const parsed = productSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  const product = await prisma.product.create({ data: parsed.data })
  res.status(201).json(product)
})

app.put('/api/products/:id', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acesso restrito ao administrador' })
  }

  const productId = Number(req.params.id)
  const parsed = productSchema.safeParse(req.body)

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: 'Produto inválido' })
  }

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: parsed.data,
  })

  res.json(product)
})

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acesso restrito ao administrador' })
  }

  const productId = Number(req.params.id)

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: 'Produto inválido' })
  }

  const orderItems = await prisma.orderItem.count({ where: { productId } })

  if (orderItems > 0) {
    return res.status(409).json({ message: 'Produto usado em pedidos não pode ser excluído' })
  }

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { productId } }),
    prisma.product.delete({ where: { id: productId } }),
  ])

  res.status(204).send()
})

app.get('/api/admin/users', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acesso restrito ao administrador' })
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  res.json(users)
})

app.delete('/api/admin/users/:id', authMiddleware, async (req, res) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acesso restrito ao administrador' })
  }

  const userId = Number(req.params.id)

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Usuário inválido' })
  }

  if (userId === req.user.id) {
    return res.status(400).json({ message: 'O administrador não pode excluir a própria conta' })
  }

  const orders = await prisma.order.count({ where: { userId } })

  if (orders > 0) {
    return res.status(409).json({ message: 'Usuário com pedidos não pode ser excluído' })
  }

  await prisma.user.delete({ where: { id: userId } })
  res.status(204).send()
})

app.post('/api/auth/register', async (req, res) => {
  const parsed = userSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } })

  if (existingUser) {
    return res.status(409).json({ message: 'Usuário já cadastrado' })
  }

  const passwordHash = await hashPassword(parsed.data.password)

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: passwordHash,
      role: 'CUSTOMER',
    },
  })

  const token = signToken(user.id)

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  })
})

app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })

  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' })
  }

  const validPassword = await comparePassword(parsed.data.password, user.password)

  if (!validPassword) {
    return res.status(401).json({ message: 'Credenciais inválidas' })
  }

  const token = signToken(user.id)

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  })
})

app.get('/api/cart', authMiddleware, async (req, res) => {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: req.user!.id },
    include: { product: true },
    orderBy: { createdAt: 'asc' },
  })

  res.json(cartItems)
})

app.post('/api/cart/items', authMiddleware, async (req, res) => {
  const parsed = cartItemSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } })

  if (!product) {
    return res.status(404).json({ message: 'Produto não encontrado' })
  }

  const cartItem = await prisma.cartItem.upsert({
    where: {
      userId_productId: {
        userId: req.user!.id,
        productId: parsed.data.productId,
      },
    },
    update: { quantity: { increment: parsed.data.quantity } },
    create: {
      userId: req.user!.id,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
    },
    include: { product: true },
  })

  res.status(201).json(cartItem)
})

app.delete('/api/cart/items/:productId', authMiddleware, async (req, res) => {
  const productId = Number(req.params.productId)

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: 'Produto inválido' })
  }

  await prisma.cartItem.deleteMany({
    where: { userId: req.user!.id, productId },
  })

  res.status(204).send()
})

app.delete('/api/cart', authMiddleware, async (req, res) => {
  await prisma.cartItem.deleteMany({ where: { userId: req.user!.id } })
  res.status(204).send()
})

app.post('/api/orders', authMiddleware, async (req, res) => {
  const parsed = orderSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  const order = await prisma.order.create({
    data: {
      userId: req.user!.id,
      total: parsed.data.total,
      items: {
        create: parsed.data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  res.status(201).json(order)
})

app.get('/api/orders', authMiddleware, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  res.json(orders)
})

app.post('/api/payments/checkout', authMiddleware, async (req, res) => {
  const { total } = req.body as { total: number }

  if (!total || total <= 0) {
    return res.status(400).json({ message: 'Total inválido' })
  }

  res.json({
    ok: true,
    paymentId: `pay_${Date.now()}`,
    status: 'approved',
    total,
  })
})

async function ensureDemoAdmin() {
  const adminPassword = await hashPassword('admin123')

  await prisma.user.upsert({
    where: { email: 'admin@culturepop.com' },
    update: {
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
    create: {
      name: 'Administrador',
      email: 'admin@culturepop.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
}

async function startServer() {
  await ensureDemoAdmin()

  app.listen(port, () => {
    console.log(`Backend rodando em http://localhost:${port}`)
  })
}

startServer().catch((error) => {
  console.error('Erro ao iniciar backend:', error)
  process.exit(1)
})
