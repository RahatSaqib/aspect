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

const groupedOptions = ({ formatMessage }) => [
  {
    label: formatMessage(messages.notificationCreateGroupForResults),
    options: [
      {
        id: 'resultBased', // externalId from table NotificationTypeCategory
        name: formatMessage(messages.notificationTypeResultBased),
        icon: 'AiOutlineSolution',
      },
      {
        id: 'test-updated',
        name: formatMessage(messages.notificationTypeTestUpdated),
        icon: 'AiOutlineShake',
        isDisabled: true,
      },
    ],
  },
  {
    label: formatMessage(messages.notificationCreateGroupForDevices),
    options: [
      {
        id: 'offline',
        name: formatMessage(messages.notificationTypeOffline),
        icon: 'AiOutlineApi',
        isDisabled: true,
      },
      {
        id: 'report',
        name: formatMessage(messages.notificationTypeReport),
        icon: 'AiOutlineBarChart',
        isDisabled: true,
      },
      {
        id: 'low-inventory',
        name: formatMessage(messages.notificationTypeLowInventory),
        icon: 'AiOutlineDashboard',
        isDisabled: true,
      },
      {
        id: 'calibration',
        name: formatMessage(messages.notificationTypeCalibration),
        icon: 'AiOutlineTool',
        isDisabled: true,
      },
      {
        id: 'module',
        name: formatMessage(messages.notificationTypeModule),
        icon: 'AiOutlineBlock',
        isDisabled: true,
      },
      {
        id: 'critical-error',
        name: formatMessage(messages.notificationTypeCriticalError),
        icon: 'AiOutlineInfoCircle',
        isDisabled: true,
      },
      {
        id: 'online-date',
        name: formatMessage(messages.notificationTypeOnlineDate),
        icon: 'AiOutlineCalendar',
        isDisabled: true,
      },
    ],
  },
]

export const getNotificationMeta = (notificationType, intl) => {
  const options = groupedOptions(intl)
  const allOptions = union(...options.map(({ options }) => options))
  const { name, icon } =
    allOptions.find(({ id }) => id === notificationType) || {}
  return { name, value: notificationType, icon }
}

const Group = props => <components.Group {...props} />
const CustomOption = props => {
  const {
    data: { icon, name, isDisabled },
    ...rest
  } = props
  return (
    <components.Option {...rest}>
      <span style={{ opacity: isDisabled ? 0.4 : 1 }}>
        {icon ? <IconProvider icon={icon} /> : null}
      </span>
      <span style={{ opacity: isDisabled ? 0.4 : 1 }}>{name}</span>
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

export const getCreateNotificationMenuProps = intl => ({
  components: {
    Group,
    GroupHeading,
    Option: CustomOption,
  },
  options: groupedOptions(intl),
})

export const baseConfig = ({ formatMessage, formatNumber }) => ({
  name: formatMessage(messages.notificationsTableName),
  namePlural: formatMessage(messages.notificationsTableNamePlural),
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
