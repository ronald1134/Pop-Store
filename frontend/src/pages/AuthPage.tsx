import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useToast,
} from '@chakra-ui/react'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../context/ProductContext'
import { API_URL } from '../services/api'

export function AuthPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const { loginSession } = useProducts()
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)

  const saveSession = async (token: string, user: { id: number; name: string; email: string; role: string }) => {
    await loginSession({ token, user })

    if (user.role === 'ADMIN') {
      navigate('/admin')
      return
    }

    navigate('/produtos')
  }

  const handleRegister = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro no cadastro')
      }

      await saveSession(data.token, data.user)
      toast({ title: 'Cadastro realizado', status: 'success', duration: 3000, isClosable: true })
    } catch (error) {
      toast({ title: 'Erro ao cadastrar', status: 'error', duration: 3000, isClosable: true })
      console.error(error)
    }
  }

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro no login')
      }

      await saveSession(data.token, data.user)
      toast({ title: 'Login realizado', status: 'success', duration: 3000, isClosable: true })
    } catch (error) {
      toast({ title: 'Erro ao entrar', status: 'error', duration: 3000, isClosable: true })
      console.error(error)
    }
  }

  return (
    <Box maxW="900px" mx="auto" px={6} py={16}>
      <Heading as="h1" size="lg" className="reveal">
        Acesso à loja
      </Heading>

      <Box mt={8} bg="gray.800" borderRadius="xl" p={6} border="1px solid" borderColor="gray.700">
        <Tabs variant="soft-rounded" colorScheme="pink">
          <TabList>
            <Tab>Entrar</Tab>
            <Tab>Criar conta</Tab>
          </TabList>

          <TabPanels mt={6}>
            <TabPanel>
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    placeholder="Email"
                    bg="gray.700"
                    color="white"
                    _placeholder={{ color: 'gray.300', opacity: 1 }}
                    _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Senha</FormLabel>
                  <InputGroup>
                    <Input
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Senha"
                      pr="3rem"
                      bg="gray.700"
                      color="white"
                      _placeholder={{ color: 'gray.300', opacity: 1 }}
                      _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                    <InputRightElement width="3rem">
                      <IconButton
                        type="button"
                        aria-label={showLoginPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-pressed={showLoginPassword}
                        icon={showLoginPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        variant="ghost"
                        size="sm"
                        color={showLoginPassword ? 'white' : 'gray.300'}
                        _hover={{ bg: 'transparent' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button colorScheme="pink" onClick={handleLogin}>
                  Entrar
                </Button>
              </Stack>
            </TabPanel>

            <TabPanel>
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel>Nome</FormLabel>
                  <Input
                    bg="gray.700"
                    color="white"
                    _placeholder={{ color: 'gray.300', opacity: 1 }}
                    _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    bg="gray.700"
                    color="white"
                    _placeholder={{ color: 'gray.300', opacity: 1 }}
                    _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Senha</FormLabel>
                  <InputGroup>
                    <Input
                      type={showRegisterPassword ? 'text' : 'password'}
                      pr="3rem"
                      bg="gray.700"
                      color="white"
                      _placeholder={{ color: 'gray.300', opacity: 1 }}
                      _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    />
                    <InputRightElement width="3rem">
                      <IconButton
                        type="button"
                        aria-label={showRegisterPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-pressed={showRegisterPassword}
                        icon={showRegisterPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        variant="ghost"
                        size="sm"
                        color={showRegisterPassword ? 'white' : 'gray.300'}
                        _hover={{ bg: 'transparent' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button colorScheme="pink" onClick={handleRegister}>
                  Cadastrar
                </Button>
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  )
}
