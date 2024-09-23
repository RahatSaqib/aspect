import React from 'react'
import { Card, Skeleton, Stack, Typography } from '@mui/material'
import useCountries from '../../hooks/geography/useCountries'
import useLgaByState from '../../hooks/geography/useLgaByState'
import useStatesByCountry from '../../hooks/geography/useStatesByCountry'
import useSites from '../../hooks/site/useSites'
import useFilterUpdate from '../../hooks/useFilterUpdate'
import { HierarchyLoader } from './HierarchyLoader'
import { StateTreeNode } from './StateTreeNode'

export function HierarchicalSiteView(props) {
  const { filters, pathname, countryId } = props

  const { stateId, lgaId, siteName } = filters

  const [update] = useFilterUpdate()

  const { isLoading: isCountryLoading, isError: isCountryError, data: countries } = useCountries()
  const selectedCountry = countries?.find(({ id }) => id === countryId)
  const { isLoading: isStateLoading, data: states = [] } = useStatesByCountry(
    { countryId, returnAll: true },
    { enabled: !isCountryLoading && !isCountryError && Boolean(countryId) && Boolean(selectedCountry) }
  )
  const { isLoading: isLgaLoading, data: lgasData } = useLgaByState({ stateId }, { enabled: Boolean(stateId) })

  const { isLoading: isSiteLoading, data: { siteList: sitesData } = { siteList: [] } } = useSites(
    { filters: { lgaId }, sortCol: 'name', sortDir: 'asc', pageAt: 0, pageSize: 100 },
    { enabled: Boolean(lgaId) }
  )

  const { isLoading: isNationalLevelSitesLoading, data: { siteList: nationalLevelSitesData } = { siteList: [] } } =
    useSites(
      {
        filters: { countryId, stateId: '' },
        sortCol: 'name',
        sortDir: 'asc',
        pageAt: 0,
        pageSize: 100,
      },
      { enabled: Boolean(countryId) && !lgaId && !stateId }
    )

  const { isLoading: isStateLevelSitesLoading, data: { siteList: stateLevelSitesData } = { siteList: [] } } = useSites(
    {
      filters: { countryId, stateId, lgaId: '' },
      sortCol: 'name',
      sortDir: 'asc',
      pageAt: 0,
      pageSize: 100,
    },
    { enabled: Boolean(countryId) && !lgaId && Boolean(stateId) }
  )

  const updateHierarchy = filter => {
    update({ countryId, ...filters, ...filter }, pathname)
  }

  return (
    <Card sx={{ minWidth: 300, p: 2, maxHeight: 640, overflowY: 'auto' }}>
      {isCountryLoading ? (
        <Skeleton height={40} />
      ) : (
        <Typography variant="h6" sx={{ mb: 2 }}>
          {selectedCountry.name}
        </Typography>
      )}
      <Stack spacing={2}>
        {isStateLoading || isNationalLevelSitesLoading ? (
          <HierarchyLoader />
        ) : (
          <StateTreeNode
            nationalLevelSitesData={nationalLevelSitesData}
            states={states}
            siteName={siteName}
            stateId={stateId}
            isLgaLoading={isLgaLoading}
            isStateLevelSitesLoading={isStateLevelSitesLoading}
            stateLevelSitesData={stateLevelSitesData}
            callback={updateHierarchy}
            lgasData={lgasData}
            sitesData={sitesData}
            isSiteLoading={isSiteLoading}
            lgaId={lgaId}
          />
        )}
      </Stack>
    </Card>
  )
}
