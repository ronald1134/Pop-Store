import express from 'express'
import type { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const metricsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '12m']).default('30d'),
})

const orderStatuses = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const

type Period = z.infer<typeof metricsQuerySchema>['period']

function getPeriodStart(period: Period, now: Date) {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )

  if (period === '7d') {
    start.setUTCDate(start.getUTCDate() - 6)
  } else if (period === '30d') {
    start.setUTCDate(start.getUTCDate() - 29)
  } else {
    start.setUTCDate(1)
    start.setUTCMonth(start.getUTCMonth() - 11)
  }

  return start
}

function getBucketKey(date: Date, period: Period) {
  const day = date.toISOString().slice(0, 10)
  return period === '12m' ? day.slice(0, 7) : day
}

function getBucketKeys(period: Period, start: Date, now: Date) {
  const keys: string[] = []
  const cursor = new Date(start)

  while (cursor <= now) {
    keys.push(getBucketKey(cursor, period))
    if (period === '12m') {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    } else {
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  return keys
}

export function createAdminMetricsRouter(
  prisma: PrismaClient,
  authMiddleware: express.RequestHandler,
) {
  const router = express.Router()

  router.get('/metrics', authMiddleware, async (req, res) => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Acesso restrito ao administrador' })
    }

    const parsed = metricsQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() })
    }

    const now = new Date()
    const startDate = getPeriodStart(parsed.data.period, now)
    const where = { createdAt: { gte: startDate } }

    const [revenue, statusGroups, orders, productGroups] = await Promise.all([
      prisma.order.aggregate({
        where,
        _sum: { total: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      prisma.order.findMany({
        where,
        select: { createdAt: true, total: true },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { createdAt: { gte: startDate } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ])

    const sales = new Map<string, { revenue: number; orders: number }>()
    for (const order of orders) {
      const key = getBucketKey(order.createdAt, parsed.data.period)
      const bucket = sales.get(key) ?? { revenue: 0, orders: 0 }
      bucket.revenue += order.total
      bucket.orders += 1
      sales.set(key, bucket)
    }

    const statusCounts = new Map(
      statusGroups.map((group) => [group.status, group._count._all]),
    )
    const ordersByStatus: Array<{ status: string; count: number }> = orderStatuses.map((status) => ({
      status,
      count: statusCounts.get(status) ?? 0,
    }))
    const knownStatuses = new Set<string>(orderStatuses)
    for (const group of statusGroups) {
      if (!knownStatuses.has(group.status)) {
        ordersByStatus.push({ status: group.status, count: group._count._all })
      }
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productGroups.map((group) => group.productId) } },
      select: { id: true, title: true },
    })
    const productTitles = new Map(products.map((product) => [product.id, product.title]))
    const topProducts = productGroups.map((group) => ({
      productId: group.productId,
      title: productTitles.get(group.productId) ?? 'Produto removido',
      quantity: group._sum.quantity ?? 0,
    }))

    const salesByPeriod = getBucketKeys(
      parsed.data.period,
      startDate,
      now,
    ).map((date) => ({
      date,
      revenue: Math.round((sales.get(date)?.revenue ?? 0) * 100) / 100,
      orders: sales.get(date)?.orders ?? 0,
    }))

    res.json({
      period: parsed.data.period,
      revenueTotal: Math.round((revenue._sum.total ?? 0) * 100) / 100,
      salesByPeriod,
      ordersByStatus,
      topProducts,
    })
  })

  return router
}
