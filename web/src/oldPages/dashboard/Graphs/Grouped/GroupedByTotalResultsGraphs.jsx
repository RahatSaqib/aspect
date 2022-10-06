import React, { useState } from 'react'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import covidGraphs from '../../../../components/Graphs/GraphConfigurations/Covid'
import hivGraphs from '../../../../components/Graphs/GraphConfigurations/HIV'
import tbGraphs from '../../../../components/Graphs/GraphConfigurations/TB'
import xdrGraphs from '../../../../components/Graphs/GraphConfigurations/XDR'
import GraphsContainer from '../../../../components/Graphs/GraphsContainer'

const { hivResults } = hivGraphs
const { tbDetected, tbResults } = tbGraphs
const { xdrResults } = xdrGraphs
const { covidResults } = covidGraphs

const GroupedByTotalResultsGraphs = ({ assays }) => {
  const [graphs, setGraphs] = useState([
    { totalResults: -5, graph: hivResults, name: 'graph_hivResults' },
    { totalResults: -4, graph: tbDetected, name: 'graph_tbDetected' },
    { totalResults: -3, graph: tbResults, name: 'graph_tbResults' },
    { totalResults: -2, graph: xdrResults, name: 'graph_xdrResults' },
    { totalResults: -1, graph: covidResults, name: 'graph_covidResults' },
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
                const allButCurrent = old.filter(e => e.name !== name)
                allButCurrent.push(newElem)
                allButCurrent.sort((a, b) => b.totalResults - a.totalResults)
                return allButCurrent
              })
            }
          },
        }}
      />
    </ErrorBoundary>
  ))
}

export default GroupedByTotalResultsGraphs
