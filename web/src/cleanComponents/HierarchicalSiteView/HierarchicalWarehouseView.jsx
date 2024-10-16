import React, { useEffect, useReducer } from 'react'
import { Card, Skeleton, Stack, Typography } from '@mui/material'
import useCountries from '../../hooks/geography/useCountries'
import useSites from '../../hooks/site/useSites'
import { buildTheHierarchicalDataStructure } from './buildHierarchicalDataStructure'
import { HierarchyLoader } from './HierarchyLoader'
import { TreeNode } from './TreeNode'
import {
  initialWarehouseState,
  loadInitialDataAction,
  selectUnselectLinkedWarehouseAction,
  selectUnselectUnlinkedSitesAction,
  warehouseReducer,
} from './warehouseReducer'

export function HierarchicalWarehouseView(props) {
  const { countryId, setSelectedSiteIds } = props

  const [
    { underDistribution, underDistributionSelectedSiteIds, outsideDistribution, outsideDistributionSelected },
    dispatch,
  ] = useReducer(warehouseReducer, initialWarehouseState)

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

  useEffect(() => {
    if (outsideDistributionSelected) {
      setSelectedSiteIds([...outsideDistribution.map(site => site.id)])
    } else {
      setSelectedSiteIds([...underDistributionSelectedSiteIds])
    }
  }, [
    underDistribution,
    outsideDistribution,
    underDistributionSelectedSiteIds,
    outsideDistributionSelected,
    setSelectedSiteIds,
  ])

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
          <>
            {underDistribution.map(warehouse => (
              <Stack key={warehouse.id} sx={{ flexDirection: 'column' }}>
                <TreeNode
                  data={{ id: warehouse.id, name: warehouse.name }}
                  callback={() => dispatch(selectUnselectLinkedWarehouseAction([warehouse.id]))}
                  selected={underDistributionSelectedSiteIds.has(warehouse.id)}
                  options={{ showChevron: true, noLeftPadding: true }}
                >
                  {underDistributionSelectedSiteIds.has(warehouse.id)
                    ? warehouse.child.map(national => (
                        <TreeNode
                          key={`${warehouse.id}-${national.id}`}
                          data={{ id: national.id, name: national.name }}
                          callback={() => dispatch(selectUnselectLinkedWarehouseAction([warehouse.id, national.id]))}
                          selected={underDistributionSelectedSiteIds.has(national.id)}
                          options={{ showChevron: Boolean(national.child?.length), noLeftPadding: false }}
                        >
                          {underDistributionSelectedSiteIds.has(national.id)
                            ? national.child.map(regional => (
                                <TreeNode
                                  key={`${warehouse.id}-${national.id}-${regional.id}`}
                                  data={{ id: regional.id, name: regional.name }}
                                  callback={() =>
                                    dispatch(
                                      selectUnselectLinkedWarehouseAction([warehouse.id, national.id, regional.id])
                                    )
                                  }
                                  selected={underDistributionSelectedSiteIds.has(regional.id)}
                                  options={{ showChevron: false, noLeftPadding: false }}
                                />
                              ))
                            : null}
                        </TreeNode>
                      ))
                    : null}
                </TreeNode>
              </Stack>
            ))}
            {
              <TreeNode
                data={{
                  id: `sites-outside-distribution-channel`,
                  name: `Sites out of distribution channel (${outsideDistribution.length})`,
                }}
                callback={() => dispatch(selectUnselectUnlinkedSitesAction())}
                selected={outsideDistributionSelected}
                options={{ showChevron: true, noLeftPadding: true }}
              >
                {outsideDistributionSelected
                  ? outsideDistribution.map(site => (
                      <TreeNode
                        key={site.id}
                        data={{ id: site.id, name: site.name }}
                        options={{ showChevron: false, noLeftPadding: false }}
                      />
                    ))
                  : null}
              </TreeNode>
            }
          </>
        )}
      </Stack>
    </Card>
  )
}
