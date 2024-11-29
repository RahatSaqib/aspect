import React from 'react'
import { Card, CardContent } from '@mui/material'
import { InventoryDetailsForm } from './InventoryDetailsForm'

export const InventoryForm = ({ data, cartridgeId }) => {
  return (
    <Card>
      <CardContent>
        <InventoryDetailsForm data={data} cartridgeId={cartridgeId} />
      </CardContent>
    </Card>
  )
}
