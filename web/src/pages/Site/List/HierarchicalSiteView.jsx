import React, { useState } from 'react'
import { Card, Skeleton, Stack, Typography } from '@mui/material'
import { FaChevronDown, FaChevronRight } from 'react-icons/fa'
import useCountries from '../../../hooks/geography/useCountries'
import useLgaByState from '../../../hooks/geography/useLgaByState'
import useStatesByCountry from '../../../hooks/geography/useStatesByCountry'
import useSites from '../../../hooks/site/useSites'

function HierarchyLoader() {
  return (
    <Stack>
      {Array(10)
        .fill()
        .map(() => (
          <Skeleton height={40} />
        ))}
    </Stack>
  )
}

function TreeNode(props) {
  const { data, callback, children, selectedId } = props
  const { id, name } = data

  return (
    <Stack sx={{ justifyContent: 'center', pl: 2 }} spacing={2}>
      <Stack
        sx={{ flexDirection: 'row', cursor: 'pointer', alignItems: 'center' }}
        onClick={() => callback(id)}
        gap={1}
      >
        {selectedId === id ? <FaChevronDown fontSize={12} /> : <FaChevronRight fontSize={12} />}
        <Typography variant="body2">{name}</Typography>
      </Stack>
      {children}
    </Stack>
  )
}

export function HierarchicalSiteView(props) {
  const { countryId, returnAll, onlyAssociatedSites } = props

  const { isLoading: isCountryLoading, isError: isCountryError, data: countries } = useCountries()
  const [selected, setSelected] = useState({ stateId: null, countyId: null })
  const selectedCountry = countries?.find(({ id }) => id === countryId)
  const { isLoading: isStateLoading, data: states = [] } = useStatesByCountry(
    { countryId, returnAll, onlyAssociatedSites },
    { enabled: !isCountryLoading && !isCountryError && !!countryId && Boolean(selectedCountry) }
  )
  const { isLoading: isLgaLoading, data: lgasData } = useLgaByState(
    { stateId: selected.stateId },
    { enabled: Boolean(selected.stateId) }
  )

  const { isLoading: isSiteLoading, data: { siteList: sitesData } = { siteList: [] } } = useSites(
    { filters: { lgaId: selected.countyId }, sortCol: 'name', sortDir: 'asc', pageAt: 0, pageSize: 100 },
    { enabled: Boolean(selected.countyId) }
  )

  return (
    <Card sx={{ minWidth: 300, p: 2, maxHeight: 600, overflowY: 'auto' }}>
      {isCountryLoading ? <Skeleton height={40} /> : <Typography variant="h6">{selectedCountry.name}</Typography>}
      <Stack spacing={2}>
        {isStateLoading ? (
          <HierarchyLoader />
        ) : (
          states.map(state => (
            <Stack key={state.id} sx={{ flexDirection: 'column' }}>
              <TreeNode
                data={{ id: state.id, name: state.name }}
                callback={() => setSelected({ ...selected, stateId: state.id })}
                selectedId={selected.stateId}
              >
                {selected.stateId === state.id
                  ? lgasData?.map(county => (
                      <TreeNode
                        data={{ id: county.id, name: county.name }}
                        selectedId={selected.countyId}
                        callback={() => setSelected({ ...selected, countyId: county.id })}
                      >
                        {county.id === selected.countyId
                          ? sitesData?.map(site => (
                              <TreeNode
                                key={site.id}
                                data={{ id: site.id, name: site.name }}
                                selected={selected.siteId}
                                callback={() => setSelected({ ...selected, siteId: site.id })}
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
