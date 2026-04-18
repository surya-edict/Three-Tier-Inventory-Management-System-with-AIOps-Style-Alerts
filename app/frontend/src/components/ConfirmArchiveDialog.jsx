import React, { useRef } from 'react'
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button } from '@chakra-ui/react'

const ConfirmArchiveDialog = ({ isOpen, onClose, onConfirm, productName, isLoading }) => {
  const cancelRef = useRef()

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize='lg' fontWeight='bold'>Archive Product</AlertDialogHeader>
          <AlertDialogBody>
            {productName ? `${productName} will be archived from active inventory views, but order and stock history will remain intact.` : 'Archive this product?'}
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>Cancel</Button>
            <Button colorScheme='red' onClick={onConfirm} ml={3} isLoading={isLoading}>Archive</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  )
}

export default ConfirmArchiveDialog
