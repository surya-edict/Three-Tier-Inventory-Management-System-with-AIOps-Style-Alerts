import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage.jsx'
import MovementsPage from './pages/MovementsPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import SuppliersPage from './pages/SuppliersPage.jsx'

const App = () => (
  <Routes>
    <Route path='/' element={<DashboardPage />} />
    <Route path='/products' element={<ProductsPage />} />
    <Route path='/suppliers' element={<SuppliersPage />} />
    <Route path='/orders' element={<OrdersPage />} />
    <Route path='/movements' element={<MovementsPage />} />
    <Route path='*' element={<Navigate to='/' replace />} />
  </Routes>
)

export default App
