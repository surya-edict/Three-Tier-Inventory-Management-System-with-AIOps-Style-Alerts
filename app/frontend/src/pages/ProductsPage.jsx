import React, { useMemo, useState } from 'react'
import { Badge, Box, Button, HStack, IconButton, Spinner, Table, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast, VStack } from '@chakra-ui/react'
import { DeleteIcon, EditIcon, RepeatIcon } from '@chakra-ui/icons'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import LayoutShell from '../components/LayoutShell.jsx'
import ProductFilters from '../components/ProductFilters.jsx'
import ProductFormModal from '../components/ProductFormModal.jsx'
import SellProductModal from '../components/SellProductModal.jsx'
import RestockModal from '../components/RestockModal.jsx'
import ConfirmArchiveDialog from '../components/ConfirmArchiveDialog.jsx'
import { inventoryApi } from '../api/client.js'

const defaultFilters = { search: '', status: 'active', supplier_id: '', low_stock_only: false }

const badgeScheme = {
  OK: 'green',
  Low: 'red',
  'Out of Stock': 'orange',
  Archived: 'gray',
}

const ProductsPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(defaultFilters)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const productModal = useDisclosure()
  const sellModal = useDisclosure()
  const restockModal = useDisclosure()
  const archiveDialog = useDisclosure()

  const supplierQuery = useQuery('suppliers', () => inventoryApi.getSuppliers({ status: 'active' }))
  const productQuery = useQuery(['products', filters], () => inventoryApi.getProducts(filters), { keepPreviousData: true })

  const invalidateAll = () => {
    queryClient.invalidateQueries('dashboard-summary')
    queryClient.invalidateQueries('dashboard-low-stock')
    queryClient.invalidateQueries('suppliers')
    queryClient.invalidateQueries('orders')
    queryClient.invalidateQueries('movements')
    queryClient.invalidateQueries('products')
  }

  const productMutation = useMutation(
    async (payload) => payload.id ? inventoryApi.updateProduct(payload.id, payload) : inventoryApi.createProduct(payload),
    {
      onSuccess: () => {
        invalidateAll()
        productModal.onClose()
        setSelectedProduct(null)
        toast({ title: 'Product saved successfully', status: 'success', duration: 2500 })
      },
      onError: (error) => toast({ title: 'Unable to save product', description: error.response?.data?.detail || error.message, status: 'error', duration: 3000 }),
    }
  )

  const sellMutation = useMutation(inventoryApi.sellProduct, {
    onSuccess: () => {
      invalidateAll()
      sellModal.onClose()
      setSelectedProduct(null)
      toast({ title: 'Sale recorded', status: 'success', duration: 2500 })
    },
    onError: (error) => toast({ title: 'Sale failed', description: error.response?.data?.detail || error.message, status: 'error', duration: 3000 }),
  })

  const restockMutation = useMutation(inventoryApi.restockProduct, {
    onSuccess: () => {
      invalidateAll()
      restockModal.onClose()
      setSelectedProduct(null)
      toast({ title: 'Stock updated', status: 'success', duration: 2500 })
    },
    onError: (error) => toast({ title: 'Restock failed', description: error.response?.data?.detail || error.message, status: 'error', duration: 3000 }),
  })

  const archiveMutation = useMutation((productId) => inventoryApi.archiveProduct(productId), {
    onSuccess: () => {
      invalidateAll()
      archiveDialog.onClose()
      setArchiveTarget(null)
      toast({ title: 'Product archived', status: 'info', duration: 2500 })
    },
    onError: (error) => toast({ title: 'Archive failed', description: error.response?.data?.detail || error.message, status: 'error', duration: 3000 }),
  })

  const products = useMemo(() => productQuery.data ?? [], [productQuery.data])
  const suppliers = supplierQuery.data ?? []

  return (
    <LayoutShell
      title='Products'
      subtitle='Manage active inventory, stock thresholds, and warehouse actions.'
      actions={<Button colorScheme='blue' onClick={() => { setSelectedProduct(null); productModal.onOpen() }}>Add Product</Button>}
    >
      <VStack spacing={6} align='stretch'>
        <ProductFilters filters={filters} suppliers={suppliers} onChange={setFilters} onReset={() => setFilters(defaultFilters)} />

        <Box bg='white' borderWidth='1px' borderColor='gray.200' borderRadius='xl' overflow='hidden'>
          {productQuery.isLoading ? (
            <Box py={16} display='flex' justifyContent='center'><Spinner size='xl' /></Box>
          ) : (
            <Table variant='simple'>
              <Thead bg='gray.50'>
                <Tr>
                  <Th>Product</Th>
                  <Th>Supplier</Th>
                  <Th isNumeric>Price</Th>
                  <Th isNumeric>Qty</Th>
                  <Th isNumeric>Threshold</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {products.length === 0 ? (
                  <Tr><Td colSpan={7} textAlign='center' py={12}>No products match the current filters.</Td></Tr>
                ) : products.map((product) => (
                  <Tr key={product.id}>
                    <Td>
                      <Text fontWeight='semibold'>{product.name}</Text>
                      <Text fontSize='sm' color='gray.500'>{product.sku || 'No SKU'}{product.description ? ` ? ${product.description}` : ''}</Text>
                    </Td>
                    <Td>{product.supplier?.name || 'Unassigned'}</Td>
                    <Td isNumeric>${Number(product.price).toFixed(2)}</Td>
                    <Td isNumeric>{product.quantity}</Td>
                    <Td isNumeric>{product.threshold}</Td>
                    <Td><Badge colorScheme={badgeScheme[product.stock_status] || 'gray'}>{product.stock_status}</Badge></Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button size='sm' colorScheme='orange' onClick={() => { setSelectedProduct(product); sellModal.onOpen() }} isDisabled={product.status === 'archived' || product.quantity <= 0}>Sell</Button>
                        <Button size='sm' colorScheme='green' variant='outline' onClick={() => { setSelectedProduct(product); restockModal.onOpen() }} isDisabled={product.status === 'archived'}>Restock</Button>
                        <IconButton aria-label='Edit product' size='sm' icon={<EditIcon />} onClick={() => { setSelectedProduct(product); productModal.onOpen() }} />
                        <IconButton aria-label='Archive product' size='sm' colorScheme='red' variant='outline' icon={<DeleteIcon />} onClick={() => { setArchiveTarget(product); archiveDialog.onOpen() }} isDisabled={product.status === 'archived'} />
                        <IconButton aria-label='Refresh stock filters' size='sm' variant='ghost' icon={<RepeatIcon />} onClick={() => queryClient.invalidateQueries('products')} />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </VStack>

      <ProductFormModal
        isOpen={productModal.isOpen}
        onClose={() => { setSelectedProduct(null); productModal.onClose() }}
        suppliers={suppliers}
        initialData={selectedProduct}
        onSubmit={(payload) => productMutation.mutate(payload)}
        isLoading={productMutation.isLoading}
      />

      <SellProductModal
        isOpen={sellModal.isOpen}
        onClose={() => { setSelectedProduct(null); sellModal.onClose() }}
        product={selectedProduct}
        onSubmit={(payload) => sellMutation.mutate(payload)}
        isLoading={sellMutation.isLoading}
      />

      <RestockModal
        isOpen={restockModal.isOpen}
        onClose={() => { setSelectedProduct(null); restockModal.onClose() }}
        product={selectedProduct}
        onSubmit={(payload) => restockMutation.mutate(payload)}
        isLoading={restockMutation.isLoading}
      />

      <ConfirmArchiveDialog
        isOpen={archiveDialog.isOpen}
        onClose={() => { setArchiveTarget(null); archiveDialog.onClose() }}
        onConfirm={() => archiveMutation.mutate(archiveTarget.id)}
        productName={archiveTarget?.name}
        isLoading={archiveMutation.isLoading}
      />
    </LayoutShell>
  )
}

export default ProductsPage
