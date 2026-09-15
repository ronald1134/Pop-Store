import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/auth.js'

const prisma = new PrismaClient()

const products = [
  {
    title: 'One Piece Vol. 1',
    category: 'Mangá',
    price: 29.9,
    image: '/images/catalog/one-piece-vol-1.png',
    description: 'Primeiro volume da aventura mais famosa da cultura pop.',
    rating: 5,
  },
  {
    title: 'O Hobbit',
    category: 'Livro',
    price: 39.9,
    image: '/images/catalog/o-hobbit.png',
    description: 'Uma leitura clássica para fãs de fantasia e aventura.',
    rating: 4,
  },
  {
    title: 'Batman: Ano Um',
    category: 'HQ',
    price: 44.9,
    image: '/images/catalog/batman-ano-um.png',
    description: 'História emblemática do cavaleiro das trevas.',
    rating: 5,
  },
  {
    title: 'Kindle Colorsoft',
    category: 'Kindle',
    price: 329.9,
    image: '/images/catalog/Kindle-Colorsoft.png',
    description: 'Leitura leve, prática, perfeita para fãs de livros digitais.',
    rating: 4,
  },
  {
    title: 'Caneca Geek',
    category: 'Acessório',
    price: 49.9,
    image: '/images/catalog/caneca-geek.png',
    description: 'Caneca com design para quem vive na cultura pop.',
    rating: 4,
  },
  {
    title: 'Dragon Ball',
    category: 'Mangá',
    price: 45,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUXYuzCOjvPE6kZpdhgUkdBOw48hRjIL1_JpIyddsXOQ&s=10',
    description: 'Dragon Ball volume 22',
    rating: 5,
  },
]

async function main() {
  const currentProductTitles = new Set(products.map((product) => product.title))

  const existingProducts = await prisma.product.findMany({
    include: { orderItems: true },
  })

  for (const existingProduct of existingProducts) {
    if (!currentProductTitles.has(existingProduct.title)) {
      if (existingProduct.orderItems.length > 0) {
        await prisma.orderItem.deleteMany({
          where: { productId: existingProduct.id },
        })
      }

      await prisma.product.delete({ where: { id: existingProduct.id } })
    }
  }

  for (const product of products) {
    const existingProduct = await prisma.product.findFirst({
      where: { title: product.title },
    })

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: product,
      })
      continue
    }

    await prisma.product.create({ data: product })
  }

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

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
