import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
} from '@chakra-ui/react'
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

  const saveSession = (token: string, user: { id: number; name: string; email: string; role: string }) => {
    loginSession({ token, user })

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

      saveSession(data.token, data.user)
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

      saveSession(data.token, data.user)
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
        <Text color="gray.300" fontSize="sm" mb={6}>
          Demo administrativa: admin@culturepop.com / admin123
        </Text>

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
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Senha</FormLabel>
                  <Input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
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
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Senha</FormLabel>
                  <Input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  />
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
