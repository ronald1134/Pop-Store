import {
  Box,
  Divider,
  Flex,
  Heading,
  List,
  ListItem,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useProducts } from '../context/ProductContext'
import { API_URL } from '../services/api'

export function OrdersPage() {
  const { token, user } = useProducts()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || !token) {
      return
    }

    const loadOrders = async () => {
      setLoading(true)

      try {
        const response = await fetch(`${API_URL}/api/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Erro ao carregar pedidos')
        }

        const data = await response.json()
        setOrders(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [token, user])

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  if (!user) {
    return (
      <Box maxW="1200px" mx="auto" px={6} py={16}>
        <Box bg="gray.800" borderRadius="xl" p={8} border="1px solid" borderColor="gray.700">
          <Heading as="h1" size="lg" mb={4}>
            Meus pedidos
          </Heading>
          <Text color="gray.300">Faça login para acompanhar os produtos adicionados e as compras realizadas.</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box maxW="1200px" mx="auto" px={6} py={16}>
      <Heading as="h1" size="lg" className="reveal">
        Meus pedidos
      </Heading>

      <Box mt={8} bg="gray.800" borderRadius="xl" p={6} border="1px solid" borderColor="gray.700">
        {loading ? (
          <Text>Carregando pedidos...</Text>
        ) : orders.length === 0 ? (
          <Text>Você ainda não possui pedidos.</Text>
        ) : (
          <Stack spacing={6}>
            {orders.map((order) => (
              <Box key={order.id} bg="gray.900" borderRadius="lg" p={5} border="1px solid" borderColor="gray.700">
                <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={2}>
                  <Box>
                    <Text color="pink.300" fontWeight="bold">
                      Pedido #{order.id}
                    </Text>
                    <Text color="gray.400" fontSize="sm">
                      Realizado em {formatDate(order.createdAt)}
                    </Text>
                  </Box>
                  <Text fontWeight="bold">Total: R$ {Number(order.total).toFixed(2)}</Text>
                </Flex>

                <Divider my={4} />

                <List spacing={2}>
                  {order.items.map((item: any) => (
                    <ListItem key={`${order.id}-${item.productId}`}>
                      <Flex justify="space-between" gap={6} flexWrap="wrap">
                        <Text>
                          {item.product.title} x {item.quantity}
                        </Text>
                        <Text color="gray.300">R$ {Number(item.product.price).toFixed(2)}</Text>
                      </Flex>
                    </ListItem>
                  ))}
                </List>

                <Text mt={4} color="green.300">
                  Entrega estimada: em 3 a 5 dias úteis
                </Text>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  )
}
