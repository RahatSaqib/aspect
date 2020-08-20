import filter from 'lodash/filter'
import get from 'lodash/get'
import includes from 'lodash/includes'
import remove from 'lodash/remove'
import map from 'lodash/map'

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
  const nonGroupedWidgets = data
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

const buildMessagesFromI18nKeys = item => {
  const messages = {}
  filter(item, (_, k) => {
    if (includes(k, 'I18nKey')) {
      return (messages[k] = {
        id: k,
        defaultMessage: get(item, `${k.replace('I18nKey', '')}`),
      })
    }
  })
  return messages
}

export { groupWidgets, buildMessagesFromI18nKeys }
