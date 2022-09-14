import React, { useCallback, useState, useMemo } from 'react'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import tbTrendGraphs from '../../../../components/Graphs/GraphConfigurations/Trends'
import GraphsContainer from '../../../../components/Graphs/GraphsContainer'
import { useAuthState } from '../../../../providers/AuthProvider'
import PermissionsProvider from '../../../../providers/PermissionsProvider'
import { GRAPHS_TREND_IN_YEARS, getGroupedGraphsInitialValue, getPermittedGroupItems } from './Helpers'

const { trendInYears } = tbTrendGraphs

const { trendInYearsAllTests, trendInYearsMtbDetected, trendInYearsRifDetected } = trendInYears

const trendInYearsArray = [trendInYearsAllTests, trendInYearsMtbDetected, trendInYearsRifDetected]

const GroupedByTrendsInYearsGraphs = ({ assays }) => {
  const auth = useAuthState()
  const [groupedGraphsInfo, setGroupedGraphsInfo] = useState(getGroupedGraphsInitialValue(auth, assays))

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

  const groupTrendInYears = useMemo(() => {
    const groupName = GRAPHS_TREND_IN_YEARS
    const groupInfo = groupedGraphsInfo[groupName]
    const groupItems = getPermittedGroupItems(trendInYearsArray, groupInfo)

    return {
      id: groupName,
      isGroup: true,
      isReady: true,
      graphs: groupItems,
    }
  }, [groupedGraphsInfo])

  return groupTrendInYears.graphs.map(graph => (
    <ErrorBoundary key={graph.id}>
      <PermissionsProvider permissions={graph.graphRenderPermissions}>
        <GraphsContainer
          assaysFromState={assays}
          classNames={groupTrendInYears.classNames}
          config={{
            ...graph,
            onSettled: (data, error) => {
              onGraphSettled(groupTrendInYears.id, graph.id, { data, error })
            },
            isOwnerReady: groupTrendInYears.isReady,
          }}
        />
      </PermissionsProvider>
    </ErrorBoundary>
  ))
}

export default GroupedByTrendsInYearsGraphs
