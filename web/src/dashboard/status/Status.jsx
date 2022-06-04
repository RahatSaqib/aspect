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
import useI18n from '../../Hooks/i18n/useI18n'

import styles from './Status.css'

const cssClasses = classnames.bind(styles)

const GRAPHS_SORTED_BY_TOTAL_RESULTS = 'GRAPHS_SORTED_BY_TOTAL_RESULTS'
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
const resultScopedGraphs = [
  hivResults,
  tbDetected,
  tbResults,
  xdrResults,
  covidResults,
]
const getGroupedGraphsInitialValue = (auth, assaysFromState) => {
  const groupedGraphsInitialValue = {
    [GRAPHS_SORTED_BY_TOTAL_RESULTS]: reduce(
      resultScopedGraphs,
      (acc, graph) => {
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
      },
      {}
    ),
  }
  return groupedGraphsInitialValue
}

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
  const userComposed = useSelector(({ user }) => user)
  const auth = useMemo(() => userComposed.toJS(), [userComposed])

  const { formatMessage } = useI18n()
  const [graphs, setGraphs] = useState(false)
  const [groupedGraphs, setGroupedGraphs] = useState(
    getGroupedGraphsInitialValue(auth, assays)
  )
  const [marginBottom] = useState(0)
  const dispatch = useDispatch()
  const {
    countryAbbreviation: countryIsoAlpha2CodeIgnored,
    jwt: { name: userName },
    culture,
  } = useAuthState()

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
    () => setGroupedGraphs(getGroupedGraphsInitialValue(auth, assays)),
    [auth, assays]
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
   * 3. `groupedGraphs` - update after loading data for graph in group
   */
  const onGraphSettled = useCallback(
    (graphId, { data, error }) => {
      if (groupedGraphs[GRAPHS_SORTED_BY_TOTAL_RESULTS][graphId]?.settled) {
        return
      }
      let totalResults = 0
      if (!error) {
        ;({ totalResults = 0 } = data || {})
      }
      setGroupedGraphs(prev => ({
        ...prev,
        [GRAPHS_SORTED_BY_TOTAL_RESULTS]: {
          ...prev[GRAPHS_SORTED_BY_TOTAL_RESULTS],
          [graphId]: {
            settled: true,
            totalResults,
          },
        },
      }))
    },
    [groupedGraphs]
  )

  /**
   * observable group with sorted (by totalResults) graphs
   * to be included in `graphs` state
   */
  const groupSortedByTotalResults = useMemo(() => {
    const totalsInGroup = groupedGraphs[GRAPHS_SORTED_BY_TOTAL_RESULTS]
    let isReady = false
    let groupItems = resultScopedGraphs.filter(
      /**
       * use only those graphs from `resultScopedGraphs` which are added
       * to `groupedGraphs` as permitted and whitelisted (allowed assay)
       */
      gr => !!groupedGraphs[GRAPHS_SORTED_BY_TOTAL_RESULTS][gr.id]
    )

    if (!isEmpty(totalsInGroup) && every(totalsInGroup, ['settled', true])) {
      /**
       * sort group items by `totalResults desc`
       */
      // get array of `{ graphId, totalResults }` items
      const graphTotals = reduce(
        keys(totalsInGroup),
        (acc, graphId) => {
          const { totalResults } = totalsInGroup[graphId]
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
      /**
       * group is ready - all graphs to be displayed
       */
      isReady = true
    }

    return {
      id: GRAPHS_SORTED_BY_TOTAL_RESULTS,
      isGroup: true,
      isReady,
      items: groupItems,
    }
  }, [groupedGraphs])

  /**
   * memoized classNames object to paint/shadow card title when group is not
   * ready yet (not all it's graphs loaded data) to correctly sort inner graphs
   * by totalResults
   */
  const classNamesForGroupedGraphsByTotalResults = useMemo(() => {
    const css = {}
    if (!groupSortedByTotalResults.isReady) {
      css.cardTitleText = cssClasses('CardTitle--paint-when-group-is-not-ready')
    }
    return css
  }, [groupSortedByTotalResults])

  /**
   * `graphs` - define array of graphs to display
   */
  useEffect(() => {
    if (culture) {
      setGraphs([
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
      ])
    }
  }, [culture, groupSortedByTotalResults])

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
              return (
                <GroupedGraphs
                  key={graph.id}
                  assays={assays}
                  graphs={graph.items}
                  onGraphSettled={onGraphSettled}
                  isOwnerReady={graph.isReady}
                  classNames={classNamesForGroupedGraphsByTotalResults}
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
