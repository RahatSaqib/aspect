import React, { useState } from 'react'
import { Card, Skeleton, Stack, Typography } from '@mui/material'
import useCountries from '../../hooks/geography/useCountries'
import useSites from '../../hooks/site/useSites'
import { siteTypeExternalIds } from './constants'
import { HierarchyLoader } from './HierarchyLoader'
import { TreeNode } from './TreeNode'

export function HierarchicalWarehouseView(props) {
  const { countryId } = props

  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')

  const { isLoading: isCountryLoading, data: countries } = useCountries(true)
  const selectedCountry = countries?.find(({ id }) => id === countryId)

  const { isLoading: isNationalLevelSitesLoading, data: { siteList: nationalLevelSitesData } = { siteList: [] } } =
    useSites(
      {
        filters: {
          countryId,
          siteTypeExternalId: [siteTypeExternalIds.warehouse].join(','),
          parentWarehouseId: selectedWarehouseId,
        },
        sortCol: 'name',
        sortDir: 'asc',
        pageAt: 0,
        pageSize: 100,
      },
      { enabled: Boolean(countryId) && !selectedWarehouseId }
    )

  const { isLoading: isChildLevelSitesData, data: { siteList: childSiteData } = { siteList: [] } } = useSites(
    {
      filters: {
        countryId,
        siteTypeExternalId: [siteTypeExternalIds.warehouse].join(','),
        parentWarehouseId: selectedWarehouseId,
      },
      sortCol: 'name',
      sortDir: 'asc',
      pageAt: 0,
      pageSize: 100,
    },
    { enabled: Boolean(countryId) && Boolean(selectedWarehouseId) }
  )

  console.info('inside checking the ', childSiteData, nationalLevelSitesData)

  const callback = data => {
    setSelectedWarehouseId(data.warehouseId)
  }

  return (
    <Card sx={{ minWidth: 300, py: 2, maxHeight: 640, overflowY: 'auto', boxShadow: 0 }}>
      {isCountryLoading ? (
        <Skeleton height={40} />
      ) : (
        <Typography variant="h6" sx={{ mb: 2 }}>
          {selectedCountry?.name}
        </Typography>
      )}
      <Stack spacing={2}>
        {isNationalLevelSitesLoading ? (
          <HierarchyLoader />
        ) : (
          nationalLevelSitesData.map(warehouse => (
            <Stack key={warehouse.id} sx={{ flexDirection: 'column' }}>
              <TreeNode
                data={{ id: warehouse.id, name: warehouse.name }}
                callback={() =>
                  callback({
                    warehouseId: warehouse.id,
                  })
                }
                selected={selectedWarehouseId && selectedWarehouseId === warehouse.id}
                options={{ showChevron: true, noLeftPadding: true }}
              >
                {selectedWarehouseId && selectedWarehouseId === warehouse.id
                  ? childSiteData.map(site => (
                      <TreeNode
                        data={{ id: site.id, name: site.name }}
                        callback={() =>
                          callback({
                            warehouseId: site.id,
                          })
                        }
                        selected={selectedWarehouseId && selectedWarehouseId === site.id}
                        options={{ showChevron: true, noLeftPadding: false }}
                      />
                    ))
                  : null}
              </TreeNode>
            </Stack>
          ))
        )}
      </Stack>
    </Card>
  )
}
