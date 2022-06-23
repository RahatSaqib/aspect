import React, { memo } from 'react'

import PermissionsProvider from '../../Providers/PermissionsProvider'
import ErrorBoundary from '../../MigratedComponents/ErrorBoundary'
import GraphsContainer from '../../MigratedComponents/Graphs/GraphsContainer'

const GroupedGraphs = ({
  assays,
  classNames,
  graphs,
  groupName,
  onGraphSettled,
  isOwnerReady,
}) => {
  return graphs && assays?.length
    ? graphs.map(graph => (
        <ErrorBoundary key={graph.id}>
          <PermissionsProvider permissions={graph.graphRenderPermissions}>
            <GraphsContainer
              assaysFromState={assays}
              classNames={classNames}
              config={{
                ...graph,
                onSettled: (data, error) => {
                  onGraphSettled(groupName, graph.id, { data, error })
                },
                isOwnerReady,
              }}
            />
          </PermissionsProvider>
        </ErrorBoundary>
      ))
    : null
}

export default memo(GroupedGraphs)
