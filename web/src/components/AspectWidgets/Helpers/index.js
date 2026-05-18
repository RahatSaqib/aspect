import filter from 'lodash/filter'
import get from 'lodash/get'
import map from 'lodash/map'
import omit from 'lodash/omit'
import remove from 'lodash/remove'
import { getAllDaysInCurrentMonth, getTimePeriod } from '../../../components/shared/DateTimeInput/utils/date'
import DATE_CONSTS from '../../../utils/consts/DateTime/CONSTS'

/**
 * Order of widget groups - values must correspond to
 * WIDGET_GROUP_KEYS in 'api/seeds/fixtures/dashboardWidgetsBase.js'
 * which in their turn correspond keys in 'web/src/dashboard/status/messages.js'
 */

const availableGroupI18nKeys = [
  'summaryWidgetGroupConnectivity',
  'summaryWidgetGroupInventory',
  'summaryWidgetGroupDevices',
  'summaryWidgetGroupService',
]

const groupWidgets = (data, dashboard) => {
  const widgetGroups = []
  const nonGroupedWidgets = [...data]
  availableGroupI18nKeys.map(group => {
    const items = filter(data, item => {
      const { dashboards } = item
      const match = get(JSON.parse(dashboards), `${dashboard}.groupI18nKey`)
      return match === group ? item : false
    })
    if (items && items.length) {
      widgetGroups.push({ groupI18nKey: group, items })
      const removeItems = map(items, 'id')
      remove(nonGroupedWidgets, widget => removeItems.includes(widget.id))
    }
    return widgetGroups
  })
  return { widgetGroups, nonGroupedWidgets }
}

const buildWidgetParams = (link, linkParams) => {
  const params = {}
  const inParams = JSON.parse(linkParams)

  if (!inParams || Object.keys(inParams).length === 0 || inParams instanceof Object === false) {
    return params
  }

  for (const [key, value] of Object.entries(omit(inParams, ['permissions']))) {
    if (key === 'dateRange') {
      for (const [key, value] of Object.entries(buildDateRange(value))) {
        params[key] = value
      }
    } else {
      params[key] = value
    }
  }

  return params
}

const buildDateRange = term => {
  let dateRange
  const {
    DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
  } = DATE_CONSTS
  switch (true) {
    case term === 'last30Days':
      dateRange = {
        [MIN_DATE]: getTimePeriod(30, 'days', 'yyyy-MM-dd'),
        [MAX_DATE]: getTimePeriod(0, 'days', 'yyyy-MM-dd'),
      }
      break

    case term === 'currentMonth':
      dateRange = {
        [MIN_DATE]: getAllDaysInCurrentMonth().start,
        [MAX_DATE]: getAllDaysInCurrentMonth(true).end,
      }
      break

    default:
      dateRange = {}
      break
  }
  return dateRange
}

const translate = (i18nKey, defaultValue, { formatMessage, messages }) => {
  try {
    return messages[i18nKey] ? formatMessage(messages[i18nKey]) : defaultValue
  } catch (e) {
    return defaultValue
  }
}

export { buildWidgetParams, groupWidgets, translate }
