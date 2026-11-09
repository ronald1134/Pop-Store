import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Image,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react'
import { Heart, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProducts } from '../context/ProductContext'

export function FavoritesPage() {
  const { favorites, favoritesLoading, user, addToCart, toggleFavorite } = useProducts()
  const toast = useToast()

  const handleRemove = async (product: (typeof favorites)[number]) => {
    try {
      await toggleFavorite(product)
      toast({ title: 'Removido dos favoritos', status: 'success', duration: 2000 })
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Não foi possível atualizar os favoritos',
        status: 'error',
        duration: 3000,
      })
    }
  }

  if (!user) {
    return (
      <Box maxW="1200px" mx="auto" px={6} py={16}>
        <Box bg="gray.800" borderRadius="xl" p={8} border="1px solid" borderColor="gray.700">
          <Heading as="h1" size="lg" mb={4}>Meus favoritos</Heading>
          <Text color="gray.300" mb={5}>Entre na sua conta para salvar e consultar seus produtos favoritos.</Text>
          <Button as={Link} to="/auth" colorScheme="pink">Fazer login</Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box maxW="1200px" mx="auto" px={6} py={16}>
      <Heading as="h1" size="lg" className="reveal">Meus favoritos</Heading>
      {favoritesLoading ? (
        <Text mt={8} color="gray.300">Carregando favoritos...</Text>
      ) : favorites.length === 0 ? (
        <Box mt={8} bg="gray.800" borderRadius="xl" p={8} border="1px solid" borderColor="gray.700">
          <Text color="gray.300">Você ainda não salvou nenhum produto.</Text>
          <Button mt={5} as={Link} to="/produtos" colorScheme="pink">Explorar produtos</Button>
        </Box>
      ) : (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6} mt={8}>
          {favorites.map((product) => (
            <Box key={product.id} bg="gray.800" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.700">
              <Image src={product.image} alt={product.title} h="240px" objectFit="contain" w="100%" bg="gray.900" p={3} />
              <Stack p={5} spacing={3}>
                <Text color="pink.300" fontWeight="bold">{product.category}</Text>
                <Heading as="h2" size="md">{product.title}</Heading>
                <Text color="gray.300">{product.description}</Text>
                <Flex justify="space-between" align="center">
                  <Text fontWeight="bold" fontSize="xl">R$ {product.price.toFixed(2)}</Text>
                  <Text color="yellow.300">★ {product.rating.toFixed(1)}</Text>
                </Flex>
                <Button
                  as={Link}
                  to={`/produtos/${product.id}`}
                  variant="outline"
                  colorScheme="pink"
                >
                  Avaliações e comentários
                </Button>
                <Button
                  leftIcon={<ShoppingCart size={18} />}
                  colorScheme="pink"
                  onClick={async () => {
                    try {
                      await addToCart(product)
                      toast({ title: 'Adicionado ao carrinho', status: 'success', duration: 2000 })
                    } catch (error) {
                      toast({
                        title: error instanceof Error ? error.message : 'Não foi possível adicionar ao carrinho',
                        status: 'error',
                        duration: 3000,
                      })
                    }
                  }}
                >
                  Adicionar ao carrinho
                </Button>
                <Button
                  leftIcon={<Heart size={18} fill="currentColor" />}
                  variant="ghost"
                  colorScheme="pink"
                  onClick={() => handleRemove(product)}
                >
                  Remover dos favoritos
                </Button>
              </Stack>
            </Box>
          ))}
        </Grid>
      )}
    </Box>
  )
}
