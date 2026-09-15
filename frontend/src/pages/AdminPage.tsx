import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Stack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../context/ProductContext'
import { API_URL } from '../services/api'

export function AdminPage() {
  const { refreshProducts, isAdmin, token } = useProducts()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    category: 'Mangá',
    price: '0',
    image: '',
    description: '',
    rating: '5',
  })

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          price: Number(form.price),
          image: form.image,
          description: form.description,
          rating: Number(form.rating),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao cadastrar produto')
      }

      toast({ title: 'Produto cadastrado', status: 'success', duration: 3000, isClosable: true })

      setForm({
        title: '',
        category: 'Mangá',
        price: '0',
        image: '',
        description: '',
        rating: '5',
      })

      await refreshProducts()
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Erro ao cadastrar',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      console.error(error)
    }
  }

  if (!isAdmin) {
    return (
      <Box maxW="1200px" mx="auto" px={6} py={16}>
        <Box bg="gray.800" borderRadius="xl" p={8} border="1px solid" borderColor="gray.700">
          <Heading as="h1" size="lg" mb={4}>
            Acesso restrito
          </Heading>
          <Text color="gray.300" mb={6}>
            Esta área é exclusiva para administradores. Faça login com a conta de gestão para continuar.
          </Text>
          <Button colorScheme="pink" onClick={() => navigate('/auth')}>
            Ir para login
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box maxW="1200px" mx="auto" px={6} py={16}>
      <Heading as="h1" size="lg" className="reveal">
        Painel administrativo
      </Heading>

      <Box mt={8} bg="gray.800" borderRadius="xl" p={6} border="1px solid" borderColor="gray.700">
        <Text color="gray.300" mb={6}>
          Conta demo: admin@culturepop.com / admin123
        </Text>

        <Divider mb={6} />

        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
          <FormControl>
            <FormLabel>Título</FormLabel>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              aria-label="Título do produto"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Categoria</FormLabel>
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              aria-label="Categoria do produto"
            >
              <option value="Mangá">Mangá</option>
              <option value="Livro">Livro</option>
              <option value="HQ">HQ</option>
              <option value="Kindle">Kindle</option>
              <option value="Acessório">Acessório</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Preço</FormLabel>
            <NumberInput value={form.price} min={0}>
              <NumberInputField
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                aria-label="Preço do produto"
              />
            </NumberInput>
          </FormControl>

          <FormControl>
            <FormLabel>Avaliação</FormLabel>
            <NumberInput value={form.rating} min={0} max={5}>
              <NumberInputField
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                aria-label="Avaliação do produto"
              />
            </NumberInput>
          </FormControl>
        </Grid>

        <Stack spacing={4} mt={6}>
          <FormControl>
            <FormLabel>Imagem (URL)</FormLabel>
            <Input
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              aria-label="URL da imagem"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Descrição</FormLabel>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              aria-label="Descrição do produto"
              minH="150px"
            />
          </FormControl>

          <Flex justify="flex-end">
            <Button colorScheme="pink" size="lg" onClick={handleSubmit}>
              Cadastrar produto
            </Button>
          </Flex>
        </Stack>
      </Box>
    </Box>
  )
}
