import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  NumberInput,
  NumberInputField,
  Select,
  Stack,
  Text,
  Textarea,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
  useToast,
} from '@chakra-ui/react'
import { Eye, EyeOff, KeyRound, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../context/ProductContext'
import { API_URL } from '../services/api'

export function AdminPage() {
  const { products, refreshProducts, isAdmin, token } = useProducts()
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
  const [editingId, setEditingId] = useState<number | null>(null)
  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string; role: string }>>([])
  const [passwordDrafts, setPasswordDrafts] = useState<Record<number, string>>({})
  const [visiblePasswordDrafts, setVisiblePasswordDrafts] = useState<Record<number, boolean>>({})
  const formRef = useRef<HTMLDivElement>(null)

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const loadUsers = async () => {
    const response = await fetch(`${API_URL}/api/admin/users`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    if (!response.ok) {
      throw new Error('Não foi possível carregar os usuários')
    }

    setUsers(await response.json())
  }

  useEffect(() => {
    if (isAdmin && token) {
      loadUsers().catch((error) => console.error(error))
    }
  }, [isAdmin, token])

  const resetForm = () => {
    setEditingId(null)
    setForm({
      title: '',
      category: 'Mangá',
      price: '0',
      image: '',
      description: '',
      rating: '5',
    })
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products${editingId !== null ? `/${editingId}` : ''}`, {
        method: editingId !== null ? 'PUT' : 'POST',
        headers: requestHeaders,
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
        throw new Error(data.message || 'Erro ao salvar produto')
      }

      toast({ title: editingId !== null ? 'Produto atualizado' : 'Produto cadastrado', status: 'success', duration: 3000, isClosable: true })
      resetForm()

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

  const startEditing = (product: (typeof products)[number]) => {
    setEditingId(product.id)
    setForm({
      title: product.title,
      category: product.category,
      price: String(product.price),
      image: product.image,
      description: product.description,
      rating: String(product.rating),
    })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    toast({ title: 'Produto carregado para edição', status: 'info', duration: 2000, isClosable: true })
  }

  const deleteProduct = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = response.status === 204 ? null : await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Erro ao excluir produto')
      }

      if (editingId === id) resetForm()
      await refreshProducts()
      toast({ title: 'Produto excluído', status: 'success', duration: 3000, isClosable: true })
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Erro ao excluir produto', status: 'error', duration: 3000, isClosable: true })
    }
  }

  const deleteUser = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = response.status === 204 ? null : await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Erro ao excluir usuário')
      }

      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== id))
      toast({ title: 'Usuário excluído', status: 'success', duration: 3000, isClosable: true })
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Erro ao excluir usuário', status: 'error', duration: 3000, isClosable: true })
    }
  }

  const resetUserPassword = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${id}/password`, {
        method: 'PATCH',
        headers: requestHeaders,
        body: JSON.stringify({ newPassword: passwordDrafts[id] ?? '' }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error?.fieldErrors?.newPassword?.[0] || 'Erro ao redefinir senha')
      }

      setPasswordDrafts((current) => ({ ...current, [id]: '' }))
      toast({ title: 'Senha redefinida', status: 'success', duration: 3000, isClosable: true })
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Erro ao redefinir senha',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
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

      <Box ref={formRef} mt={8} bg="gray.800" borderRadius="xl" p={6} border="1px solid" borderColor="gray.700">
        <Heading as="h2" size="md" mb={6}>
          {editingId !== null ? 'Editar produto' : 'Cadastrar produto'}
        </Heading>

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
              {editingId !== null ? 'Salvar alterações' : 'Cadastrar produto'}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={resetForm}>
                Cancelar edição
              </Button>
            )}
          </Flex>
        </Stack>
      </Box>

      <Box mt={8} bg="gray.800" borderRadius="xl" p={6} border="1px solid" borderColor="gray.700">
        <Heading as="h2" size="md" mb={5}>Produtos cadastrados</Heading>
        <TableContainer>
          <Table variant="simple">
            <Thead><Tr><Th color="gray.400">Produto</Th><Th color="gray.400">Categoria</Th><Th color="gray.400">Preço</Th><Th color="gray.400">Ações</Th></Tr></Thead>
            <Tbody>
              {products.map((product) => (
                <Tr key={product.id}>
                  <Td>{product.title}</Td>
                  <Td>{product.category}</Td>
                  <Td>R$ {product.price.toFixed(2)}</Td>
                  <Td><Flex gap={2}><Button size="sm" leftIcon={<Pencil size={14} />} onClick={() => startEditing(product)}>Editar</Button><Button size="sm" colorScheme="red" variant="ghost" leftIcon={<Trash2 size={14} />} onClick={() => deleteProduct(product.id)}>Excluir</Button></Flex></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <Box mt={8} bg="gray.800" borderRadius="xl" p={6} border="1px solid" borderColor="gray.700">
        <Heading as="h2" size="md" mb={5}>Usuários cadastrados</Heading>
        <TableContainer>
          <Table variant="simple" size="sm" fontSize="sm">
            <Thead><Tr><Th color="gray.400">Nome</Th><Th color="gray.400">E-mail</Th><Th color="gray.400">Perfil</Th><Th color="gray.400">Ações</Th></Tr></Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>{user.name}</Td><Td>{user.email}</Td><Td>{user.role}</Td>
                  <Td>
                    <Flex gap={1} align="center" minW="0">
                      <InputGroup size="sm" maxW="220px" minW="0" flex="1">
                        <Input
                          type={visiblePasswordDrafts[user.id] ? 'text' : 'password'}
                          pr="2.25rem"
                          placeholder="Nova senha (mín. 8)"
                          aria-label={`Nova senha para ${user.email}`}
                          value={passwordDrafts[user.id] ?? ''}
                          onChange={(event) =>
                            setPasswordDrafts((current) => ({
                              ...current,
                              [user.id]: event.target.value,
                            }))
                          }
                        />
                        <InputRightElement width="2.25rem">
                          <Tooltip label={visiblePasswordDrafts[user.id] ? 'Ocultar senha' : 'Exibir senha'}>
                            <IconButton
                              size="xs"
                              variant="ghost"
                              color="gray.300"
                              aria-label={visiblePasswordDrafts[user.id] ? 'Ocultar senha' : 'Exibir senha'}
                              aria-pressed={Boolean(visiblePasswordDrafts[user.id])}
                              icon={visiblePasswordDrafts[user.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                              onClick={() =>
                                setVisiblePasswordDrafts((current) => ({
                                  ...current,
                                  [user.id]: !current[user.id],
                                }))
                              }
                            />
                          </Tooltip>
                        </InputRightElement>
                      </InputGroup>
                      <Tooltip label="Redefinir senha">
                        <IconButton
                          size="sm"
                          aria-label={`Redefinir senha de ${user.email}`}
                          icon={<KeyRound size={14} />}
                          onClick={() => resetUserPassword(user.id)}
                          isDisabled={(passwordDrafts[user.id] ?? '').length < 8}
                        />
                      </Tooltip>
                      <Tooltip label="Excluir usuário">
                        <IconButton
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          aria-label={`Excluir ${user.email}`}
                          icon={<Trash2 size={14} />}
                          onClick={() => deleteUser(user.id)}
                        />
                      </Tooltip>
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  )
}
