import React from 'react'
import { Box, Heading, Text } from '@chakra-ui/react'

const StatCard = ({ label, value, helper, accent = 'blue.500' }) => (
  <Box bg='white' borderWidth='1px' borderColor='gray.200' borderRadius='xl' p={5} shadow='sm'>
    <Text fontSize='sm' color='gray.500' mb={2}>{label}</Text>
    <Heading size='lg' color={accent}>{value}</Heading>
    {helper ? <Text mt={2} fontSize='sm' color='gray.600'>{helper}</Text> : null}
  </Box>
)

export default StatCard
