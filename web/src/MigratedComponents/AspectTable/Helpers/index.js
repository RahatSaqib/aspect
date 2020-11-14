import map from 'lodash/map'
import subMinutes from 'date-fns/subMinutes'
import addMinutes from 'date-fns/addMinutes'
import formatDistance from 'date-fns/formatDistance'
import isPast from 'date-fns/isPast'
import getUnixTime from 'date-fns/getUnixTime'
import fromUnixTime from 'date-fns/fromUnixTime'
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

const mockedDataContacts = [
  'Giada Cutler',
  'Sayuri Landa',
  'Fay Morello',
  'Phinehas Casares',
  'Kolbe Weigel',
  'Mattilyn Dills',
  'Adel Peirce',
  'Nylan Buster',
  'Isreal Tribble',
  'Aleida Mcdougall',
  'Addisen Woodrum',
  'Lamont Koontz',
  'Lleyton Arms',
  'Rylinn Das',
  'Railyn Hatten',
  'Jailynn Dupuis',
  'Jacori Hiner',
  'Brynleigh Clinton',
  'Emin Daum',
  'Newton Alderete',
  'Omere Koo',
  'Kameron Deleon',
  'Janya Hunley',
  'Lillee Slayton',
  'Darla Sebastian',
  'Jamie Carmona',
  'Ayat Rahn',
]

function mockDatafetch(cnt = 10) {
  const data = []
  times(cnt, index => {
    const contacts = []
    const mutatedDate =
      random(0, 1) === 0
        ? subMinutes(new Date(), random(0, 35000))
        : addMinutes(new Date(), random(0, 35000))
    const triggerRandom = random(0, 120000)
    times(random(0, 9), i => contacts.push(mockedDataContacts[i]))
    data.push({
      id: index,
      name: `Notification trigger ${mockedDataNames[random(0, 11)]}`,
      totalTriggers: triggerRandom,
      alertCount: triggerRandom,
      contactsCount: contacts.length,
      contacts,
      lastTriggeredOn: getUnixTime(mutatedDate),
    })
  })
  return { data }
}

function buildColumnsFromData({
  columns,
  columnOrder,
  contextualMenu = false,
}) {
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
    contextualMenu,
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

function timeClassification(vals) {
  const future = []
  const past = []
  vals.map(val =>
    isPast(fromUnixTime(val)) ? past.push(val) : future.push(val)
  )
  return [past.length, future.length]
}

function totalItemCount(vals) {
  return vals.reduce((acc, curr) => acc + curr.length, 0)
}

function timeSinceFromUnix(val) {
  return {
    isPast: isPast(fromUnixTime(val)),
    timeSince: formatDistance(fromUnixTime(val), new Date(), {
      addSuffix: true,
    }),
  }
}

export {
  buildColumnsFromData,
  getCurrentColumnIndexAndShift,
  getFirstAndLastVisibleRowNumbers,
  mockDatafetch,
  timeClassification,
  timeSinceFromUnix,
  totalItemCount,
}
