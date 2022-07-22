import subMinutes from 'date-fns/subMinutes'
import addMinutes from 'date-fns/addMinutes'
import format from 'date-fns/format'
import formatDistance from 'date-fns/formatDistance'
import isPast from 'date-fns/isPast'
import parseISO from 'date-fns/parseISO'
import identity from 'lodash/identity'
import isNaN from 'lodash/isNaN'
import filter from 'lodash/filter'
import find from 'lodash/find'
import times from 'lodash/times'
import random from 'lodash/random'
import chunk from 'lodash/chunk'
import range from 'lodash/range'
import min from 'lodash/min'
import max from 'lodash/max'
import pickBy from 'lodash/pickBy'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import isNil from 'lodash/isNil'
import map from 'lodash/map'
import get from 'lodash/get'
import { dateFNSLocales } from '../../../Providers/I18nProvider'

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
      random(0, 1) === 0 ? subMinutes(new Date(), random(0, 35000)) : addMinutes(new Date(), random(0, 35000))
    const triggerRandom = random(0, 120000)
    times(random(0, 9), i => contacts.push(mockedDataContacts[i]))
    data.push({
      id: index.toString(),
      name: `Notification trigger ${mockedDataNames[random(0, 11)]}`,
      totalTriggers: triggerRandom,
      alertCount: triggerRandom,
      contactsCount: contacts.length,
      contacts: contacts.join(','),
      lastTriggeredOn: mutatedDate.toISOString(),
    })
  })
  return { data }
}

function buildColumnsFromData({ columns, columnOrder, contextualMenu = false }) {
  const output = []
  /**
   * When `initialSortBy` is defined for any column in table config then
   * AspectTable will run in 2-direction mode - 
   * only `asc` and `desc` but not `undefined`.
   * Pattern of `initialSortBy` is `{ desc: BOOLEAN }`, i.e.
      columns: [
        ...
        {
          ...
          initialSortBy: { desc: false },
        }
      ]
    */
  const { key, initialSortBy } = filter(columns, 'initialSortBy')[0] || false
  if (columns) {
    map(columns, ({ key, label, ...rest }) => output.push({ Header: label, accessor: key, ...rest }))
  }
  return {
    columns: output,
    initialSortBy: initialSortBy ? { id: key, ...initialSortBy } : false,
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
  vals.map(val => (isPast(parseISO(val)) ? past.push(val) : future.push(val)))
  return [past.length, future.length]
}

function totalItemCount(vals) {
  return vals.reduce((acc, curr) => acc + curr.length, 0)
}

function timeSinceFromUTC(val, locale) {
  const date = parseISO(val)
  const dateFNSLocale = dateFNSLocales[locale]
  return {
    isPast: isPast(date),
    timeSince: formatDistance(date, new Date(), {
      addSuffix: true,
      locale: dateFNSLocale,
    }),
  }
}

function timeAndDate(val, dateFormat) {
  const date = parseISO(val)
  return format(new Date(date), dateFormat)
}

async function shapeTableParamsForApi({ pageIndex, pageSize, sortBy, initialOrder }) {
  const page = pageIndex
  const size = pageSize
  const sortCol = sortBy.length ? sortBy[0].id : initialOrder[0]
  const sortDir = sortBy.length ? (sortBy[0].desc ? 'desc' : 'asc') : 'asc'
  return pickBy({ page, size, sortCol, sortDir }, identity)
}

function removeNullFromCollection(collection) {
  return omitBy(collection, isNil)
}

function determineSortDirection(direction) {
  return (direction && direction === 'desc') || false
}

function getParamsFromUrl(query, search) {
  const output = {}
  const queryKeys = new URLSearchParams(search)
  for (const key of queryKeys.keys()) {
    const queryParam = query.get(key)
    const parsedParam = parseInt(queryParam, 10)
    output[key] = isNaN(parsedParam) ? queryParam : parsedParam
  }

  return output
}

function useUrlQuery(search) {
  return new URLSearchParams(search)
}

function allowOnlyAPIKeys(params) {
  const omitKeys = ['filters']
  return omit(params, omitKeys)
}

function getColumnIdFromFilterKey(config, filters) {
  const output = []
  const { columns } = config
  const filterStrings = Object.fromEntries(new URLSearchParams(filters))

  map(filterStrings, (value, key) => {
    const configColumn = find(columns, { filterKey: key })
    if (configColumn) {
      const { key: id } = configColumn
      return output.push({ id, value })
    }
  })

  return output
}

function getReturnUrl(returnUrlRaw, defaultUrl) {
  if (!returnUrlRaw) {
    return defaultUrl
  }
  let path = returnUrlRaw
  let returnUrl = ''
  const index = returnUrlRaw.indexOf('?')
  if (index !== -1) {
    path = returnUrlRaw.substring(0, index)
    returnUrl = returnUrlRaw.substring(index + 1)
  }
  const query = new URLSearchParams(returnUrl)
  return `${path}?${query.toString()}`
}

const translate = (mesages, formatMessage) => value => {
  const message = get(mesages, value, value)
  return message === value ? value : formatMessage(message)
}

export {
  allowOnlyAPIKeys,
  buildColumnsFromData,
  determineSortDirection,
  getColumnIdFromFilterKey,
  getCurrentColumnIndexAndShift,
  getFirstAndLastVisibleRowNumbers,
  getParamsFromUrl,
  mockDatafetch,
  removeNullFromCollection,
  shapeTableParamsForApi,
  timeAndDate,
  timeClassification,
  timeSinceFromUTC,
  totalItemCount,
  useUrlQuery,
  getReturnUrl,
  translate,
}
