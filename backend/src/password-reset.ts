import express from 'express'
import type { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { hashPassword } from './auth.js'

const passwordResetSchema = z.object({
  newPassword: z.string().min(8),
})

export function createPasswordResetRouter(
  prisma: PrismaClient,
  authMiddleware: express.RequestHandler,
) {
  const router = express.Router()

  router.patch('/users/:id/password', authMiddleware, async (req, res) => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Acesso restrito ao administrador' })
    }

    const userId = Number(req.params.id)

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Usuário inválido' })
    }

    const parsed = passwordResetSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' })
    }

    // Armazena somente o hash e nunca retorna a senha ou o hash na resposta.
    await prisma.user.update({
      where: { id: userId },
      data: { password: await hashPassword(parsed.data.newPassword) },
    })

    res.json({ message: 'Senha redefinida com sucesso' })
  })

  return router
}