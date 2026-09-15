import {
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Link,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { BookOpen, ShoppingCart } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ReactNode } from 'react'
import { useProducts } from '../context/ProductContext'

export function Layout({ children }: { children: ReactNode }) {
  const { cart, user, isAdmin, logout } = useProducts()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const navigate = useNavigate()

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Produtos', to: '/produtos' },
    { label: 'Checkout', to: '/checkout' },
    { label: 'Pedidos', to: '/pedidos' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <Box minH="100vh" bg="gray.900" color="white">
      <Box
        as="header"
        position="sticky"
        top={0}
        zIndex={10}
        backdropFilter="blur(16px)"
        bg="rgba(15, 23, 42, 0.8)"
        borderBottom="1px solid"
        borderColor="gray.700"
      >
        <Flex maxW="1200px" mx="auto" px={6} py={4} justify="space-between" align="center">
          <Text fontSize="xl" fontWeight="bold" letterSpacing="tight">
            Cultura Pop Store
          </Text>

          <HStack spacing={6} display={{ base: 'none', md: 'flex' }}>
            {navItems.map((item) => (
              <Link
                as={NavLink}
                key={item.to}
                to={item.to}
                color="gray.200"
                _activeLink={{ color: 'pink.300', fontWeight: 'bold' }}
                _hover={{ color: 'pink.200' }}
              >
                {item.label}
              </Link>
            ))}

            {isAdmin && (
              <Link
                as={NavLink}
                to="/admin"
                color="gray.200"
                _activeLink={{ color: 'pink.300', fontWeight: 'bold' }}
                _hover={{ color: 'pink.200' }}
              >
                Admin
              </Link>
            )}
          </HStack>

          <HStack spacing={3}>
            <HStack spacing={2} align="center">
              <Badge colorScheme="pink" borderRadius="full" px={2}>
                {cart.length}
              </Badge>

              <IconButton
                aria-label="Ir para o checkout"
                icon={<ShoppingCart size={18} />}
                variant="outline"
                colorScheme="pink"
                bg="rgba(244, 114, 182, 0.08)"
                borderColor="pink.300"
                color="pink.100"
                _hover={{ bg: 'pink.500', color: 'white', borderColor: 'pink.400' }}
                _active={{ bg: 'pink.600', borderColor: 'pink.500' }}
                onClick={() => navigate('/checkout')}
              />
            </HStack>

            {user ? (
              <Button
                variant="outline"
                colorScheme="pink"
                bg="rgba(244, 114, 182, 0.08)"
                borderColor="pink.300"
                color="pink.100"
                _hover={{ bg: 'pink.500', color: 'white', borderColor: 'pink.400' }}
                _active={{ bg: 'pink.600', borderColor: 'pink.500' }}
                onClick={handleLogout}
                size="sm"
              >
                Sair
              </Button>
            ) : (
              <Button
                as={NavLink}
                to="/auth"
                variant="outline"
                colorScheme="pink"
                bg="rgba(244, 114, 182, 0.08)"
                borderColor="pink.300"
                color="pink.100"
                _hover={{ bg: 'pink.500', color: 'white', borderColor: 'pink.400' }}
                _active={{ bg: 'pink.600', borderColor: 'pink.500' }}
                size="sm"
              >
                Login
              </Button>
            )}

            <IconButton
              aria-label="Abrir livro"
              display={{ base: 'flex', md: 'none' }}
              icon={<BookOpen size={18} />}
              variant="outline"
              colorScheme="pink"
              bg="rgba(244, 114, 182, 0.08)"
              borderColor="pink.300"
              color="pink.100"
              _hover={{ bg: 'pink.500', color: 'white', borderColor: 'pink.400' }}
              _active={{ bg: 'pink.600', borderColor: 'pink.500' }}
              onClick={onOpen}
            />
          </HStack>
        </Flex>
      </Box>

      <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent bg="#23314a" color="#f8fafc" borderLeft="1px solid" borderColor="pink.300">
          <DrawerCloseButton color="pink.100" />
          <DrawerHeader color="pink.100" borderBottom="1px solid" borderColor="pink.300">
            Livro de navegação
          </DrawerHeader>
          <DrawerBody pt={6}>
            <Box display="flex" flexDirection="column" gap={4}>
              {[...navItems, ...(isAdmin ? [{ label: 'Admin', to: '/admin' }] : [])].map((item) => (
                <Button
                  key={item.to}
                  variant="solid"
                  bg="gray.700"
                  color="white"
                  border="1px solid"
                  borderColor="pink.300"
                  _hover={{ bg: 'pink.500', color: 'white' }}
                  onClick={() => {
                    navigate(item.to)
                    onClose()
                  }}
                >
                  {item.label}
                </Button>
              ))}

              {user ? (
                <Button
                  variant="outline"
                  colorScheme="pink"
                  borderColor="pink.300"
                  color="pink.100"
                  onClick={handleLogout}
                >
                  Sair
                </Button>
              ) : (
                <Button
                  variant="outline"
                  colorScheme="pink"
                  borderColor="pink.300"
                  color="pink.100"
                  onClick={() => {
                    navigate('/auth')
                    onClose()
                  }}
                >
                  Login
                </Button>
              )}
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box as="main">{children}</Box>
    </Box>
  )
}
