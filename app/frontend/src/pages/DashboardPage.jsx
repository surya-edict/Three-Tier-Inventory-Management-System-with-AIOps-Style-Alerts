import React from 'react'
import { Badge, Box, Grid, GridItem, Heading, HStack, Spinner, Table, Tbody, Td, Text, Th, Thead, Tr, VStack } from '@chakra-ui/react'
import { useQuery } from 'react-query'
import LayoutShell from '../components/LayoutShell.jsx'
import StatCard from '../components/StatCard.jsx'
import { inventoryApi } from '../api/client.js'

const DashboardPage = () => {
  const summaryQuery = useQuery('dashboard-summary', inventoryApi.getDashboardSummary)
  const lowStockQuery = useQuery('dashboard-low-stock', inventoryApi.getLowStockProducts)

  if (summaryQuery.isLoading || lowStockQuery.isLoading) {
    return <Box display='flex' justifyContent='center' mt={20}><Spinner size='xl' /></Box>
  }

  const summary = summaryQuery.data
  const lowStockItems = lowStockQuery.data ?? []

  return (
    <LayoutShell title='Operations Dashboard' subtitle='Track current stock health, supplier activity, and recent inventory movement.'>
      <VStack spacing={6} align='stretch'>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
          <StatCard label='Active Products' value={summary.active_products} helper={`${summary.archived_products} archived`} />
          <StatCard label='Low Stock Items' value={summary.low_stock_items} helper='Needs restock attention' accent='red.500' />
          <StatCard label='Active Suppliers' value={summary.active_suppliers} helper='Vendor base available' accent='purple.500' />
          <StatCard label='Total Units On Hand' value={summary.total_units} helper={`${summary.total_orders} total sales orders`} accent='green.500' />
        </Grid>

        <Grid templateColumns={{ base: '1fr', xl: '2fr 1fr' }} gap={6}>
          <GridItem>
            <Box bg='white' borderWidth='1px' borderColor='gray.200' borderRadius='xl' p={5}>
              <Heading size='md' mb={4}>Low Stock Triage</Heading>
              <Table variant='simple'>
                <Thead>
                  <Tr>
                    <Th>Product</Th>
                    <Th>Supplier</Th>
                    <Th isNumeric>Qty</Th>
                    <Th isNumeric>Threshold</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {lowStockItems.length === 0 ? (
                    <Tr><Td colSpan={4} py={8} textAlign='center'>No low stock products right now.</Td></Tr>
                  ) : lowStockItems.map((item) => (
                    <Tr key={item.id}>
                      <Td>
                        <Text fontWeight='semibold'>{item.name}</Text>
                        <Text fontSize='sm' color='gray.500'>{item.sku || 'No SKU'}</Text>
                      </Td>
                      <Td>{item.supplier?.name || 'Unassigned'}</Td>
                      <Td isNumeric>{item.quantity}</Td>
                      <Td isNumeric>{item.threshold}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </GridItem>

          <GridItem>
            <Box bg='white' borderWidth='1px' borderColor='gray.200' borderRadius='xl' p={5}>
              <Heading size='md' mb={4}>Quick Health</Heading>
              <VStack spacing={4} align='stretch'>
                <HStack justify='space-between'>
                  <Text>Inventory State</Text>
                  <Badge colorScheme={summary.low_stock_items > 0 ? 'red' : 'green'}>{summary.low_stock_items > 0 ? 'Attention Needed' : 'Stable'}</Badge>
                </HStack>
                <HStack justify='space-between'>
                  <Text>Recent Movements Today</Text>
                  <Badge colorScheme='blue'>{summary.recent_movements}</Badge>
                </HStack>
                <HStack justify='space-between'>
                  <Text>Total Product Records</Text>
                  <Badge colorScheme='purple'>{summary.total_products}</Badge>
                </HStack>
              </VStack>
            </Box>
          </GridItem>
        </Grid>
      </VStack>
    </LayoutShell>
  )
}

export default DashboardPage
