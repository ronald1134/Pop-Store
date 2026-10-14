import 'dotenv/config'
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
  {
    title: 'ben 10 dynamite',
    category: 'HQ',
    price: 37.99,
    image: 'https://www.comicsandsignatures.com/cdn/shop/files/0426DE0608.jpg?v=1775022294',
    description: 'ben 10 reboot',
    rating: 4,
  },
  {
    title: 'Chainsaw Man Vol. 1',
    category: 'Mangá',
    price: 37.9,
    image: 'https://covers.openlibrary.org/b/isbn/9781974709939-L.jpg',
    description: 'O início da jornada de Denji e Pochita.',
    rating: 4.8,
  },
  {
    title: 'Demon Slayer Vol. 1',
    category: 'Mangá',
    price: 39.9,
    image: 'https://covers.openlibrary.org/b/isbn/9781974700523-L.jpg',
    description: 'Tanjiro parte em busca de uma cura para sua irmã.',
    rating: 4.9,
  },
  {
    title: 'Watchmen',
    category: 'HQ',
    price: 89.9,
    image: 'https://covers.openlibrary.org/b/isbn/9781401245252-L.jpg',
    description: 'Uma investigação muda a visão de um grupo de vigilantes.',
    rating: 4.9,
  },
  {
    title: 'Sandman: Prelúdios e Noturnos',
    category: 'HQ',
    price: 79.9,
    image: 'https://covers.openlibrary.org/b/isbn/9781401225759-L.jpg',
    description: 'O começo da saga de Sonho e dos Perpétuos.',
    rating: 4.8,
  },
  {
    title: 'Duna',
    category: 'Livro',
    price: 59.9,
    image: 'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg',
    description: 'Intrigas, profecias e disputas pelo planeta Arrakis.',
    rating: 4.7,
  },
  {
    title: 'Coraline',
    category: 'Livro',
    price: 44.9,
    image: 'https://covers.openlibrary.org/b/isbn/9780380977789-L.jpg',
    description: 'Uma porta secreta leva Coraline a um mundo inquietante.',
    rating: 4.6,
  },
  {
    title: 'Caderno de Anotações Geek',
    category: 'Acessório',
    price: 34.9,
    image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=85',
    description: 'Caderno para registrar leituras, ideias e coleções.',
    rating: 4.5,
  },
]

async function main() {
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
