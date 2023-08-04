import flatten from 'lodash/flatten'

export function getItemsForTrendsGraph(data, states) {
  let actualData = data
  if (states?.length) {
    /**
     * when state(s) selected in the filter - then make sure `actualData` contains
     * data for ALL selected states - if raw `data` from API doesn't have entries for
     * some state - use default value
     */
    actualData = states.map(({ name }) => {
      const d = data.find(it => it.locationName === name)
      if (d) {
        return d
      }
      return {
        locationName: name,
        currYearTotals: { cntAll: 0 },
        currYearMeanPerMonth: { cntAll: 0 },
        prevYearMeanPerMonth: { cntAll: 0 },
        last24h: { cntAll: 0 },
        trends: [{ year: new Date().getFullYear() }],
      }
    })
  }
  const yearSet = new Set(flatten(actualData?.map(it => it.trends.map(d => d.year))))
  const years = [...yearSet]
  years.sort()
  return (
    actualData?.map(it => {
      const trends = years.map(year => {
        const y = it.trends.find(x => x.year === year)?.cntAll || 0
        return { x: year, y }
      })
      return {
        province: it.locationName,
        perYear: it.currYearTotals.cntAll,
        monthlyAverage: Math.round(it.currYearMeanPerMonth.cntAll),
        perDay: it.last24h.cntAll,
        trends,
      }
    }) || []
  )
}
