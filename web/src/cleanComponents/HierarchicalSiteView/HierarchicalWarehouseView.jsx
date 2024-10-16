import React, { useReducer } from 'react'
import { Card, Skeleton, Stack, Typography } from '@mui/material'
import useCountries from '../../hooks/geography/useCountries'
import useSites from '../../hooks/site/useSites'
import { buildTheHierarchicalDataStructure } from './buildHierarchicalDataStructure'
import { siteTypeExternalIds } from './constants'
import { HierarchyLoader } from './HierarchyLoader'
import { TreeNode } from './TreeNode'
import { loadInitialDataAction, selectUnselectWarehouseAction, warehouseReducer } from './warehouseReducer'

export function HierarchicalWarehouseView(props) {
  const { countryId } = props

  const [{ data, outsideDistribution }, dispatch] = useReducer(warehouseReducer, { data: [], outsideDistribution: [] })

  const { isLoading: isCountryLoading, data: countries } = useCountries(true)
  const selectedCountry = countries?.find(({ id }) => id === countryId)

  const { isLoading } = useSites(
    {
      filters: {
        countryId,
      },
      sortCol: 'name',
      sortDir: 'asc',
      pageAt: 0,
      pageSize: 10000,
    },
    {
      onSuccess: ({ siteList = [] }) => {
        dispatch(loadInitialDataAction(buildTheHierarchicalDataStructure(siteList)))
      },
    }
  )

  console.log('outsideDistribution ::: == ', data, outsideDistribution)

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
        {isLoading ? (
          <HierarchyLoader />
        ) : (
          data.map(warehouse => (
            <Stack key={warehouse.id} sx={{ flexDirection: 'column' }}>
              <TreeNode
                data={{ id: warehouse.id, name: warehouse.name }}
                callback={() => dispatch(selectUnselectWarehouseAction(`${warehouse.id}`))}
                selected={warehouse.selected}
                options={{ showChevron: true, noLeftPadding: true }}
              >
                {warehouse.selected
                  ? warehouse.child.map(national => (
                      <TreeNode
                        key={`${warehouse.id}-${national.id}`}
                        data={{ id: national.id, name: national.name }}
                        callback={() => dispatch(selectUnselectWarehouseAction(`${warehouse.id}-${national.id}`))}
                        selected={national.selected}
                        options={{ showChevron: true, noLeftPadding: false }}
                      >
                        {national.selected
                          ? national.child.map(regional => (
                              <TreeNode
                                key={`${warehouse.id}-${national.id}-${regional.id}`}
                                data={{ id: regional.id, name: regional.name }}
                                callback={() =>
                                  dispatch(
                                    selectUnselectWarehouseAction(`${warehouse.id}-${national.id}-${regional.id}`)
                                  )
                                }
                                selected={regional.selected}
                                options={{ showChevron: false, noLeftPadding: false }}
                              />
                            ))
                          : null}
                      </TreeNode>
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
