import flatten from 'lodash/flatten'

export function getItemsForTrendsGraph(data, states) {
  const subset = states.length ? data.filter(it => states.map(({ name }) => name).includes(it.locationName)) : data
  const yearSet = new Set(flatten(subset?.map(it => it.trends.map(d => d.year))))
  const years = [...yearSet]
  years.sort()
  const actualItems = subset?.map(it => {
    const trends = years.map(year => {
      const y = it.trends.find(x => x.year === year)?.cntAll || 0
      return { x: year, y }
    })
    return {
      province: it.locationName,
      perYear: it.currYearTotals.cntAll,
      monthlyAverage: Math.round(it.prevYearMeanPerMonth.cntAll),
      perDay: it.last24h.cntAll,
      trends,
    }
  })
  return actualItems || []
}
