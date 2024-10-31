import React, { useEffect, useReducer } from 'react'
import { Card, Skeleton, Stack, Typography } from '@mui/material'
import useCountries from '../../hooks/geography/useCountries'
import useSites from '../../hooks/site/useSites'
import { buildTheHierarchicalDataStructure, getAllIdsFromChildren, TREE_HIERARCHICAL_VIEW_LEVELS } from './helpers'
import { HierarchyLoader } from './HierarchyLoader'
import { TreeNode } from './TreeNode'
import {
  initialWarehouseState,
  selectUnselectLinkedWarehouseAction,
  selectUnselectUnlinkedSitesAction,
  warehouseReducer,
} from './warehouseReducer'

export function HierarchicalWarehouseView(props) {
  const { countryId, setSelectedSiteIds, expanded } = props

  const [
    { underDistributionSelectedSiteIds, outsideDistributionSelected, outsideDistributionSelectedSiteIds },
    dispatch,
  ] = useReducer(warehouseReducer, initialWarehouseState)

  const { isLoading: isCountryLoading, data: countries } = useCountries(true)
  const selectedCountry = countries?.find(({ id }) => id === countryId)

  const { isLoading, data: { underDistribution, outsideDistribution } = {} } = useSites(
    {
      filters: {
        countryId,
      },
      sortCol: 'name',
      sortDir: 'asc',
      pageAt: 0,
      pageSize: 1000,
    },
    {
      select: ({ siteList = [] }) => {
        return buildTheHierarchicalDataStructure(siteList)
      },
    }
  )

  useEffect(() => {
    // This useEffect is used to update parent state to get the results of sites on the table view on a sibling component
    if (outsideDistributionSelected) {
      setSelectedSiteIds(
        outsideDistributionSelectedSiteIds.size
          ? [...outsideDistributionSelectedSiteIds]
          : [...outsideDistribution.map(site => site.id)]
      )
    } else if (underDistributionSelectedSiteIds.size) {
      const underDistributionSelectedSiteIdsArray = [...underDistributionSelectedSiteIds]
      const selectedSiteIds = []
      let underDistributionSites = underDistribution
      underDistributionSelectedSiteIdsArray.forEach((siteId, index) => {
        if (index === underDistributionSelectedSiteIdsArray.length - 1) {
          selectedSiteIds.push(siteId)
        }
        underDistributionSites = underDistributionSites.find(site => site.id === siteId)?.child || []
      })
      setSelectedSiteIds([...selectedSiteIds, ...getAllIdsFromChildren(underDistributionSites)])
    }

    return () => setSelectedSiteIds([])
  }, [
    underDistribution,
    outsideDistribution,
    underDistributionSelectedSiteIds,
    outsideDistributionSelected,
    outsideDistributionSelectedSiteIds,
    setSelectedSiteIds,
  ])

  const renderTreeNodes = (nodes, parentIds, level) => {
    return nodes.map(node => {
      const currentIds = [...parentIds, node.id]
      return (
        <TreeNode
          key={currentIds.join('-')}
          data={{ id: node.id, name: node.name }}
          callback={() => dispatch(selectUnselectLinkedWarehouseAction(currentIds))}
          selected={underDistributionSelectedSiteIds.has(node.id)}
          expanded={expanded}
          options={{
            showChevron: Boolean(node.child?.length),
            noLeftPadding: parentIds.length === 0 && Boolean(node.child?.length),
          }}
        >
          {(underDistributionSelectedSiteIds.has(node.id) || expanded) && node.child && level > 0
            ? renderTreeNodes(node.child, currentIds, level - 1)
            : null}
        </TreeNode>
      )
    })
  }

  return (
    <Card sx={{ minWidth: 300, p: 2, maxHeight: 640, overflowY: 'auto', boxShadow: 0 }}>
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
            {renderTreeNodes(underDistribution, [], TREE_HIERARCHICAL_VIEW_LEVELS)}
            <TreeNode
              data={{
                id: `sites-outside-distribution-channel`,
                name: `Sites out of distribution channel (${outsideDistribution.length})`,
              }}
              callback={() => dispatch(selectUnselectUnlinkedSitesAction())}
              selected={outsideDistributionSelected}
              expanded={expanded}
              options={{ showChevron: Boolean(outsideDistribution.length), noLeftPadding: true }}
            >
              {outsideDistributionSelected || expanded
                ? outsideDistribution.map(site => (
                    <TreeNode
                      key={site.id}
                      data={{ id: site.id, name: site.name }}
                      options={{ showChevron: false, noLeftPadding: false }}
                      callback={() => dispatch(selectUnselectUnlinkedSitesAction(site.id))}
                      selected={outsideDistributionSelectedSiteIds.has(site.id)}
                      expanded={expanded}
                    />
                  ))
                : null}
            </TreeNode>
          </>
        )}
      </Stack>
    </Card>
  )
}
