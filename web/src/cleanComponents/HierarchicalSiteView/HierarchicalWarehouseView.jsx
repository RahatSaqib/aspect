import React, { useState } from 'react'
import { Card, Skeleton, Stack, Typography } from '@mui/material'
import useCountries from '../../hooks/geography/useCountries'
import useSites from '../../hooks/site/useSites'
import { siteTypeExternalIds } from './constants'
import { HierarchyLoader } from './HierarchyLoader'
import { TreeNode } from './TreeNode'

function buildParentHierarchy(parentWarehouseId, data, level) {
  const child = []
  if (level === 0 || !data) {
    return child
  }
  for (const [key, value] of data) {
    if (key === parentWarehouseId) {
      data.delete(key)
      child.push({ ...value, child: buildParentHierarchy(value.id, data, level - 1) })
    }
  }
  return child
}

function buildTheHierarchicalDataStructure(apiData) {
  const data = new Map()
  const auxiliaryData = new Map()
  // We should do full iteration to capture data that is without parentWarehouseId because we use this data during our iteration, if we are to do it single iteration we may miss out on few values.
  for (const value of apiData) {
    // Top level national warehouse is captured here
    if (!value.parentWarehouseId) {
      data.set(value.id, { ...value, child: [] })
    } else {
      auxiliaryData.set(value.parentWarehouseId, value)
    }
  }

  for (const [key, value] of new Map(data)) {
    data.set(key, { ...value, child: buildParentHierarchy(key, auxiliaryData, 3) })
  }

  return { data: [...data.values()], outsideDistribution: [...auxiliaryData.values()] }
}

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
        },
        sortCol: 'name',
        sortDir: 'asc',
        pageAt: 0,
        pageSize: 10000,
      },
      { enabled: Boolean(countryId) }
    )

  console.log('Data after processing is ::: ==== >>> ', buildTheHierarchicalDataStructure(nationalLevelSitesData))

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
                  ? [].map(site => (
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
