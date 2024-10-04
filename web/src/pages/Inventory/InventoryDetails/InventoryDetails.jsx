import React from 'react'
import { Box, Card, CardContent, CircularProgress, Grid } from '@mui/material'
import { useParams } from 'react-router-dom'
import { DetailHeader } from '../../../cleanComponents'
import { useConsumableById } from '../../../hooks/inventory/useConsumable'
import { InventoryDetailsForm } from './InventoryDetailsForm'
import { InventoryTabs } from './InventoryTabs'

export const InventoryDetails = () => {
  const { cartridgeId } = useParams()

  const { data, isLoading } = useConsumableById(cartridgeId)

  return isLoading ? (
    <CircularProgress />
  ) : (
    <>
      <DetailHeader name="Inventory Detail" />
      <Box component="main" sx={{ p: 2, width: '100%' }}>
        <Grid container spacing={3}>
          {/* Form Section */}
          <Grid item xs={12} md={8}>
            <InventoryDetailsForm data={data} cartridgeId={cartridgeId} />
          </Grid>

          {/* Tabs Section */}
          <Grid item xs={12} md={4}>
            {' '}
            <Card>
              <CardContent>
                <InventoryTabs
                  consumableId={cartridgeId}
                  siteIds={data.siteIds}
                  disabledSites={data.unreconciledSites}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  )
}
