import React, { useCallback, useEffect, useState, useMemo } from 'react'
import classnames from 'classnames/bind'
import { useSelector, useDispatch } from 'react-redux'
import { Helmet } from 'react-helmet'
import { useLocation } from 'react-router-dom'
import every from 'lodash/every'
import isEmpty from 'lodash/isEmpty'
import keys from 'lodash/keys'
import reduce from 'lodash/reduce'
import reverse from 'lodash/reverse'
import sortBy from 'lodash/sortBy'

import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import { fetchAssays } from '../../assay/AssayRedux'
import messages from './messages'
import SummaryStatus from './SummaryStatus'
import Reports from './Reports'
import GroupedGraphs from './GroupedGraphs'
import BrowseSiteDropdown from '../../globals/components/BrowseSiteDropdown'
import { useAuthState } from '../../Providers/AuthProvider'
import PermissionsProvider, {
  isGraphPermitted,
} from '../../Providers/PermissionsProvider'
import {
  isAllowedGroupsWithoutAssays,
  getWhitelistedAssays,
} from '../../shared/utils/graph'
import ErrorBoundary from '../../MigratedComponents/ErrorBoundary'
import GraphsContainer from '../../MigratedComponents/Graphs/GraphsContainer'
import hivGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/HIV'
import covidGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Covid'
import tbGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/TB'
import xdrGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/XDR'
import treatmentStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Treatments'
import inventoryStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Inventory'
import deviceStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/DeviceStatus'
import testsPerFormedGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/TestsPerformed'
import tbTrendGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Trends'
import useI18n from '../../Hooks/i18n/useI18n'

import styles from './Status.css'

const { trendInYears, trendInQuarters } = tbTrendGraphs

const cssClasses = classnames.bind(styles)

const GRAPHS_SORTED_BY_TOTAL_RESULTS = 'GRAPHS_SORTED_BY_TOTAL_RESULTS'
const GRAPHS_TREND_IN_YEARS = 'GRAPHS_TREND_IN_YEARS'
const GRAPHS_TREND_IN_QUARTERS = 'GRAPHS_TREND_IN_QUARTERS'
// const GRAPHS_TREND_IN_QUARTER = 'GRAPHS_TREND_IN_QUARTER'
/**
 * TODO: Add table in db to define such country-specific graphs in seed,
 * same as we do with Report/JobFunctionReport.
 * Another words, jobFunction definition in fixture will have 3 base array props -
 * `permissions`, `reports` and new array `graphs`.
 */
const COUNTRIES_SHOW_GRAPH_TREND_IN_YEARS = ['BD']
const COUNTRIES_SHOW_GRAPH_TREND_IN_QUARTERS = ['BD']

const { hivResults } = hivGraphs
const { tbDetected, tbResults } = tbGraphs
const { xdrResults } = xdrGraphs
const {
  covidResults,
  covidDailyConfirmed,
  covidCasesByAgeAndGender,
  covidMortalityAndRecoveryConfig,
  covidMortalityAndRecoveryByGender,
} = covidGraphs
const { treatmentStatus } = treatmentStatusGraphs
const { inventoryStatus } = inventoryStatusGraphs
const { deviceStatus } = deviceStatusGraphs()
const { testsOverTime } = testsPerFormedGraphs
const {
  trendInYearsAllTests,
  trendInYearsMtbDetected,
  trendInYearsRifDetected,
} = trendInYears
const { trendInQuartersMtbDetected, trendInQuartersRifDetected } =
  trendInQuarters
const baseGroupFor = {
  sortedByTotalResults: [
    hivResults,
    tbDetected,
    tbResults,
    xdrResults,
    covidResults,
  ],
  trendInYears: [
    trendInYearsAllTests,
    trendInYearsMtbDetected,
    trendInYearsRifDetected,
  ],
  trendInQuarters: [trendInQuartersMtbDetected, trendInQuartersRifDetected],
}
/**
 * helpers
 */
