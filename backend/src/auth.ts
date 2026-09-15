import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET ?? 'cultura-pop-secret'

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signToken(userId: number) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { id: number }
}
