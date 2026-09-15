import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ProductsPage } from './pages/ProductsPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { Layout } from './components/Layout'
import { ProductProvider } from './context/ProductContext'
import { AuthPage } from './pages/AuthPage'
import { OrdersPage } from './pages/OrdersPage'
import { AdminPage } from './pages/AdminPage'

export default function App() {
  return (
    <ProductProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/produtos" element={<ProductsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Layout>
    </ProductProvider>
  )
}
