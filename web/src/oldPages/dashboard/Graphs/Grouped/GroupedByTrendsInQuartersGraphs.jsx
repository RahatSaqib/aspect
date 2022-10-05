import React, { useState } from 'react'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import tbTrendGraphs from '../../../../components/Graphs/GraphConfigurations/Trends'
import GraphsContainer from '../../../../components/Graphs/GraphsContainer'

const { trendInQuarters } = tbTrendGraphs
const { trendInQuartersMtbDetected, trendInQuartersRifDetected } = trendInQuarters

const Status = ({ assays }) => {
  const [graphs, setGraphs] = useState([
    { totalResults: -2, graph: trendInQuartersMtbDetected, name: 'graph_trendInQuartersMtbDetected' },
    { totalResults: -1, graph: trendInQuartersRifDetected, name: 'graph_trendInQuartersRifDetected' },
  ])

  return graphs.map(({ graph, name }, index) => (
    <ErrorBoundary key={graph.id}>
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
    </ErrorBoundary>
  ))
}

export default Status
