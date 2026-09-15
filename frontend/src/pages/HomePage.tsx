import { Box, Button, Flex, Grid, Heading, Image, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { ArrowRight, Sparkles, Star } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useProducts } from '../context/ProductContext'

const categories = [
  { label: 'Mangás', accent: 'pink.400', value: 'Mangá' },
  { label: 'Livros', accent: 'purple.400', value: 'Livro' },
  { label: 'HQs', accent: 'cyan.400', value: 'HQ' },
  { label: 'Kindle', accent: 'teal.400', value: 'Kindle' },
  { label: 'Acessórios', accent: 'orange.400', value: 'Acessório' },
]

export function HomePage() {
  const { products, loading } = useProducts()
  const navigate = useNavigate()

  const popularProducts = [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)

  const handleCategoryClick = (category: string) => {
    navigate('/produtos', { state: { category } })
  }

  return (
    <Box>
      <Box maxW="1200px" mx="auto" px={6} py={20}>
        <Flex direction={{ base: 'column', lg: 'row' }} align="center" justify="space-between" gap={8}>
          <Box flex={1} className="reveal">
            <Stack spacing={5}>
              <Text color="pink.300" fontWeight="bold" letterSpacing="wide" textTransform="uppercase">
                Loja oficial de cultura pop
              </Text>
              <Heading as="h1" size="2xl" lineHeight="1.1">
                Descubra mangás, livros, HQs, Kindle e acessórios geek.
              </Heading>
              <Text color="gray.300" fontSize="lg">
                Uma experiência completa para quem ama colecionar, ler e se vestir com estilo.
              </Text>
              <Flex gap={4} wrap="wrap">
                <Button as={Link} to="/produtos" colorScheme="pink" size="lg" rightIcon={<ArrowRight size={18} />}>
                  Ver produtos
                </Button>
                <Button
                  as={Link}
                  to="/checkout"
                  variant="outline"
                  colorScheme="pink"
                  size="lg"
                  bg="rgba(244, 114, 182, 0.08)"
                  borderColor="pink.300"
                  color="pink.100"
                  _hover={{ bg: 'pink.500', color: 'white', borderColor: 'pink.400' }}
                  _active={{ bg: 'pink.600', borderColor: 'pink.500' }}
                >
                  Meu carrinho
                </Button>
              </Flex>
            </Stack>
          </Box>

          <Box flex={1} className="reveal" maxW="560px">
            <Image
              src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80"
              alt="Imagem promocional da loja"
              borderRadius="2xl"
              boxShadow="soft"
            />
          </Box>
        </Flex>
      </Box>

      <Box bg="gray.800" py={16}>
        <Box maxW="1200px" mx="auto" px={6}>
          <Heading as="h2" size="lg" mb={8} className="reveal">
            Categorias em destaque
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={6} className="grid-motion">
            {categories.map((item) => (
              <Box
                key={item.label}
                as="button"
                type="button"
                bg="gray.900"
                border="1px solid"
                borderColor="gray.700"
                borderRadius="xl"
                p={6}
                textAlign="center"
                className="reveal"
                cursor="pointer"
                _hover={{ borderColor: 'pink.300', transform: 'translateY(-2px)' }}
                transition="all 0.2s ease"
                onClick={() => handleCategoryClick(item.value)}
                aria-label={`Ir para a categoria ${item.label}`}
              >
                <Box
                  w={12}
                  h={12}
                  mx="auto"
                  borderRadius="full"
                  bg={item.accent}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mb={3}
                >
                  <Sparkles size={18} color="white" />
                </Box>
                <Text fontWeight="bold">{item.label}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </Box>

      <Box maxW="1200px" mx="auto" px={6} py={16}>
        <Flex align="center" justify="space-between" mb={8} className="reveal" wrap="wrap" gap={4}>
          <Heading as="h2" size="lg">
            Produtos populares
          </Heading>
          <Button as={Link} to="/produtos" variant="ghost" colorScheme="pink">
            Ver catálogo completo
          </Button>
        </Flex>

        {loading ? (
          <Text color="gray.300">Carregando produtos...</Text>
        ) : (
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
            {popularProducts.map((product) => (
              <Box
                key={product.id}
                bg="gray.800"
                borderRadius="xl"
                overflow="hidden"
                border="1px solid"
                borderColor="gray.700"
                className="reveal"
                _hover={{ borderColor: 'pink.300', transform: 'translateY(-4px)' }}
                transition="all 0.2s ease"
              >
                <Image
                  src={product.image}
                  alt={product.title}
                  h="280px"
                  objectFit="contain"
                  w="100%"
                  bg="gray.900"
                  p={3}
                />
                <Box p={5}>
                  <Text color="pink.300" fontSize="sm" fontWeight="bold">
                    {product.category}
                  </Text>
                  <Heading as="h3" size="md" mt={2}>
                    {product.title}
                  </Heading>
                  <Text mt={2} color="gray.300">
                    {product.description}
                  </Text>
                  <Flex align="center" justify="space-between" mt={4}>
                    <Text fontWeight="bold" fontSize="xl">
                      R$ {product.price.toFixed(2)}
                    </Text>
                    <Text color="yellow.300" display="flex" alignItems="center" gap={1}>
                      <Star size={16} fill="currentColor" />
                      {product.rating.toFixed(1)}
                    </Text>
                  </Flex>
                </Box>
              </Box>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  )
}
