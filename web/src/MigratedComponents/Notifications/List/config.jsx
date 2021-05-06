/* eslint-disable jsx-a11y/no-static-element-interactions */
/**
 * name: 'string' [self defined, required]
 * columns: 'array' [self-defined, required]
 *  key: 'string' [self defined, required]
 *  filterKey: 'string' [self defined, optional for filtering]
 *  label: 'string' [self defined, required]
 *  width: 'number' [self defined, optional]
 *  disableHide: 'boolean' [react-table, optional default false]
 *  disableGroupBy: 'boolean' [react-table, optional default false]
 *  disableSortBy: 'boolean' [react-table, optional default false]
 *  aggregate: 'function' [self defined|react-table, optional for calcs]
 *  Aggregated: 'function' [self defined, optional for calcs]
 *  format: 'function|react component' [self defined, optional for calcs]
 * columnOrder: 'object' [self defined, optional]
 *  allow: 'bool' [self defined, optional default true]
 *  initialOrder: 'array' [self defined, optional]
 * contextualMenu: 'function|component' [self defined, optional]
 */
import React from 'react'
import { components } from 'react-select'
import union from 'lodash/union'

import messages from './messages'
import tableMessages from '../../AspectTable/TableCell/messages'
import { timeClassification, totalItemCount } from '../../AspectTable/Helpers'
import ContactsCell from '../../AspectTable/TableCell/ContactsCell'
import { DateTimeCellFlagged } from '../../AspectTable/TableCell/DateTimeCell'
import NumberCell from '../../AspectTable/TableCell/NumberCell'
import NotificationsContextualMenu from './NotificationsContextualMenu'
import IconProvider from '../../IconProvider'

const resultNotifications = [
  { id: 'result-based', name: 'Result Based', icon: 'AiOutlineSolution' },
  { id: 'test-updated', name: 'Test Updated', icon: 'AiOutlineShake' },
]

const deviceNotifications = [
  { id: 'offline', name: 'Offline', icon: 'AiOutlineApi', isDisabled: true },
  { id: 'report', name: 'Report', icon: 'AiOutlineBarChart' },
  { id: 'low-inventory', name: 'Low Inventory', icon: 'AiOutlineDashboard' },
  { id: 'calibration', name: 'Calibration', icon: 'AiOutlineTool' }, // AiOutlineSetting' },
  { id: 'module', name: 'Module', icon: 'AiOutlineBlock' },
  { id: 'critical-error', name: 'Critical Error', icon: 'AiOutlineInfoCircle' },
  { id: 'online-date', name: 'Online Date', icon: 'AiOutlineCalendar' },
]

const groupedOptions = [
  {
    label: 'Notification for Results',
    options: resultNotifications,
  },
  {
    label: 'Notification for Devices',
    options: deviceNotifications,
  },
]

const options = groupedOptions

export const getNotificationMeta = notificationType => {
  const allOptions = union(...options.map(({ options }) => options))
  const { name, icon } =
    allOptions.find(({ id }) => id === notificationType) || {}
  return { name, value: notificationType, icon }
}

const Group = props => <components.Group {...props} />

const CustomOption = props => {
  const {
    data: { icon, name },
    ...rest
  } = props
  return (
    <components.Option {...rest}>
      {icon ? <IconProvider icon={icon} /> : null}
      {name}
    </components.Option>
  )
}

const groupStyles = {
  color: '#444',
  fontWeight: 'bold',
  fontSize: '15px',
  textTransform: 'none',
}
const GroupHeading = props => (
  <components.GroupHeading {...props} style={groupStyles} />
)

export const notificationMenuProps = {
  components: {
    Group,
    GroupHeading,
    Option: CustomOption,
  },
  options,
}

export const baseConfig = ({ formatMessage, formatNumber }) => ({
  name: 'notification',
  columns: [
    {
      key: 'lastTriggeredOn',
      label: formatMessage(messages.notificationsTableHeaderLastTriggered),
      width: 20,
      disableHide: true,
      disableGroupBy: true,
      aggregate: timeClassification,
      Aggregated: ({ value }) =>
        formatMessage(tableMessages.timeClassification, {
          elapsed: value[0],
          upcoming: value[1],
        }),
      format: DateTimeCellFlagged,
    },
    {
      key: 'name',
      filterKey: 'notificationName',
      label: formatMessage(messages.notificationsTableHeaderName),
      width: 35,
      disableHide: true,
      disableGroupBy: true,
      aggregate: 'count',
      Aggregated: ({ value }) =>
        `${formatMessage(messages.notificationsTableHeaderNameCount, {
          itemCount: formatNumber(value),
        })}`,
    },
    {
      key: 'totalTriggers',
      label: formatMessage(messages.notificationsTableHeaderTotalTriggers),
      width: 20,
      disableHide: true,
      disableGroupBy: true,
      aggregate: 'sum',
      Aggregated: ({ value }) =>
        `${formatMessage(messages.notificationsTableTotalTriggersCount, {
          itemCount: formatNumber(value),
        })}`,
      format: NumberCell,
    },
    {
      key: 'contacts',
      label: formatMessage(messages.notificationsTableHeaderContacts),
      disableHide: true,
      disableGroupBy: true,
      width: 25,
      aggregate: totalItemCount,
      Aggregated: ({ value }) =>
        `${formatMessage(messages.notificationsTableContactsCount, {
          itemCount: formatNumber(value),
        })}`,
      format: ContactsCell,
    },
  ],
  columnOrder: {
    allow: false,
    initialOrder: ['name', 'lastTriggeredOn', 'totalTriggers', 'contacts'],
  },
  contextualMenu: NotificationsContextualMenu,
})

export default baseConfig
