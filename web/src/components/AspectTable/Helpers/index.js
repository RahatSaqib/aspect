import format from 'date-fns/format'
import formatDistance from 'date-fns/formatDistance'
import isPast from 'date-fns/isPast'
import parseISO from 'date-fns/parseISO'
import chunk from 'lodash/chunk'
import filter from 'lodash/filter'
import find from 'lodash/find'
import get from 'lodash/get'
import isNil from 'lodash/isNil'
import map from 'lodash/map'
import max from 'lodash/max'
import min from 'lodash/min'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import range from 'lodash/range'
import { dateFNSLocales } from '../../../providers/I18nProvider'

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

function removeNullFromCollection(collection) {
  return omitBy(collection, isNil)
}

function determineSortDirection(direction) {
  return (direction && direction === 'desc') || false
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
  removeNullFromCollection,
  timeAndDate,
  timeSinceFromUTC,
  useUrlQuery,
  getReturnUrl,
  translate,
}
