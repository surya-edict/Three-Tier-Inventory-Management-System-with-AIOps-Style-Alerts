import React, { useEffect, useState } from 'react'
import { Button, FormControl, FormLabel, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, NumberInput, NumberInputField, Textarea, VStack } from '@chakra-ui/react'

const RestockModal = ({ isOpen, onClose, product, onSubmit, isLoading }) => {
  const [quantity, setQuantity] = useState('1')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (isOpen) {
      setQuantity('1')
      setNote('Supplier delivery received')
    }
  }, [isOpen, product?.id])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      product_id: product.id,
      quantity: parseInt(quantity, 10) || 1,
      note,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Restock Product</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Quantity to Add</FormLabel>
                <NumberInput min={1} value={quantity} onChange={(value) => setQuantity(value)}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Reason</FormLabel>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant='ghost' mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme='green' type='submit' isLoading={isLoading}>Add Stock</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default RestockModal
