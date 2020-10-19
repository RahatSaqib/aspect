import map from 'lodash/map'
import subMinutes from 'date-fns/subMinutes'
import formatDistance from 'date-fns/formatDistance'
import filter from 'lodash/filter'
import get from 'lodash/get'
import times from 'lodash/times'
import random from 'lodash/random'
import chunk from 'lodash/chunk'
import range from 'lodash/range'
import min from 'lodash/min'
import max from 'lodash/max'

function mockDatafetch(cnt = 10) {
  const data = []
  times(cnt, index => {
    const triggerRandom = random(0, 120000)
    const contactRandom = random(0, 100)

    data.push({
      id: index,
      name: `Notification trigger ${index}`,
      totalTriggers: triggerRandom,
      alertCount: triggerRandom,
      contactsCount: contactRandom,
      contacts: contactRandom,
      lastTriggeredOn: formatDistance(
        subMinutes(new Date(), random(0, 35000)),
        new Date(),
        {
          addSuffix: true,
        }
      ),
    })
  })
  return { data }
}

function buildColumnsFromData({ columns }) {
  const output = []
  const { key, intitalSortBy } = filter(columns, 'intitalSortBy')[0] || false
  if (columns) {
    map(columns, ({ key, label, ...rest }) =>
      output.push({ Header: label, accessor: key, ...rest })
    )
  }
  return {
    columns: output,
    initialSortBy: intitalSortBy ? { id: key, ...intitalSortBy } : false,
  }
}

function getFirstAndLastVisibleRowNumbers(dataLength, pageIndex, pageSize) {
  const dataRange = range(1, Number(dataLength) + 1)
  const pageChunks = chunk(dataRange, Number(pageSize))
  const pageChunk = pageChunks[pageIndex]
  if (pageChunk) {
    const boundaries = [min(pageChunk), max(pageChunk)]
    return boundaries
  }
  return false
}

export { buildColumnsFromData, getFirstAndLastVisibleRowNumbers, mockDatafetch }
