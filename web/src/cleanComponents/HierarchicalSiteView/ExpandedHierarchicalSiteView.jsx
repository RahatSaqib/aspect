import React from 'react'
import { Card, Skeleton, Stack, Typography } from '@mui/material'
import isMatch from 'lodash/isMatch'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import useCountries from '../../hooks/geography/useCountries'
import useStatesByCountry from '../../hooks/geography/useStatesByCountry'
import useSites from '../../hooks/site/useSites'
import useAuthState from '../../hooks/useAuthState'
import { usePathFilter } from '../../hooks/usePathFilter'
import { createGroupedData, getKey } from './helpers'
import { HierarchyLoader } from './HierarchyLoader'
import { TreeNode } from './TreeNode'

export function ExpandedHierarchicalSiteView(props) {
  const { countryId, filterMaps } = props
  const { isLoading: isCountryLoading, data: countries } = useCountries(true)
  const selectedCountry = countries?.find(({ id }) => id === countryId)

  const { isLoading: isStateLoading, data: states = [] } = useStatesByCountry(
    { countryId, all: true },
    { enabled: !!(selectedCountry && countryId) }
  )
  const { isLoading: isSitesLoading, data = [] } = useSites(
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
      enabled: !!states.length,
      select: ({ siteList = [] }) => createGroupedData(states, siteList, filterMaps),
    }
  )

  const isLoading = isStateLoading || isSitesLoading

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
            {data?.map(item => (
              <Row key={getKey(item)} item={item} options={{ noLeftPadding: true }} />
            ))}
          </>
        )}
      </Stack>
    </Card>
  )
}

const Row = ({ item, options }) => {
  const [filters, update] = usePathFilter()
  const { countryId } = useAuthState()
  return (
    <TreeNode
      expanded
      selected={isMatch(filters, omitBy(item.filter, isNil))}
      callback={() => {
        if (item.filter) {
          update(prev => ({ ...prev, ...item.filter, countryId }))
        }
      }}
      data={{ name: item.name, id: item.name }}
      options={{ showChevron: !!item.nodes?.length, ...options }}
    >
      {item.nodes?.map(node => (
        <Row key={getKey(node)} item={node} options={{ noLeftPadding: false }} />
      ))}
    </TreeNode>
  )
}
