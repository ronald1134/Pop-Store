import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Image,
  List,
  ListItem,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react'
import { Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../context/ProductContext'
import { API_URL } from '../services/api'

export function CheckoutPage() {
  const { cart, removeFromCart, total, user, token, clearCart } = useProducts()
  const navigate = useNavigate()
  const toast = useToast()

  const handleFinishPurchase = async () => {
    if (!user) {
      navigate('/auth')
      return
    }

    const groupedItems = Object.values(
      cart.reduce<Record<number, { productId: number; quantity: number }>>((acc, item) => {
        const existingItem = acc[item.id]

        if (existingItem) {
          existingItem.quantity += 1
          return acc
        }

        acc[item.id] = { productId: item.id, quantity: 1 }
        return acc
      }, {}),
    )

    try {
      const paymentResponse = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ total }),
      })

      if (!paymentResponse.ok) {
        throw new Error('Pagamento não aprovado')
      }

      const orderResponse = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: groupedItems, total }),
      })

      if (!orderResponse.ok) {
        throw new Error('Não foi possível registrar o pedido')
      }

      clearCart()
      toast({ title: 'Pedido confirmado', status: 'success', duration: 3000, isClosable: true })
      navigate('/pedidos')
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Erro ao finalizar compra',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      console.error(error)
    }
  }

  return (
    <Box maxW="1200px" mx="auto" px={6} py={16}>
      <Heading as="h1" size="lg" className="reveal">
        Carrinho de compras
      </Heading>

      {cart.length === 0 ? (
        <Box mt={8} bg="gray.800" borderRadius="xl" p={8} border="1px solid" borderColor="gray.700">
          <Text>Seu carrinho está vazio.</Text>
        </Box>
      ) : (
        <Flex direction={{ base: 'column', lg: 'row' }} gap={8} mt={8}>
          <Box flex={2} bg="gray.800" borderRadius="xl" p={6} border="1px solid" borderColor="gray.700">
            <List spacing={4}>
              {cart.map((item) => (
                <ListItem key={`${item.id}-${item.title}`} borderBottom="1px solid" borderColor="gray.700" pb={4}>
                  <Flex gap={4} align="center">
                    <Image
                      src={item.image}
                      alt={item.title}
                      boxSize="90px"
                      objectFit="contain"
                      borderRadius="lg"
                      bg="gray.900"
                      p={1}
                    />
                    <Box flex={1}>
                      <Text fontWeight="bold">{item.title}</Text>
                      <Text color="gray.300">{item.category}</Text>
                      <Text mt={2}>R$ {item.price.toFixed(2)}</Text>
                    </Box>
                    <Button
                      leftIcon={<Trash2 size={16} />}
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remover
                    </Button>
                  </Flex>
                </ListItem>
              ))}
            </List>
          </Box>

          <Box flex={1} bg="gray.800" borderRadius="xl" p={6} border="1px solid" borderColor="gray.700">
            <Stack spacing={4}>
              <Heading as="h2" size="md">
                Resumo do pedido
              </Heading>
              <Divider />
              <Flex justify="space-between">
                <Text>Subtotal</Text>
                <Text>R$ {total.toFixed(2)}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text>Frete</Text>
                <Text>R$ 19,90</Text>
              </Flex>
              <Flex justify="space-between">
                <Text>Entrega estimada</Text>
                <Text color="pink.300">3 a 5 dias úteis</Text>
              </Flex>
              <Divider />
              <Flex justify="space-between" fontWeight="bold" fontSize="lg">
                <Text>Total</Text>
                <Text>R$ {(total + 19.9).toFixed(2)}</Text>
              </Flex>
              <Button colorScheme="pink" size="lg" onClick={handleFinishPurchase}>
                Finalizar compra
              </Button>
            </Stack>
          </Box>
        </Flex>
      )}
    </Box>
  )
}
