import map from 'lodash/map'
import subMinutes from 'date-fns/subMinutes'
import formatDistance from 'date-fns/formatDistance'
import filter from 'lodash/filter'
import times from 'lodash/times'
import random from 'lodash/random'
import chunk from 'lodash/chunk'
import range from 'lodash/range'
import min from 'lodash/min'
import max from 'lodash/max'

const mockedDataNames = [
  'Amherst',
  'Atlanta',
  'Beaverton',
  'Boston',
  'Carter',
  'Clearwater',
  'Deerfield',
  'Exeter',
  'Lowell',
  'Selma',
  'Warren',
  'Winston',
]

function mockDatafetch(cnt = 10) {
  const data = []
  times(cnt, index => {
    const triggerRandom = random(0, 120000)
    const contactRandom = random(0, 100)

    data.push({
      id: index,
      name: `Notification trigger ${mockedDataNames[random(0, 11)]}`,
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

function buildColumnsFromData({ columns, columnOrder }) {
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
    columnOrder,
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

function getCurrentColumnIndexAndShift(visibleColumns, direction, index) {
  const columnsToShuffle = [...visibleColumns]
  const columns = columnsToShuffle.map(({ id }) => id)
  const from = index
  const to = direction === 'left' ? index - 1 : index + 1
  columns.splice(to, 0, columns.splice(from, 1)[0])
  return columns
}

export {
  buildColumnsFromData,
  getCurrentColumnIndexAndShift,
  getFirstAndLastVisibleRowNumbers,
  mockDatafetch,
}
