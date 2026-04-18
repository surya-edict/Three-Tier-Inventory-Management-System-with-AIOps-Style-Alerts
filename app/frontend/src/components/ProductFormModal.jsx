import React, { useEffect, useState } from 'react'
import { Button, FormControl, FormLabel, HStack, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, NumberInput, NumberInputField, Select, Textarea, VStack } from '@chakra-ui/react'

const emptyForm = {
  id: null,
  name: '',
  sku: '',
  description: '',
  price: '',
  quantity: '',
  threshold: 10,
  supplier_id: '',
  status: 'active',
}

const ProductFormModal = ({ isOpen, onClose, suppliers, initialData, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        id: initialData.id ?? null,
        name: initialData.name ?? '',
        sku: initialData.sku ?? '',
        description: initialData.description ?? '',
        price: String(initialData.price ?? ''),
        quantity: String(initialData.quantity ?? ''),
        threshold: initialData.threshold ?? 10,
        supplier_id: initialData.supplier_id ?? '',
        status: initialData.status ?? 'active',
      })
    } else if (isOpen) {
      setFormData(emptyForm)
    }
  }, [isOpen, initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      price: parseFloat(formData.price) || 0,
      quantity: parseInt(formData.quantity, 10) || 0,
      threshold: parseInt(formData.threshold, 10) || 0,
      supplier_id: parseInt(formData.supplier_id, 10),
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='lg'>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>{formData.id ? 'Edit Product' : 'Add Product'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack w='full'>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel>SKU</FormLabel>
                  <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder='Auto generated if blank' />
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </FormControl>
              <HStack w='full'>
                <FormControl isRequired>
                  <FormLabel>Price</FormLabel>
                  <NumberInput min={0} value={formData.price} onChange={(value) => setFormData({ ...formData, price: value })}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Quantity</FormLabel>
                  <NumberInput min={0} value={formData.quantity} onChange={(value) => setFormData({ ...formData, quantity: value })}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Threshold</FormLabel>
                  <NumberInput min={0} value={formData.threshold} onChange={(value) => setFormData({ ...formData, threshold: value })}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </HStack>
              <HStack w='full'>
                <FormControl isRequired>
                  <FormLabel>Supplier</FormLabel>
                  <Select value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}>
                    <option value=''>Select supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value='active'>Active</option>
                    <option value='archived'>Archived</option>
                  </Select>
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant='ghost' mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme='blue' type='submit' isLoading={isLoading}>
              {formData.id ? 'Update Product' : 'Save Product'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default ProductFormModal
