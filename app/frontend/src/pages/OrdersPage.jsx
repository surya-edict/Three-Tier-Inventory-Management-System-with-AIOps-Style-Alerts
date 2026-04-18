import React from 'react'
import { Badge, Box, Spinner, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react'
import { useQuery } from 'react-query'
import LayoutShell from '../components/LayoutShell.jsx'
import { inventoryApi } from '../api/client.js'

const OrdersPage = () => {
  const orderQuery = useQuery('orders', () => inventoryApi.getOrders())

  return (
    <LayoutShell title='Sales Orders' subtitle='Review outbound sales activity and transaction history.'>
      <Box bg='white' borderWidth='1px' borderColor='gray.200' borderRadius='xl' overflow='hidden'>
        {orderQuery.isLoading ? (
          <Box py={16} display='flex' justifyContent='center'><Spinner size='xl' /></Box>
        ) : (
          <Table variant='simple'>
            <Thead bg='gray.50'>
              <Tr>
                <Th>Order ID</Th>
                <Th>Product ID</Th>
                <Th isNumeric>Quantity</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Notes</Th>
              </Tr>
            </Thead>
            <Tbody>
              {(orderQuery.data ?? []).length === 0 ? (
                <Tr><Td colSpan={6} py={12} textAlign='center'>No sales orders recorded yet.</Td></Tr>
              ) : (orderQuery.data ?? []).map((order) => (
                <Tr key={order.id}>
                  <Td><Text fontWeight='semibold'>#{order.id}</Text></Td>
                  <Td>{order.product_id}</Td>
                  <Td isNumeric>{order.quantity}</Td>
                  <Td><Badge colorScheme={order.status === 'completed' ? 'green' : 'orange'}>{order.status}</Badge></Td>
                  <Td>{new Date(order.order_date).toLocaleString()}</Td>
                  <Td>{order.notes || '-'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </LayoutShell>
  )
}

export default OrdersPage
