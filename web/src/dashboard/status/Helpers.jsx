import reduce from 'lodash/reduce'
import { isGraphPermitted } from '../../Providers/PermissionsProvider'
import {
  isAllowedGroupsWithoutAssays,
  getWhitelistedAssays,
} from '../../shared/utils/graph'
import hivGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/HIV'
import covidGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Covid'
import tbGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/TB'
import xdrGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/XDR'
import tbTrendGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Trends'

const { trendInYears, trendInQuarters } = tbTrendGraphs

export const GRAPHS_SORTED_BY_TOTAL_RESULTS = 'GRAPHS_SORTED_BY_TOTAL_RESULTS'
export const GRAPHS_TREND_IN_YEARS = 'GRAPHS_TREND_IN_YEARS'
export const GRAPHS_TREND_IN_QUARTERS = 'GRAPHS_TREND_IN_QUARTERS'
/**
 * TODO: Add table in db to define such country-specific graphs in seed,
 * same as we do with Report/JobFunctionReport.
 * Another words, jobFunction definition in fixture will have 3 base array props -
 * `permissions`, `reports` and new array `graphs`.
 */
// export const COUNTRIES_SHOW_GRAPH_TREND_IN_YEARS = ['US', 'PK']
// export const COUNTRIES_SHOW_GRAPH_TREND_IN_QUARTERS = ['US', 'PK']

const { hivResults } = hivGraphs
const { tbDetected, tbResults } = tbGraphs
const { xdrResults } = xdrGraphs
const { covidResults } = covidGraphs
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
export const addGraphIfPermitted = (acc, graph, { auth, assaysFromState }) => {
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
export const getGroupedGraphsInitialValue = (auth, assaysFromState) => {
  // common graphs
  const groupedGraphsInitialValue = {
    [GRAPHS_SORTED_BY_TOTAL_RESULTS]: reduce(
      baseGroupFor.sortedByTotalResults,
      (acc, gr) => addGraphIfPermitted(acc, gr, { auth, assaysFromState }),
      {}
    ),
  }

  // country-specific graphs
  groupedGraphsInitialValue[GRAPHS_TREND_IN_YEARS] = reduce(
    baseGroupFor.trendInYears,
    (acc, gr) => addGraphIfPermitted(acc, gr, { auth, assaysFromState }),
    {}
  )
  groupedGraphsInitialValue[GRAPHS_TREND_IN_QUARTERS] = reduce(
    baseGroupFor.trendInQuarters,
    (acc, gr) => addGraphIfPermitted(acc, gr, { auth, assaysFromState }),
    {}
  )

  return groupedGraphsInitialValue
}
// -------------------------------------------------------------------------
export const getPermittedGroupItems = (allGraphsInGroup, groupInfo) => {
  const groupItems = allGraphsInGroup.filter(
    // use only graphs added to `groupedGraphs` as permitted and whitelisted (allowed assay)
    gr => !!groupInfo[gr.id]
  )
  return groupItems
}
