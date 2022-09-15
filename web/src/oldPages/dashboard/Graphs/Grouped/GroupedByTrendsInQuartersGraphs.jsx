import React, { useCallback, useEffect, useState, useMemo } from 'react'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import tbTrendGraphs from '../../../../components/Graphs/GraphConfigurations/Trends'
import GraphsContainer from '../../../../components/Graphs/GraphsContainer'
import { useAuthState } from '../../../../providers/AuthProvider'
import PermissionsProvider from '../../../../providers/PermissionsProvider'
import { GRAPHS_TREND_IN_QUARTERS, getGroupedGraphsInitialValue, getPermittedGroupItems } from './Helpers'

const { trendInQuarters } = tbTrendGraphs

const { trendInQuartersMtbDetected, trendInQuartersRifDetected } = trendInQuarters
const baseGroupFor = {
  trendInQuarters: [trendInQuartersMtbDetected, trendInQuartersRifDetected],
}

const Status = ({ assays }) => {
  const auth = useAuthState()

  const [groupedGraphsInfo, setGroupedGraphsInfo] = useState(getGroupedGraphsInitialValue(auth, assays))

  useEffect(() => setGroupedGraphsInfo(getGroupedGraphsInitialValue(auth, assays)), [auth, assays])

  const onGraphSettled = useCallback(
    (groupName, graphId, { data, error }) => {
      const graphGroup = groupedGraphsInfo[groupName]
      if (graphGroup[graphId]?.settled) {
        return
      }
      let totalResults = 0
      if (!error) {
        ;({ totalResults = 0 } = data || {})
      }
      setGroupedGraphsInfo(prev => ({
        ...prev,
        [groupName]: {
          ...prev[groupName],
          [graphId]: {
            settled: true,
            totalResults,
          },
        },
      }))
    },
    [groupedGraphsInfo]
  )

  const groupTrendInQuarters = useMemo(() => {
    const groupName = GRAPHS_TREND_IN_QUARTERS
    const groupInfo = groupedGraphsInfo[groupName]
    const groupItems = getPermittedGroupItems(baseGroupFor.trendInQuarters, groupInfo)

    return {
      id: groupName,
      isGroup: true,
      isReady: true,
      graphs: groupItems,
    }
  }, [groupedGraphsInfo])

  return groupTrendInQuarters.graphs.map(graph => (
    <ErrorBoundary key={graph.id}>
      <PermissionsProvider permissions={graph.graphRenderPermissions}>
        <GraphsContainer
          assaysFromState={assays}
          config={{
            ...graph,
            onSettled: (data, error) => {
              onGraphSettled(groupTrendInQuarters.id, graph.id, { data, error })
            },
            isOwnerReady: groupTrendInQuarters.isReady,
          }}
        />
      </PermissionsProvider>
    </ErrorBoundary>
  ))
}

export default Status
