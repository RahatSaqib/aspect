import React, { useMemo, useState } from 'react'
import { Card, Skeleton, Stack, Typography } from '@mui/material'
import { FaChevronDown, FaChevronRight } from 'react-icons/fa'
import useCountries from '../../../hooks/geography/useCountries'
import useLgaByState from '../../../hooks/geography/useLgaByState'
import useStatesByCountry from '../../../hooks/geography/useStatesByCountry'
import useSites from '../../../hooks/site/useSites'

function HierarchyLoader() {
  return Array(10)
    .fill()
    .map(() => <Skeleton height={40} />)
}

function Hierarchy(props) {
  const { data, isLoading, selectedId, callback, uniqueKey, children } = props

  if (isLoading) {
    return <HierarchyLoader />
  }

  if (!data?.length) return null

  return (
    <Stack sx={{ flexDirection: 'column', pl: 2 }} spacing={1}>
      {data?.map(({ id, name }) => (
        <TreeNode data={{ id, name }} callback={callback} key={`${uniqueKey}-${id}`}>
          {children}
        </TreeNode>
      ))}
    </Stack>
  )
}

function TreeNode(props) {
  const { data, callback, children, selectedId } = props
  const { id, name } = data

  return (
    <Stack sx={{ justifyContent: 'center' }}>
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

  const { isLoading: isSiteLoading, data: siteData } = useSites(
    { filters: { lgaId: selected.countyId }, sortCol: 'name', sortDir: 'asc', pageAt: 0, pageSize: 100 },
    { enabled: Boolean(selected.countyId) }
  )

  const treeViewData = useMemo(() => {
    states.forEach(state => {})
    return states
  }, [states, lgasData, selected])

  return (
    <Card sx={{ minWidth: 300, p: 2, maxHeight: 600, overflowY: 'auto' }}>
      {isCountryLoading ? <Skeleton height={40} /> : <Typography variant="h6">{selectedCountry.name}</Typography>}
      <Stack spacing={1}>
        {isStateLoading ? (
          <Stack>
            {Array(10)
              .fill()
              .map(() => (
                <Skeleton height={40} />
              ))}
          </Stack>
        ) : (
          treeViewData.map(state => (
            <Stack key={state.id} sx={{ flexDirection: 'column' }}>
              <TreeNode
                data={{ id: state.id, name: state.name }}
                callback={() => setSelected({ ...selected, stateId: state.id })}
                selectedId={selected.stateId}
              >
                {selected.stateId === state.id ? (
                  <Hierarchy
                    uniqueKey={state.id}
                    data={lgasData}
                    isLoading={isLgaLoading}
                    selectedId={selected.countyId}
                    callback={countyId => setSelected({ ...selected, countyId })}
                  />
                ) : null}
              </TreeNode>
            </Stack>
          ))
        )}
      </Stack>
    </Card>
  )
}
