import React, { useCallback, useState, useMemo } from 'react'
import classnames from 'classnames/bind'
import every from 'lodash/every'
import isEmpty from 'lodash/isEmpty'
import keys from 'lodash/keys'
import reduce from 'lodash/reduce'
import reverse from 'lodash/reverse'
import sortBy from 'lodash/sortBy'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import covidGraphs from '../../../../components/Graphs/GraphConfigurations/Covid'
import hivGraphs from '../../../../components/Graphs/GraphConfigurations/HIV'
import tbGraphs from '../../../../components/Graphs/GraphConfigurations/TB'
import xdrGraphs from '../../../../components/Graphs/GraphConfigurations/XDR'
import GraphsContainer from '../../../../components/Graphs/GraphsContainer'
import { useAuthState } from '../../../../providers/AuthProvider'
import PermissionsProvider from '../../../../providers/PermissionsProvider'
import styles from './GraphStyles.css'
import { GRAPHS_SORTED_BY_TOTAL_RESULTS, getGroupedGraphsInitialValue, getPermittedGroupItems } from './Helpers'

const cssClasses = classnames.bind(styles)

const { hivResults } = hivGraphs
const { tbDetected, tbResults } = tbGraphs
const { xdrResults } = xdrGraphs
const { covidResults } = covidGraphs

const sortedByTotalResults = [hivResults, tbDetected, tbResults, xdrResults, covidResults]

const GroupedByTotalResultsGraphs = ({ assays }) => {
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

  const groupSortedByTotalResults = useMemo(() => {
    const groupName = GRAPHS_SORTED_BY_TOTAL_RESULTS
    const groupInfo = groupedGraphsInfo[groupName]
    let isReady = false
    let groupItems = getPermittedGroupItems(sortedByTotalResults, groupInfo)

    /**
     * if all members of the group loaded data - sort them by `totalResults desc`
     */
    if (!isEmpty(groupInfo) && every(groupInfo, ['settled', true])) {
      // get array of `{ graphId, totalResults }` items
      const graphTotals = reduce(
        keys(groupInfo),
        (acc, graphId) => {
          const { totalResults } = groupInfo[graphId]
          acc = [
            ...acc,
            {
              graphId,
              totalResults,
            },
          ]
          return acc
        },
        []
      )
      const sorted = reverse(sortBy(graphTotals, ['totalResults', 'graphId']))
      groupItems = sorted.map(({ graphId, totalResults }) => {
        return {
          ...groupItems.find(({ id }) => id === graphId),
          totalResults,
        }
      })
      // group is ready - all graphs to be displayed
      isReady = true
    }

    /**
     * classNames object to paint/shadow card title when group is not
     * ready yet (not all graphs loaded data) to correctly sort inner graphs
     * by totalResults
     */
    const classNames = {}
    if (!isReady) {
      classNames.cardTitleText = cssClasses('CardTitle--paint-when-group-is-not-ready')
    }

    return {
      id: groupName,
      isGroup: true,
      isReady,
      graphs: groupItems,
      classNames,
    }
  }, [groupedGraphsInfo])

  return groupSortedByTotalResults.graphs.map(graph => (
    <ErrorBoundary key={graph.id}>
      <PermissionsProvider permissions={graph.graphRenderPermissions}>
        <GraphsContainer
          assaysFromState={assays}
          classNames={groupSortedByTotalResults.classNames}
          config={{
            ...graph,
            onSettled: (data, error) => {
              onGraphSettled(groupSortedByTotalResults.id, graph.id, { data, error })
            },
            isOwnerReady: groupSortedByTotalResults.isReady,
          }}
        />
      </PermissionsProvider>
    </ErrorBoundary>
  ))
}

export default GroupedByTotalResultsGraphs
