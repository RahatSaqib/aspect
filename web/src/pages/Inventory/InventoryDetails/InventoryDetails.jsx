import React, { useState } from 'react'
import { Box, Card, CardContent, CircularProgress, Grid } from '@mui/material'
import { useParams } from 'react-router-dom'
import { DetailHeader } from '../../../cleanComponents'
import { useConsumableById } from '../../../hooks/inventory/useConsumable'
import useHasCountryPermission from '../../../hooks/person/useHasCountryPermission'
import { InventoryForm } from './InventoryForm/InventoryForm'
import { InventoryTabs } from './InventoryTabs'
import { useIntl } from 'react-intl'
import messages from './messages'


export const InventoryDetails = () => {
  const { cartridgeId } = useParams()
  const [tabValue, setTabValue] = useState(0)
  const { data, isLoading } = useConsumableById(cartridgeId)
  const { data: permissions, isLoading: isLoadingPermission } = useHasCountryPermission(['inventory:edit'])
  const { formatMessage } = useIntl()

  return isLoading || isLoadingPermission ? (
    <CircularProgress />
  ) : (
    <>
      <DetailHeader name= {formatMessage(messages.inventoryDetail)} />
      <Box component="main" sx={{ pr: 3, width: '100%' }}>
        <Grid container spacing={3}>
          {/* Form Section */}
          <Grid item xs={12} md={tabValue === 0 ? 8 : 12}>
            <InventoryForm
              hasPermission={permissions.hasPermission}
              data={data}
              cartridgeId={cartridgeId}
              tabValue={tabValue}
              setTabValue={setTabValue}
            />
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
