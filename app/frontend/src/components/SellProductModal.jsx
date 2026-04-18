import React, { useEffect, useState } from 'react'
import { Button, FormControl, FormLabel, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, NumberInput, NumberInputField, Textarea, VStack } from '@chakra-ui/react'

const SellProductModal = ({ isOpen, onClose, product, onSubmit, isLoading }) => {
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      setQuantity('1')
      setNotes('')
    }
  }, [isOpen, product?.id])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      product_id: product.id,
      quantity: parseInt(quantity, 10) || 1,
      notes,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Sell Product</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Quantity (Available: {product?.quantity ?? 0})</FormLabel>
                <NumberInput min={1} max={product?.quantity ?? 1} value={quantity} onChange={(value) => setQuantity(value)}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Note</FormLabel>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='Optional sale note' />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant='ghost' mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme='orange' type='submit' isLoading={isLoading} isDisabled={!product || parseInt(quantity, 10) < 1 || parseInt(quantity, 10) > (product?.quantity ?? 0)}>Confirm Sale</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default SellProductModal
