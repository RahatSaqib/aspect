import React from 'react'
import { Box, Card, CardContent, CircularProgress, Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import { useParams } from 'react-router-dom'
import { DetailHeader } from '../../../components'
import { useConsumableById } from '../../../hooks/inventory/useConsumable'
import { InventoryForm } from './InventoryForm/InventoryForm'
import { InventoryTabs } from './InventoryTabs'
import messages from './messages'

export const InventoryDetails = () => {
  const { cartridgeId } = useParams()
  const { formatMessage } = useIntl()
  const { data, isLoading } = useConsumableById(cartridgeId)
  return isLoading ? (
    <CircularProgress />
  ) : (
    <>
      <DetailHeader name={formatMessage(messages.inventoryDetail)} />
      <Box component="main" sx={{ pr: 3, width: '100%' }}>
        <Grid container spacing={3}>
          {/* Form Section */}
          <Grid item xs={12} md={8}>
            <InventoryForm data={data} cartridgeId={cartridgeId} />
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <InventoryTabs consumableId={cartridgeId} siteIds={data.siteIds} disabledSites={data.selectedSites} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  )
}