// -------------------------------------------------------------------------
const addGraphIfPermitted = (acc, graph, { auth, assaysFromState }) => {
  const { id, assays, group } = graph
  const isPermitted = isGraphPermitted({
    auth,
    permissions: graph.graphRenderPermissions,
  })
  const allowedGroupsWithoutAssays = isAllowedGroupsWithoutAssays(group)
  const allowed = getWhitelistedAssays({ assays, assaysFromState })
  const isWhitelisted = allowed.length > 0 || allowedGroupsWithoutAssays
  if (isPermitted && isWhitelisted) {
    acc[id] = { settled: false }
  }
  return acc
}
// -------------------------------------------------------------------------
const getGroupedGraphsInitialValue = (
  auth,
  assaysFromState,
  countryAbbreviation
) => {
  // common graphs
  const groupedGraphsInitialValue = {
    [GRAPHS_SORTED_BY_TOTAL_RESULTS]: reduce(
      baseGroupFor.sortedByTotalResults,
      (acc, gr) => addGraphIfPermitted(acc, gr, { auth, assaysFromState }),
      {}
    ),
  }

  // country-specific graphs
  if (COUNTRIES_SHOW_GRAPH_TREND_IN_YEARS.includes(countryAbbreviation)) {
    groupedGraphsInitialValue[GRAPHS_TREND_IN_YEARS] = reduce(
      baseGroupFor.trendInYears,
      (acc, gr) => addGraphIfPermitted(acc, gr, { auth, assaysFromState }),
      {}
    )
  }
  if (COUNTRIES_SHOW_GRAPH_TREND_IN_QUARTERS.includes(countryAbbreviation)) {
    groupedGraphsInitialValue[GRAPHS_TREND_IN_QUARTERS] = reduce(
      baseGroupFor.trendInQuarters,
      (acc, gr) => addGraphIfPermitted(acc, gr, { auth, assaysFromState }),
      {}
    )
  }
  return groupedGraphsInitialValue
}
// -------------------------------------------------------------------------
const getPermittedGroupItems = (allGraphsInGroup, groupInfo) => {
  const groupItems = allGraphsInGroup.filter(
    // use only graphs added to `groupedGraphs` as permitted and whitelisted (allowed assay)
    gr => !!groupInfo[gr.id]
  )
  return groupItems
}

