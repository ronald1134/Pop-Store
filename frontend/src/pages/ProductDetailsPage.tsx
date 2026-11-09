import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Select,
  Stack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react'
import { Heart, Star } from 'lucide-react'
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
            <Select value={rating} onChange={(event) => setRating(event.target.value)} aria-label="Nota da avaliação" maxW="240px">
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{value} {value === 1 ? 'estrela' : 'estrelas'}</option>
              ))}
            </Select>
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Conte o que achou deste produto (mínimo 5 caracteres)"
              minLength={5}
              maxLength={1000}
              required
              rows={4}
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
