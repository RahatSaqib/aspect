import flatten from 'lodash/flatten'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import round from 'lodash/round'

export function getItemsForTrendsGraph(data, states, lgas) {
  let actualData = data
  if (states?.length) {
    /**
     * when state(s) selected in the filter - then make sure `actualData` contains
     * data for ALL selected states - if raw `data` from API doesn't have entries for
     * some state - use default value
     */
    actualData = (lgas.length ? lgas : states).map(({ name }) => {
      const d = data.find(it => it.locationName === name)
      if (d) {
        return d
      }
      return {
        locationName: name,
        currYearTotals: { cntAll: '-' },
        currYearMeanPerMonth: { cntAll: '-' },
        prevYearMeanPerMonth: { cntAll: '-' },
        last24h: { cntAll: '-' },
        trends: [{ year: new Date().getFullYear() }],
        noDataAvailable: true,
      }
    })
  }
  const yearSet = new Set(flatten(actualData?.map(it => it.trends.map(d => d.year))))
  const years = [...yearSet]
  years.sort()

  const tableData =
    actualData?.map(it => {
      const trends = years.map(year => {
        const y = it.trends.find(x => x.year === year)?.cntAll || 0
        return { x: year, y }
      })
      return {
        province: it.locationName,
        perYear: it.currYearTotals.cntAll,
        monthlyAverage: it.noDataAvailable ? '-' : round(it.currYearMeanPerMonth.cntAll, 2),
        perDay: it.last24h.cntAll,
        trends,
        noDataAvailable: it.noDataAvailable,
      }
    }) || []
  let graphData = tableData?.map(({ province, trends, noDataAvailable }) => ({
    id: province,
    data: trends,
    noDataAvailable,
  }))
  if (graphData.length === graphData.filter(it => it.noDataAvailable).length) {
    graphData = []
  }

  return { graphData, tableData }
}

export function objectToArray(object) {
  return Object.entries(omitBy(object, isNil)).map(([name, value]) => ({ [name]: value }))
}