// -------------------------------------------------------------------------
const Status = () => {
  const location = useLocation()
  /**
   * get composed data from store and memoize their js values
   */
  const assaysComposed = useSelector(({ assay }) => assay.items)
  const assays = useMemo(
    () => assaysComposed.toJS().filter(a => a.hasResults),
    [assaysComposed]
  )
  const auth = useAuthState()
  const {
    countryAbbreviation,
    jwt: { name: userName },
    culture,
  } = auth

  const { formatMessage } = useI18n()
  const [graphs, setGraphs] = useState(false)
  const [groupedGraphsInfo, setGroupedGraphsInfo] = useState(
    getGroupedGraphsInitialValue(auth, assays, countryAbbreviation)
  )
  const [marginBottom] = useState(0)
  const dispatch = useDispatch()

  /**
   * 1. `assays` - load assays
   */
  useEffect(() => {
    dispatch(fetchAssays(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * 2. `groupedGraphs` - define permitted/whitelisted graphs in group
   */
  useEffect(
    () =>
      setGroupedGraphsInfo(
        getGroupedGraphsInitialValue(auth, assays, countryAbbreviation)
      ),
    [auth, assays, countryAbbreviation]
  )

  useEffect(() => {
    const { search } = location
    const searchParams = new URLSearchParams(search)

    if (searchParams.has('fl')) {
      showAcknowledgement({
        title: messages.welcome,
        messageValues: { userName },
      })
    }
  }, [userName, location])

  /**
   * event handler when API response for particular graph in group received
   * 3. `groupedGraphsInfo` - update after loading data for graph in group
   */
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

  /**
   * observable group with sorted (by totalResults) graphs
   * to be included in `graphs` state
   */
  const groupSortedByTotalResults = useMemo(() => {
    const groupName = GRAPHS_SORTED_BY_TOTAL_RESULTS
    const groupInfo = groupedGraphsInfo[groupName]
    let isReady = false
    let groupItems = getPermittedGroupItems(
      baseGroupFor.sortedByTotalResults,
      groupInfo
    )

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
      classNames.cardTitleText = cssClasses(
        'CardTitle--paint-when-group-is-not-ready'
      )
    }

    return {
      id: groupName,
      isGroup: true,
      isReady,
      graphs: groupItems,
      classNames,
    }
  }, [groupedGraphsInfo])

  /**
   * observable group of graphs to be included in `graphs` state
   */
  const groupTrendInYears = useMemo(() => {
    if (!COUNTRIES_SHOW_GRAPH_TREND_IN_YEARS.includes(countryAbbreviation)) {
      return null
    }
    const groupName = GRAPHS_TREND_IN_YEARS
    const groupInfo = groupedGraphsInfo[groupName]
    const groupItems = getPermittedGroupItems(
      baseGroupFor.trendInYears,
      groupInfo
    )

    return {
      id: groupName,
      isGroup: true,
      isReady: true,
      graphs: groupItems,
    }
  }, [groupedGraphsInfo, countryAbbreviation])

  const groupTrendInQuarters = useMemo(() => {
    if (!COUNTRIES_SHOW_GRAPH_TREND_IN_QUARTERS.includes(countryAbbreviation)) {
      return null
    }
    const groupName = GRAPHS_TREND_IN_QUARTERS
    const groupInfo = groupedGraphsInfo[groupName]
    const groupItems = getPermittedGroupItems(
      baseGroupFor.trendInQuarters,
      groupInfo
    )

    return {
      id: groupName,
      isGroup: true,
      isReady: true,
      graphs: groupItems,
    }
  }, [groupedGraphsInfo, countryAbbreviation])

  /**
   * `graphs` - define array of graphs to display
   */
  useEffect(() => {
    if (culture) {
      const base = [
        testsOverTime,
        /**
         * group of up to 5 graphs (see raw array `resultScopedGraphs` in the top)
         * to order-by-totalResults and display after
         * all participating (permitted/whitelisted) graphs load data
         */
        groupSortedByTotalResults,

        treatmentStatus,
        deviceStatus,
        covidDailyConfirmed,
        covidMortalityAndRecoveryConfig,
        covidMortalityAndRecoveryByGender,
        covidCasesByAgeAndGender,
        inventoryStatus,
      ]
      let graphs = base
      if (COUNTRIES_SHOW_GRAPH_TREND_IN_YEARS.includes(countryAbbreviation)) {
        graphs = [...graphs, groupTrendInYears]
      }
      if (
        COUNTRIES_SHOW_GRAPH_TREND_IN_QUARTERS.includes(countryAbbreviation)
      ) {
        graphs = [...graphs, groupTrendInQuarters]
      }

      setGraphs(graphs)
    }
  }, [
    culture,
    groupSortedByTotalResults,
    groupTrendInYears,
    groupTrendInQuarters,
    countryAbbreviation,
  ])

  return (
    <div className={cssClasses('Container')} style={{ marginBottom }}>
      <Helmet title="Status" />
      <div className={cssClasses('FiltersGroup')}>
        <BrowseSiteDropdown location={location} />
      </div>
      <ErrorBoundary>
        <PermissionsProvider permissions={['dashboard']}>
          <SummaryStatus
            className={cssClasses('Section--summary')}
            dashboard="home"
          />
        </PermissionsProvider>
      </ErrorBoundary>

      {graphs && assays?.length
        ? graphs.map(graph => {
            if (graph.isGroup) {
              const group = graph // use appropriate name since this entry is a group of graphs
              return (
                <GroupedGraphs
                  key={group.id}
                  assays={assays}
                  graphs={group.graphs}
                  groupName={group.id}
                  onGraphSettled={onGraphSettled}
                  isOwnerReady={group.isReady}
                  classNames={group.classNames}
                />
              )
            }
            return (
              <ErrorBoundary key={graph.id}>
                <PermissionsProvider permissions={graph.graphRenderPermissions}>
                  <GraphsContainer assaysFromState={assays} config={graph} />
                </PermissionsProvider>
              </ErrorBoundary>
            )
          })
        : null}

      <Reports
        className={cssClasses('Section--withStatus')}
        title={formatMessage(messages.reportsTitle)}
      />
    </div>
  )
}

export default Status
