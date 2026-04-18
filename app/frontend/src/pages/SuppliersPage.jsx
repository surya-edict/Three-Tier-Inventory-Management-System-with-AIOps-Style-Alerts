import React, { useState } from 'react'
import { Badge, Box, Button, HStack, IconButton, Spinner, Table, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast } from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import LayoutShell from '../components/LayoutShell.jsx'
import SupplierFormModal from '../components/SupplierFormModal.jsx'
import { inventoryApi } from '../api/client.js'

const SuppliersPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const modal = useDisclosure()
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  const supplierQuery = useQuery('suppliers', () => inventoryApi.getSuppliers({ status: 'active' }))

  const supplierMutation = useMutation(
    async (payload) => payload.id ? inventoryApi.updateSupplier(payload.id, payload) : inventoryApi.createSupplier(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('suppliers')
        modal.onClose()
        setSelectedSupplier(null)
        toast({ title: 'Supplier saved', status: 'success', duration: 2500 })
      },
      onError: (error) => toast({ title: 'Supplier save failed', description: error.response?.data?.detail || error.message, status: 'error', duration: 3000 }),
    }
  )

  return (
    <LayoutShell
      title='Suppliers'
      subtitle='Maintain vendor records used by active inventory products.'
      actions={<Button colorScheme='blue' onClick={() => { setSelectedSupplier(null); modal.onOpen() }}>Add Supplier</Button>}
    >
      <Box bg='white' borderWidth='1px' borderColor='gray.200' borderRadius='xl' overflow='hidden'>
        {supplierQuery.isLoading ? (
          <Box py={16} display='flex' justifyContent='center'><Spinner size='xl' /></Box>
        ) : (
          <Table variant='simple'>
            <Thead bg='gray.50'>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {(supplierQuery.data ?? []).length === 0 ? (
                <Tr><Td colSpan={5} py={12} textAlign='center'>No suppliers available yet.</Td></Tr>
              ) : (supplierQuery.data ?? []).map((supplier) => (
                <Tr key={supplier.id}>
                  <Td><Text fontWeight='semibold'>{supplier.name}</Text></Td>
                  <Td>{supplier.contact_email}</Td>
                  <Td>{supplier.phone}</Td>
                  <Td><Badge colorScheme={supplier.status === 'active' ? 'green' : 'gray'}>{supplier.status}</Badge></Td>
                  <Td>
                    <HStack>
                      <IconButton aria-label='Edit supplier' icon={<EditIcon />} size='sm' onClick={() => { setSelectedSupplier(supplier); modal.onOpen() }} />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      <SupplierFormModal
        isOpen={modal.isOpen}
        onClose={() => { setSelectedSupplier(null); modal.onClose() }}
        initialData={selectedSupplier}
        onSubmit={(payload) => supplierMutation.mutate(payload)}
        isLoading={supplierMutation.isLoading}
      />
    </LayoutShell>
  )
}

export default SuppliersPage
