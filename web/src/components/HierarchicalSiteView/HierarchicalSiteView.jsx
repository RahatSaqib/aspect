import React from 'react'
import { Card, Skeleton, Stack, Typography } from '@mui/material'
import { FaChevronDown, FaChevronRight } from 'react-icons/fa'
import useCountries from '../../hooks/geography/useCountries'
import useLgaByState from '../../hooks/geography/useLgaByState'
import useStatesByCountry from '../../hooks/geography/useStatesByCountry'
import useSites from '../../hooks/site/useSites'
import useFilterUpdate from '../../hooks/useFilterUpdate'

function HierarchyLoader() {
  return (
    <Stack>
      {Array(3)
        .fill()
        .map((_, key) => (
          <Skeleton height={40} key={key} />
        ))}
    </Stack>
  )
}

function TreeNode(props) {
  const { data, callback, children, selectedId, options = {} } = props
  const { id, name } = data
  const { showChevron, noLeftPadding } = options

  return (
    <Stack sx={{ justifyContent: 'center', pl: noLeftPadding ? 0 : 2 }} spacing={2}>
      <Stack
        sx={{ flexDirection: 'row', cursor: 'pointer', alignItems: 'center' }}
        onClick={() => callback(id)}
        gap={1}
      >
        {showChevron && (selectedId === id ? <FaChevronDown fontSize={12} /> : <FaChevronRight fontSize={12} />)}
        <Typography variant="body2">{name}</Typography>
      </Stack>
      {children}
    </Stack>
  )
}

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

  const { isLoading: isNationalSitesLoading, data: { siteList: nationalSitesData } = { siteList: [] } } = useSites(
    {
      filters: { countryId, lgaId: '', stateId: 11 },
      sortCol: 'name',
      sortDir: 'asc',
      pageAt: 0,
      pageSize: 100,
    },
    { enabled: Boolean(countryId) && !lgaId && !stateId }
  )

  console.log('What is national level sites data ', nationalSitesData)

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
        {isStateLoading ? (
          <HierarchyLoader />
        ) : (
          states.map(state => (
            <Stack key={state.id} sx={{ flexDirection: 'column' }}>
              <TreeNode
                data={{ id: state.id, name: state.name }}
                callback={() =>
                  updateHierarchy({
                    stateId: stateId === state.id ? undefined : state.id,
                    lgaId: undefined,
                    siteName: undefined,
                  })
                }
                selectedId={stateId}
                options={{ showChevron: true, noLeftPadding: true }}
              >
                {stateId === state.id ? (
                  isLgaLoading ? (
                    <HierarchyLoader />
                  ) : (
                    lgasData?.map(county => (
                      <TreeNode
                        data={{ id: county.id, name: county.name }}
                        selectedId={lgaId}
                        callback={() =>
                          updateHierarchy({
                            lgaId: lgaId === county.id ? undefined : county.id,
                            siteName: undefined,
                          })
                        }
                        options={{ showChevron: true }}
                      >
                        {county.id === lgaId ? (
                          isSiteLoading ? (
                            <HierarchyLoader />
                          ) : (
                            sitesData?.map(site => (
                              <TreeNode
                                key={site.id}
                                data={{ id: site.id, name: site.name }}
                                selected={siteName}
                                callback={() =>
                                  updateHierarchy({
                                    siteName: siteName === site.name ? undefined : site.name,
                                  })
                                }
                              />
                            ))
                          )
                        ) : null}
                      </TreeNode>
                    ))
                  )
                ) : null}
              </TreeNode>
            </Stack>
          ))
        )}
      </Stack>
    </Card>
  )
}
