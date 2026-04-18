import React from 'react'
import { Button, HStack, Input, Select, Switch, Text } from '@chakra-ui/react'

const ProductFilters = ({ filters, suppliers, onChange, onReset }) => (
  <HStack spacing={3} flexWrap='wrap' align='center' bg='white' p={4} borderWidth='1px' borderColor='gray.200' borderRadius='xl'>
    <Input
      placeholder='Search by name or SKU'
      value={filters.search}
      onChange={(e) => onChange({ ...filters, search: e.target.value })}
      maxW='260px'
      bg='white'
    />
    <Select
      value={filters.status}
      onChange={(e) => onChange({ ...filters, status: e.target.value })}
      maxW='180px'
      bg='white'
    >
      <option value='active'>Active</option>
      <option value='archived'>Archived</option>
      <option value='all'>All</option>
    </Select>
    <Select
      value={filters.supplier_id}
      onChange={(e) => onChange({ ...filters, supplier_id: e.target.value })}
      maxW='220px'
      bg='white'
    >
      <option value=''>All suppliers</option>
      {suppliers.map((supplier) => (
        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
      ))}
    </Select>
    <HStack spacing={2}>
      <Switch
        isChecked={filters.low_stock_only}
        onChange={(e) => onChange({ ...filters, low_stock_only: e.target.checked })}
        colorScheme='red'
      />
      <Text fontSize='sm'>Low stock only</Text>
    </HStack>
    <Button variant='ghost' onClick={onReset}>Reset</Button>
  </HStack>
)

export default ProductFilters
