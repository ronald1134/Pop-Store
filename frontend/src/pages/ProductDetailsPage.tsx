import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react'
import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown, Heart, Star } from 'lucide-react'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useProducts } from '../context/ProductContext'
import { API_URL } from '../services/api'

type Review = {
  id: number
  userId: number
  rating: number
  comment: string
  createdAt: string
  user: { name: string }
}

type ReviewResponse = {
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

export function ProductDetailsPage() {
  const { id } = useParams()
  const productId = Number(id)
  const { products, user, token, toggleFavorite, favorites, refreshProducts } = useProducts()
  const product = products.find((item) => item.id === productId)
  const navigate = useNavigate()
  const toast = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')

  const loadReviews = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/products/${productId}/reviews`)
    if (!response.ok) {
      throw new Error('Não foi possível carregar as avaliações')
    }

    return (await response.json()) as ReviewResponse
  }, [productId])

  useEffect(() => {
    let active = true
    if (!Number.isInteger(productId) || productId <= 0) {
      setLoading(false)
      setLoadError('Produto inválido')
      return () => { active = false }
    }

    setLoading(true)
    setLoadError('')

    loadReviews()
      .then((data) => {
        if (!active) return
        setReviews(data.reviews)
        setAverageRating(data.averageRating)
        setTotalReviews(data.totalReviews)
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Erro ao carregar avaliações')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [loadReviews])

  const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user || !token) {
      navigate('/auth')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: Number(rating), comment }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { message?: string } | null
        throw new Error(data?.message ?? 'Não foi possível enviar sua avaliação')
      }

      const data = await loadReviews()
      setReviews(data.reviews)
      setAverageRating(data.averageRating)
      setTotalReviews(data.totalReviews)
      await refreshProducts()
      setComment('')
      toast({ title: 'Avaliação enviada com sucesso', status: 'success', duration: 2500 })
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Não foi possível enviar sua avaliação',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleFavorite = async () => {
    if (!product) return

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

  if (!product) {
    return (
      <Box maxW="1200px" mx="auto" px={6} py={16}>
        <Heading as="h1" size="lg" mb={4}>Produto não encontrado</Heading>
        <Button as={Link} to="/produtos" colorScheme="pink">Voltar ao catálogo</Button>
      </Box>
    )
  }

  const isFavorite = favorites.some((favorite) => favorite.id === product.id)

  return (
    <Box maxW="1000px" mx="auto" px={6} py={12}>
      <style>{`
        .rating-select-trigger {
          width: 240px;
          max-width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(15, 23, 42, 0.28);
          color: white;
          border: 1px solid #f472b6;
          border-radius: 0.75rem;
          min-height: 42px;
          padding: 0 12px;
          font-size: 1rem;
          cursor: pointer;
        }

        .rating-select-trigger:hover {
          border-color: #f9a8d4;
        }

        .rating-select-trigger:focus {
          outline: none;
          box-shadow: 0 0 0 1px rgba(244, 114, 182, 0.6);
          border-color: #f9a8d4;
        }

        .rating-select-content {
          min-width: var(--radix-select-trigger-width);
          background: rgba(15, 23, 42, 0.96);
          border: 1px solid #f472b6;
          border-radius: 0.75rem;
          overflow: hidden;
          z-index: 10;
        }

        .rating-select-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          color: white;
          cursor: pointer;
        }

        .rating-select-item[data-highlighted],
        .rating-select-item[data-state='checked'] {
          background: rgba(244, 114, 182, 0.18);
          color: white;
          outline: none;
        }

        .rating-select-item-indicator {
          color: #f9a8d4;
        }
      `}</style>
      <Button as={Link} to="/produtos" variant="ghost" colorScheme="pink" mb={6}>Voltar ao catálogo</Button>
      <Flex direction={{ base: 'column', md: 'row' }} gap={8} bg="gray.800" borderRadius="xl" p={{ base: 5, md: 8 }} border="1px solid" borderColor="gray.700">
        <Image src={product.image} alt={product.title} w={{ base: '100%', md: '40%' }} maxH="360px" objectFit="contain" bg="gray.900" borderRadius="lg" p={4} />
        <Stack flex={1} spacing={4}>
          <Text color="pink.300" fontWeight="bold">{product.category}</Text>
          <Heading as="h1" size="xl">{product.title}</Heading>
          <Text color="gray.300">{product.description}</Text>
          <Text fontWeight="bold" fontSize="2xl">R$ {product.price.toFixed(2)}</Text>
          <Flex align="center" gap={2} color="yellow.300">
            <Star size={18} fill="currentColor" />
            <Text>
              {totalReviews
                ? `${averageRating.toFixed(1)} (${totalReviews} ${totalReviews === 1 ? 'avaliação' : 'avaliações'})`
                : 'Sem avaliações ainda'}
            </Text>
          </Flex>
          <Button
            leftIcon={<Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />}
            variant={isFavorite ? 'solid' : 'outline'}
            colorScheme="pink"
            onClick={handleFavorite}
          >
            {isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          </Button>
        </Stack>
      </Flex>

      <Box mt={10} bg="gray.800" borderRadius="xl" p={{ base: 5, md: 8 }} border="1px solid" borderColor="gray.700">
        <Heading as="h2" size="lg" mb={6}>Avaliações e comentários</Heading>
        <Box as="form" onSubmit={handleSubmitReview} mb={8}>
          <Stack spacing={4}>
            <RadixSelect.Root value={rating} onValueChange={setRating}>
              <RadixSelect.Trigger className="rating-select-trigger" aria-label="Nota da avaliação">
                <RadixSelect.Value />
                <RadixSelect.Icon>
                  <ChevronDown size={18} />
                </RadixSelect.Icon>
              </RadixSelect.Trigger>
              <RadixSelect.Portal>
                <RadixSelect.Content className="rating-select-content" sideOffset={6} position="popper">
                  <RadixSelect.Viewport>
                    {[5, 4, 3, 2, 1].map((value) => (
                      <RadixSelect.Item key={value} value={String(value)} className="rating-select-item">
                        <RadixSelect.ItemText>
                          {value} {value === 1 ? 'estrela' : 'estrelas'}
                        </RadixSelect.ItemText>
                        <RadixSelect.ItemIndicator className="rating-select-item-indicator">
                          <Check size={14} />
                        </RadixSelect.ItemIndicator>
                      </RadixSelect.Item>
                    ))}
                  </RadixSelect.Viewport>
                </RadixSelect.Content>
              </RadixSelect.Portal>
            </RadixSelect.Root>
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Conte o que achou deste produto (mínimo 5 caracteres)"
              minLength={5}
              maxLength={1000}
              required
              rows={4}
              bg="gray.700"
              color="white"
              borderColor="gray.600"
              _placeholder={{ color: 'gray.400', opacity: 1 }}
              _hover={{ borderColor: 'pink.400' }}
              _focus={{ borderColor: 'pink.400', boxShadow: '0 0 0 1px var(--chakra-colors-pink-400)' }}
            />
            <Button type="submit" colorScheme="pink" alignSelf="flex-start" isLoading={submitting}>
              {user ? 'Enviar avaliação' : 'Entre para avaliar'}
            </Button>
            {user && (
              <Text fontSize="sm" color="gray.400">
                Você pode enviar outra avaliação para atualizar sua nota e comentário.
              </Text>
            )}
          </Stack>
        </Box>

        {loading ? (
          <Text color="gray.300">Carregando avaliações...</Text>
        ) : loadError ? (
          <Text color="red.300">{loadError}</Text>
        ) : reviews.length === 0 ? (
          <Text color="gray.300">Este produto ainda não recebeu avaliações.</Text>
        ) : (
          <Stack spacing={4}>
            {reviews.map((review) => (
              <Box key={review.id} borderTop="1px solid" borderColor="gray.700" pt={4}>
                <Flex justify="space-between" gap={4} wrap="wrap" align="center">
                  <Text fontWeight="bold">{review.user.name}</Text>
                  <Flex gap={1} color="yellow.300" aria-label={`${review.rating} de 5 estrelas`}>
                    {Array.from({ length: review.rating }, (_, index) => <Star key={index} size={15} fill="currentColor" />)}
                  </Flex>
                </Flex>
                <Text color="gray.300" mt={2}>{review.comment}</Text>
                <Text color="gray.500" fontSize="sm" mt={2}>
                  {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                </Text>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  )
}
