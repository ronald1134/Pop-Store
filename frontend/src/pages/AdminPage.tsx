import {
  Box,
  Button,
  Alert,
  AlertIcon,
  Center,
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
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
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
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useProducts } from '../context/ProductContext'
import { API_URL } from '../services/api'

type MetricsPeriod = '7d' | '30d' | '12m'

type AdminMetrics = {
  period: MetricsPeriod
  revenueTotal: number
  salesByPeriod: Array<{ date: string; revenue: number; orders: number }>
  ordersByStatus: Array<{ status: string; count: number }>
  topProducts: Array<{ productId: number; title: string; quantity: number }>
}

const orderStatusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Em processamento',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const formatSalesDate = (value: string, period: MetricsPeriod) => {
  const date = new Date(`${value}${period === '12m' ? '-01' : ''}T12:00:00`)
  return date.toLocaleDateString('pt-BR', {
    day: period === '12m' ? undefined : '2-digit',
    month: 'short',
    year: period === '12m' ? '2-digit' : undefined,
  })
}

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
  const [metricsPeriod, setMetricsPeriod] = useState<MetricsPeriod>('30d')
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [metricsError, setMetricsError] = useState('')
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

  useEffect(() => {
    if (!isAdmin || !token) return

    let active = true
    const loadMetrics = async () => {
      setMetricsLoading(true)
      setMetricsError('')

      try {
        const response = await fetch(
          `${API_URL}/api/admin/metrics?period=${metricsPeriod}`,
          { headers: { Authorization: `Bearer ${token}` } },
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Não foi possível carregar as métricas')
        }

        if (active) setMetrics(data)
      } catch (error) {
        if (active) {
          setMetricsError(
            error instanceof Error ? error.message : 'Erro ao carregar as métricas',
          )
        }
      } finally {
        if (active) setMetricsLoading(false)
      }
    }

    loadMetrics()
    return () => {
      active = false
    }
  }, [isAdmin, metricsPeriod, token])

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

      <Box mt={8}>
        <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4} direction={{ base: 'column', md: 'row' }}>
          <Box>
            <Heading as="h2" size="md">Métricas de vendas</Heading>
            <Text color="gray.400" mt={1}>Acompanhe o desempenho da loja no período selecionado.</Text>
          </Box>
          <Select
            aria-label="Período das métricas"
            value={metricsPeriod}
            onChange={(event) => {
              const selectedPeriod = event.target.value
              if (selectedPeriod === '7d' || selectedPeriod === '30d' || selectedPeriod === '12m') {
                setMetricsPeriod(selectedPeriod)
              }
            }}
            maxW={{ base: 'full', md: '200px' }}
            bg="gray.800"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="12m">Últimos 12 meses</option>
          </Select>
        </Flex>

        {metricsError && (
          <Alert status="error" mt={5} borderRadius="lg">
            <AlertIcon />
            {metricsError}
          </Alert>
        )}

        {metricsLoading ? (
          <Center minH="220px">
            <Spinner color="pink.300" />
          </Center>
        ) : metrics ? (
          <>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mt={6}>
              <Stat bg="gray.800" border="1px solid" borderColor="gray.700" borderRadius="xl" p={5}>
                <StatLabel color="gray.400">Receita no período</StatLabel>
                <StatNumber color="pink.300">{formatCurrency(metrics.revenueTotal)}</StatNumber>
              </Stat>
              <Stat bg="gray.800" border="1px solid" borderColor="gray.700" borderRadius="xl" p={5}>
                <StatLabel color="gray.400">Pedidos no período</StatLabel>
                <StatNumber>
                  {metrics.salesByPeriod.reduce((total, day) => total + day.orders, 0)}
                </StatNumber>
              </Stat>
            </SimpleGrid>

            <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={5} mt={5}>
              <Box gridColumn={{ base: 'auto', lg: '1 / -1' }} bg="gray.800" borderRadius="xl" p={5} border="1px solid" borderColor="gray.700">
                <Heading as="h3" size="sm" mb={5}>Vendas por período</Heading>
                <Box h="280px">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.salesByPeriod}>
                      <defs>
                        <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f472b6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value: string) => formatSalesDate(value, metrics.period)}
                        stroke="#9ca3af"
                        minTickGap={24}
                      />
                      <YAxis yAxisId="revenue" tickFormatter={(value: number) => `R$ ${value}`} stroke="#9ca3af" />
                      <YAxis yAxisId="orders" orientation="right" allowDecimals={false} stroke="#9ca3af" />
                      <ChartTooltip
                        labelFormatter={(value) => formatSalesDate(String(value), metrics.period)}
                        formatter={(value, name) => [
                          name === 'Receita' ? formatCurrency(Number(value)) : value,
                          name,
                        ]}
                        contentStyle={{ background: '#111827', borderColor: '#374151', borderRadius: 8 }}
                      />
                      <Area
                        yAxisId="revenue"
                        type="monotone"
                        dataKey="revenue"
                        name="Receita"
                        stroke="#f472b6"
                        fill="url(#salesFill)"
                      />
                      <Line
                        yAxisId="orders"
                        type="monotone"
                        dataKey="orders"
                        name="Pedidos"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Box>

              <Box bg="gray.800" borderRadius="xl" p={5} border="1px solid" borderColor="gray.700">
                <Heading as="h3" size="sm" mb={5}>Pedidos por status</Heading>
                <Box h="280px">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.ordersByStatus} layout="vertical" margin={{ left: 8, right: 12 }}>
                      <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} stroke="#9ca3af" />
                      <YAxis
                        type="category"
                        dataKey="status"
                        width={125}
                        stroke="#9ca3af"
                        tickFormatter={(value: string) => orderStatusLabels[value] ?? value}
                      />
                      <ChartTooltip
                        formatter={(value) => [value, 'Pedidos']}
                        labelFormatter={(value) => orderStatusLabels[String(value)] ?? String(value)}
                        contentStyle={{ background: '#111827', borderColor: '#374151', borderRadius: 8 }}
                      />
                      <Bar dataKey="count" name="Pedidos" fill="#ec4899" radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>

              <Box bg="gray.800" borderRadius="xl" p={5} border="1px solid" borderColor="gray.700">
                <Heading as="h3" size="sm" mb={5}>Produtos mais vendidos</Heading>
                {metrics.topProducts.length ? (
                  <Box h="280px">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.topProducts} layout="vertical" margin={{ left: 8, right: 12 }}>
                        <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} stroke="#9ca3af" />
                        <YAxis type="category" dataKey="title" width={130} stroke="#9ca3af" />
                        <ChartTooltip
                          formatter={(value) => [value, 'Unidades']}
                          contentStyle={{ background: '#111827', borderColor: '#374151', borderRadius: 8 }}
                        />
                        <Bar dataKey="quantity" name="Unidades" fill="#38bdf8" radius={[0, 5, 5, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Center h="280px">
                    <Text color="gray.400">Nenhum produto vendido neste período.</Text>
                  </Center>
                )}
              </Box>
            </Grid>
          </>
        ) : null}
      </Box>

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
