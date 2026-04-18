import React from 'react'
import { Badge, Box, Spinner, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react'
import { useQuery } from 'react-query'
import LayoutShell from '../components/LayoutShell.jsx'
import { inventoryApi } from '../api/client.js'

const movementColor = {
  sale: 'orange',
  restock: 'green',
  adjustment: 'blue',
  initial_stock: 'purple',
}

const MovementsPage = () => {
  const movementQuery = useQuery('movements', () => inventoryApi.getMovements())

  return (
    <LayoutShell title='Inventory Movements' subtitle='Audit every stock change across sales, restocks, and manual adjustments.'>
      <Box bg='white' borderWidth='1px' borderColor='gray.200' borderRadius='xl' overflow='hidden'>
        {movementQuery.isLoading ? (
          <Box py={16} display='flex' justifyContent='center'><Spinner size='xl' /></Box>
        ) : (
          <Table variant='simple'>
            <Thead bg='gray.50'>
              <Tr>
                <Th>Movement ID</Th>
                <Th>Product ID</Th>
                <Th>Type</Th>
                <Th isNumeric>Delta</Th>
                <Th isNumeric>After</Th>
                <Th>Note</Th>
                <Th>Created</Th>
              </Tr>
            </Thead>
            <Tbody>
              {(movementQuery.data ?? []).length === 0 ? (
                <Tr><Td colSpan={7} py={12} textAlign='center'>No inventory movement history available yet.</Td></Tr>
              ) : (movementQuery.data ?? []).map((movement) => (
                <Tr key={movement.id}>
                  <Td><Text fontWeight='semibold'>#{movement.id}</Text></Td>
                  <Td>{movement.product_id}</Td>
                  <Td><Badge colorScheme={movementColor[movement.movement_type] || 'gray'}>{movement.movement_type}</Badge></Td>
                  <Td isNumeric>{movement.quantity_delta}</Td>
                  <Td isNumeric>{movement.quantity_after}</Td>
                  <Td>{movement.note || '-'}</Td>
                  <Td>{new Date(movement.created_at).toLocaleString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </LayoutShell>
  )
}

export default MovementsPage
