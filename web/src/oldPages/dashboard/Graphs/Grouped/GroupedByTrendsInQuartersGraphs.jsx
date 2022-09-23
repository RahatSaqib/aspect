import React, { useState } from 'react'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import tbTrendGraphs from '../../../../components/Graphs/GraphConfigurations/Trends'
import GraphsContainer from '../../../../components/Graphs/GraphsContainer'
import PermissionsProvider from '../../../../providers/PermissionsProvider'

const { trendInQuarters } = tbTrendGraphs
const { trendInQuartersMtbDetected, trendInQuartersRifDetected } = trendInQuarters

const Status = ({ assays }) => {
  const [graphs, setGraphs] = useState([
    { totalResults: -2, graph: trendInQuartersMtbDetected, name: 'graph_trendInQuartersMtbDetected' },
    { totalResults: -1, graph: trendInQuartersRifDetected, name: 'graph_trendInQuartersRifDetected' },
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

export default Status
