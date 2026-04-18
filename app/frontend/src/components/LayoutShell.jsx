import React from 'react'
import { Box, Flex, Heading, HStack, Link, Stack, Text } from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'

const links = [
  { label: 'Dashboard', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Suppliers', to: '/suppliers' },
  { label: 'Orders', to: '/orders' },
  { label: 'Movements', to: '/movements' },
]

const LayoutShell = ({ title, subtitle, actions, children }) => {
  return (
    <Flex minH='100vh' bg='gray.50'>
      <Box w={{ base: 'full', md: '250px' }} bg='gray.900' color='white' px={6} py={8}>
        <Heading size='md' mb={2}>Mega Inventory</Heading>
        <Text fontSize='sm' color='gray.300' mb={8}>Single warehouse operations console</Text>
        <Stack spacing={2}>
          {links.map((link) => (
            <Link
              key={link.to}
              as={NavLink}
              to={link.to}
              px={3}
              py={2}
              borderRadius='md'
              _hover={{ textDecoration: 'none', bg: 'whiteAlpha.200' }}
              _activeLink={{ bg: 'blue.500', color: 'white' }}
            >
              {link.label}
            </Link>
          ))}
        </Stack>
      </Box>

      <Box flex='1' px={{ base: 5, md: 8 }} py={8}>
        <Flex justify='space-between' align='start' wrap='wrap' gap={4} mb={8}>
          <Box>
            <Heading size='lg'>{title}</Heading>
            {subtitle ? <Text color='gray.600' mt={2}>{subtitle}</Text> : null}
          </Box>
          <HStack spacing={3}>{actions}</HStack>
        </Flex>
        {children}
      </Box>
    </Flex>
  )
}

export default LayoutShell
