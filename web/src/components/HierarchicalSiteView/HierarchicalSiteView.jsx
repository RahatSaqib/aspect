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

function StateTreeNode(props) {
  const {
    nationalLevelSitesData,
    states,
    siteName,
    stateId,
    isLgaLoading,
    isStateLevelSitesLoading,
    stateLevelSitesData,
    callback,
    lgasData,
    sitesData,
    isSiteLoading,
    lgaId,
  } = props
  return (
    <>
      {nationalLevelSitesData.map(warehouse => (
        <Stack key={warehouse.id} sx={{ flexDirection: 'column' }}>
          <TreeNode
            data={{ id: warehouse.id, name: warehouse.name }}
            callback={() =>
              callback({
                stateId: undefined,
                lgaId: undefined,
                siteName: siteName === warehouse.name ? undefined : warehouse.name,
              })
            }
            selected={siteName === warehouse.name}
            options={{ showChevron: false, noLeftPadding: false }}
          />
        </Stack>
      ))}
      {states.map(state => (
        <Stack key={state.id} sx={{ flexDirection: 'column' }}>
          <TreeNode
            data={{ id: state.id, name: state.name }}
            callback={() =>
              callback({
                stateId: stateId === state.id ? undefined : state.id,
                lgaId: undefined,
                siteName: undefined,
              })
            }
            selected={stateId === state.id}
            options={{ showChevron: true, noLeftPadding: true }}
          >
            {stateId === state.id ? (
              isLgaLoading || isStateLevelSitesLoading ? (
                <HierarchyLoader />
              ) : (
                <LgaTreeNode
                  stateLevelSitesData={stateLevelSitesData}
                  callback={callback}
                  lgasData={lgasData}
                  sitesData={sitesData}
                  siteName={siteName}
                  isSiteLoading={isSiteLoading}
                  state={state}
                  lgaId={lgaId}
                />
              )
            ) : null}
          </TreeNode>
        </Stack>
      ))}
    </>
  )
}

function LgaTreeNode(props) {
  const { stateLevelSitesData, lgasData, sitesData, siteName, isSiteLoading, state, lgaId, callback } = props
  return (
    <>
      {stateLevelSitesData.map(warehouse => (
        <Stack key={warehouse.id} sx={{ flexDirection: 'column' }}>
          <TreeNode
            data={{ id: warehouse.id, name: warehouse.name }}
            callback={() =>
              callback({
                stateId: state.id,
                lgaId: undefined,
                siteName: siteName === warehouse.name ? undefined : warehouse.name,
              })
            }
            selected={siteName === warehouse.name}
            options={{ showChevron: false, noLeftPadding: false }}
          />
        </Stack>
      ))}
      {lgasData?.map(lga => (
        <TreeNode
          data={{ id: lga.id, name: lga.name }}
          selected={lgaId === lga.id}
          callback={() =>
            callback({
              lgaId: lgaId === lga.id ? undefined : lga.id,
              siteName: undefined,
            })
          }
          options={{ showChevron: true }}
        >
          {lga.id === lgaId ? (
            isSiteLoading ? (
              <HierarchyLoader />
            ) : (
              sitesData?.map(site => (
                <TreeNode
                  key={site.id}
                  data={{ id: site.id, name: site.name }}
                  selected={siteName === site.name}
                  callback={() =>
                    callback({
                      siteName: siteName === site.name ? undefined : site.name,
                    })
                  }
                />
              ))
            )
          ) : null}
        </TreeNode>
      ))}
    </>
  )
}

function TreeNode(props) {
  const { data, callback, children, selected, options = {} } = props
  const { id, name } = data
  const { showChevron, noLeftPadding } = options

  return (
    <Stack sx={{ justifyContent: 'center', pl: noLeftPadding ? 0 : 2 }} spacing={2}>
      <Stack
        sx={{ flexDirection: 'row', cursor: 'pointer', alignItems: 'center' }}
        onClick={() => callback(id)}
        gap={1}
      >
        {showChevron && (selected ? <FaChevronDown fontSize={12} /> : <FaChevronRight fontSize={12} />)}
        <Typography variant="body2" sx={{ fontWeight: selected ? 'bold' : 'unset' }}>
          {name}
        </Typography>
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
