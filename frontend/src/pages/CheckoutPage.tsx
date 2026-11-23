import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Image,
  Input,
  List,
  ListItem,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../context/ProductContext'
import { API_URL } from '../services/api'

type CheckoutItem = { productId: number; quantity: number }

type CheckoutTotals = {
  subtotal: number
  shipping: number
  discount: number
  couponCode: string | null
  total: number
}

async function requestCheckoutQuote(
  items: CheckoutItem[],
  couponCode?: string,
): Promise<CheckoutTotals> {
  const response = await fetch(`${API_URL}/api/checkout/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, ...(couponCode ? { couponCode } : {}) }),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Não foi possível calcular o pedido')
  }

  return data
}

export function CheckoutPage() {
  const { cart, removeFromCart, user, token, clearCart } = useProducts()
  const navigate = useNavigate()
  const toast = useToast()
  const [totals, setTotals] = useState<CheckoutTotals | null>(null)
  const [couponDraft, setCouponDraft] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const [couponError, setCouponError] = useState('')
  const [quoteError, setQuoteError] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

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

  useEffect(() => {
    if (groupedItems.length === 0) {
      setTotals(null)
      return
    }

    let active = true
    requestCheckoutQuote(groupedItems, appliedCoupon || undefined)
      .then((data) => {
        if (!active) return
        setTotals(data)
        setQuoteError('')
        if (appliedCoupon) setCouponError('')
      })
      .catch((error) => {
        if (!active) return
        setTotals(null)
        const message =
          error instanceof Error ? error.message : 'Não foi possível calcular o pedido'
        if (appliedCoupon) {
          setCouponError(message)
          setAppliedCoupon('')
        } else {
          setQuoteError(message)
        }
      })

    return () => {
      active = false
    }
  }, [cart, appliedCoupon])

  const handleApplyCoupon = async () => {
    const couponCode = couponDraft.trim().toUpperCase()
    if (!couponCode) return

    setIsApplyingCoupon(true)
    setCouponError('')
    try {
      const data = await requestCheckoutQuote(groupedItems, couponCode)
      setTotals(data)
      setAppliedCoupon(data.couponCode ?? '')
      setCouponDraft(data.couponCode ?? couponCode)
      setQuoteError('')
    } catch (error) {
      setCouponError(
        error instanceof Error ? error.message : 'Não foi possível validar o cupom',
      )
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleFinishPurchase = async () => {
    if (!user) {
      navigate('/auth')
      return
    }

    try {
      const paymentResponse = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: groupedItems,
          ...(appliedCoupon ? { couponCode: appliedCoupon } : {}),
        }),
      })

      if (!paymentResponse.ok) {
        const data = await paymentResponse.json()
        throw new Error(data.message || 'Pagamento não aprovado')
      }

      const orderResponse = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: groupedItems,
          ...(appliedCoupon ? { couponCode: appliedCoupon } : {}),
        }),
      })

      if (!orderResponse.ok) {
        const data = await orderResponse.json()
        throw new Error(data.message || 'Não foi possível registrar o pedido')
      }

      await clearCart()
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
                <Text>{totals ? `R$ ${totals.subtotal.toFixed(2)}` : 'Calculando...'}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text>Frete</Text>
                <Text>{totals ? `R$ ${totals.shipping.toFixed(2)}` : 'Calculando...'}</Text>
              </Flex>
              <Box>
                <Flex gap={2}>
                  <Input
                    value={couponDraft}
                    onChange={(event) => setCouponDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleApplyCoupon()
                    }}
                    placeholder="Código do cupom"
                    aria-label="Código do cupom"
                    bg="gray.900"
                  />
                  <Button
                    variant="outline"
                    colorScheme="pink"
                    onClick={handleApplyCoupon}
                    isLoading={isApplyingCoupon}
                    isDisabled={!couponDraft.trim()}
                  >
                    Aplicar
                  </Button>
                </Flex>
                <Text fontSize="xs" color="gray.400" mt={2}>
                  Cupons: POP10 (10%), CULTURA15 (15% acima de R$ 100) e FRETEGRATIS.
                </Text>
                {couponError && <Text role="alert" color="red.300" mt={2}>{couponError}</Text>}
                {quoteError && <Text role="alert" color="red.300" mt={2}>{quoteError}</Text>}
                {appliedCoupon && (
                  <Flex justify="space-between" align="center" mt={1}>
                    <Text color="green.300" fontSize="sm">
                      {appliedCoupon === 'FRETEGRATIS'
                        ? 'Frete grátis aplicado'
                        : `Cupom ${appliedCoupon} aplicado`}
                    </Text>
                    <Button
                      variant="link"
                      size="sm"
                      color="gray.300"
                      onClick={() => {
                        setAppliedCoupon('')
                        setCouponDraft('')
                        setCouponError('')
                      }}
                    >
                      Remover
                    </Button>
                  </Flex>
                )}
              </Box>
              {totals && totals.discount > 0 && (
                <Flex justify="space-between" color="green.300">
                  <Text>Desconto ({totals.couponCode})</Text>
                  <Text>- R$ {totals.discount.toFixed(2)}</Text>
                </Flex>
              )}
              <Flex justify="space-between">
                <Text>Entrega estimada</Text>
                <Text color="pink.300">3 a 5 dias úteis</Text>
              </Flex>
              <Divider />
              <Flex justify="space-between" fontWeight="bold" fontSize="lg">
                <Text>Total</Text>
                <Text>{totals ? `R$ ${totals.total.toFixed(2)}` : 'Calculando...'}</Text>
              </Flex>
              <Button
                colorScheme="pink"
                size="lg"
                onClick={handleFinishPurchase}
                isDisabled={!totals || isApplyingCoupon}
              >
                Finalizar compra
              </Button>
            </Stack>
          </Box>
        </Flex>
      )}
    </Box>
  )
}
