import React from 'react'
import { Stack } from '@mui/material'
import { HierarchyLoader } from './HierarchyLoader'
import { LgaTreeNode } from './LgaTreeNode'
import { TreeNode } from './TreeNode'

export function StateTreeNode(props) {
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
