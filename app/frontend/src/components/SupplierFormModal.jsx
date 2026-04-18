import React, { useEffect, useState } from 'react'
import { Button, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, VStack } from '@chakra-ui/react'

const emptySupplier = {
  id: null,
  name: '',
  contact_email: '',
  phone: '',
  status: 'active',
}

const SupplierFormModal = ({ isOpen, onClose, initialData, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState(emptySupplier)

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({ ...emptySupplier, ...initialData })
    } else if (isOpen) {
      setFormData(emptySupplier)
    }
  }, [isOpen, initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>{formData.id ? 'Edit Supplier' : 'Add Supplier'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input type='email' value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Phone</FormLabel>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value='active'>Active</option>
                  <option value='inactive'>Inactive</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant='ghost' mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme='blue' type='submit' isLoading={isLoading}>Save Supplier</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default SupplierFormModal
