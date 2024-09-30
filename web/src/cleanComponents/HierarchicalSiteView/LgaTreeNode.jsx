import React from 'react'
import { Stack } from '@mui/material'
import { HierarchyLoader } from './HierarchyLoader'
import { TreeNode } from './TreeNode'

export function LgaTreeNode(props) {
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
          key={lga.id}
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
