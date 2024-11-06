import React, { useState } from 'react'
import { Box, Card, CardContent, CircularProgress, Grid } from '@mui/material'
import { useParams } from 'react-router-dom'
import { DetailHeader } from '../../../cleanComponents'
import { useConsumableById } from '../../../hooks/inventory/useConsumable'
import { InventoryForm } from './InventoryForm/InventoryForm'
import { InventoryTabs } from './InventoryTabs'

export const InventoryDetails = () => {
  const { cartridgeId } = useParams()
  const [tabValue, setTabValue] = useState(0)
  const { data, isLoading } = useConsumableById(cartridgeId)

  return isLoading ? (
    <CircularProgress />
  ) : (
    <>
      <DetailHeader name="Inventory Detail" />
      <Box component="main" sx={{ pr: 3, width: '100%' }}>
        <Grid container spacing={3}>
          {/* Form Section */}
          <Grid item xs={12} md={tabValue === 0 ? 8 : 12}>
            <InventoryForm data={data} cartridgeId={cartridgeId} tabValue={tabValue} setTabValue={setTabValue} />
          </Grid>

          {/* Tabs Section */}
          {tabValue === 0 ? (
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <InventoryTabs consumableId={cartridgeId} siteIds={data.siteIds} disabledSites={data.selectedSites} />
                </CardContent>
              </Card>
            </Grid>
          ) : null}
        </Grid>
      </Box>
    </>
  )
}
