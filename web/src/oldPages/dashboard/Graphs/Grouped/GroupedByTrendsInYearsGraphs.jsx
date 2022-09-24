import React, { useState } from 'react'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import tbTrendGraphs from '../../../../components/Graphs/GraphConfigurations/Trends'
import GraphsContainer from '../../../../components/Graphs/GraphsContainer'
import PermissionsProvider from '../../../../providers/PermissionsProvider'

const { trendInYears } = tbTrendGraphs
const { trendInYearsAllTests, trendInYearsMtbDetected, trendInYearsRifDetected } = trendInYears

const GroupedByTrendsInYearsGraphs = ({ assays }) => {
  const [graphs, setGraphs] = useState([
    { totalResults: -3, graph: trendInYearsAllTests, name: 'graph_trendInYearsAllTests' },
    { totalResults: -2, graph: trendInYearsMtbDetected, name: 'graph_trendInYearsMtbDetected' },
    { totalResults: -1, graph: trendInYearsRifDetected, name: 'graph_trendInYearsRifDetected' },
  ])

  return graphs.map(({ graph, name }, index) => (
    <ErrorBoundary key={graph.id}>
      <PermissionsProvider permissions={graph.graphRenderPermissions}>
        <GraphsContainer
          assaysFromState={assays}
          config={{
            ...graph,
            onSettled: data => {
              if (graphs[index].totalResults < 0) {
                setGraphs(old => {
                  const newElem = { totalResults: data.totalResults, name, graph }
                  const replaced = old.map(e => (e.name !== name ? e : newElem))
                  return replaced
                })
              }
            },
          }}
        />
      </PermissionsProvider>
    </ErrorBoundary>
  ))
}

export default GroupedByTrendsInYearsGraphs
