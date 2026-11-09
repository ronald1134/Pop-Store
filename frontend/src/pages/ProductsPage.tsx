import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Image,
  Input,
  IconButton,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown, Heart, ShoppingCart, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '@chakra-ui/react'
import { useProducts } from '../context/ProductContext'

export function ProductsPage() {
  const { products, addToCart, loading, favorites, toggleFavorite, user } = useProducts()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState((location.state as { category?: string } | null)?.category ?? 'all')

  const categoryOptions = [
    { value: 'all', label: 'Todas as categorias' },
    { value: 'Mangá', label: 'Mangá' },
    { value: 'Livro', label: 'Livro' },
    { value: 'HQ', label: 'HQ' },
    { value: 'Kindle', label: 'Kindle' },
    { value: 'Acessório', label: 'Acessório' },
  ]

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.title.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === 'all' || product.category === category
      return matchesSearch && matchesCategory
    })
  }, [products, search, category])

  const handleFavorite = async (product: (typeof products)[number]) => {
    if (!user) {
      navigate('/auth')
      return
    }

    try {
      await toggleFavorite(product)
      toast({
        title: favorites.some((favorite) => favorite.id === product.id)
          ? 'Removido dos favoritos'
          : 'Adicionado aos favoritos',
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Não foi possível atualizar os favoritos',
        status: 'error',
        duration: 3000,
      })
    }
  }

  return (
    <>
      <style>{`
        .category-select-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(15, 23, 42, 0.28);
          color: white;
          border: 1px solid #f472b6;
          border-radius: 0.75rem;
          min-height: 48px;
          padding: 0 16px;
          opacity: 0.96;
          backdrop-filter: blur(8px);
          font-size: 1rem;
          cursor: pointer;
        }

        .category-select-trigger:hover {
          border-color: #f9a8d4;
        }

        .category-select-trigger:focus {
          outline: none;
          box-shadow: 0 0 0 1px rgba(244, 114, 182, 0.6);
          border-color: #f9a8d4;
        }

        .category-select-content {
          background: rgba(15, 23, 42, 0.96);
          border: 1px solid #f472b6;
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .category-select-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          color: white;
          background: rgba(15, 23, 42, 0.96);
          cursor: pointer;
        }

        .category-select-item[data-highlighted] {
          background: rgba(244, 114, 182, 0.18);
          color: white;
          outline: none;
        }

        .category-select-item[data-state='checked'] {
          background: rgba(244, 114, 182, 0.18);
        }

        .category-select-item-indicator {
          color: #f9a8d4;
        }
      `}</style>

      <Box maxW="1200px" mx="auto" px={6} py={16}>
      <Heading as="h1" size="lg" className="reveal">
        Catálogo de produtos
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={8} maxW="700px">
        <Input
          placeholder="Buscar por nome"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar produto"
        />

        <RadixSelect.Root value={category} onValueChange={setCategory}>
          <RadixSelect.Trigger className="category-select-trigger" aria-label="Filtrar por categoria">
            <RadixSelect.Value placeholder="Todas as categorias" />
            <RadixSelect.Icon>
              <ChevronDown size={18} />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>

          <RadixSelect.Portal>
            <RadixSelect.Content className="category-select-content" sideOffset={8} position="popper">
              <RadixSelect.Viewport>
                {categoryOptions.map((option) => (
                  <RadixSelect.Item key={option.value} value={option.value} className="category-select-item">
                    <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                    <RadixSelect.ItemIndicator className="category-select-item-indicator">
                      <Check size={14} />
                    </RadixSelect.ItemIndicator>
                  </RadixSelect.Item>
                ))}
              </RadixSelect.Viewport>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </RadixSelect.Root>
      </SimpleGrid>

      {loading ? (
        <Text mt={10}>Carregando produtos...</Text>
      ) : (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6} mt={10}>
          {filteredProducts.map((product) => (
            <Box
              key={product.id}
              bg="gray.800"
              borderRadius="xl"
              overflow="hidden"
              border="1px solid"
              borderColor="gray.700"
              className="reveal"
            >
              <Box position="relative">
                <Image
                  src={product.image}
                  alt={product.title}
                  h="280px"
                  objectFit="contain"
                  w="100%"
                  bg="gray.900"
                  p={3}
                />
                <IconButton
                  aria-label={favorites.some((favorite) => favorite.id === product.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  icon={<Heart size={18} fill={favorites.some((favorite) => favorite.id === product.id) ? 'currentColor' : 'none'} />}
                  colorScheme="pink"
                  variant="solid"
                  position="absolute"
                  top={3}
                  right={3}
                  onClick={() => handleFavorite(product)}
                />
              </Box>
              <Stack p={5} spacing={3}>
                <Text color="pink.300" fontWeight="bold">
                  {product.category}
                </Text>
                <Heading as="h3" size="md">
                  <Link to={`/produtos/${product.id}`}>{product.title}</Link>
                </Heading>
                <Text color="gray.300">{product.description}</Text>

                <Flex justify="space-between" align="center">
                  <Text fontWeight="bold" fontSize="xl">
                    R$ {product.price.toFixed(2)}
                  </Text>
                  <Text color="yellow.300" display="flex" alignItems="center" gap={1}>
                    <Star size={16} fill="currentColor" />
                    {product.rating.toFixed(1)}
                  </Text>
                </Flex>

                <Button as={Link} to={`/produtos/${product.id}`} variant="outline" colorScheme="pink">
                  Avaliações e comentários
                </Button>

                <Button
                  leftIcon={<ShoppingCart size={18} />}
                  colorScheme="pink"
                  onClick={() => addToCart(product)}
                >
                  Adicionar ao carrinho
                </Button>
              </Stack>
            </Box>
          ))}
        </Grid>
      )}
      </Box>
    </>
  )
}
