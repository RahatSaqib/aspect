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
import { timeClassification, totalItemCount, translate } from '../../../components/AspectTable/Helpers'
import ContactsCell from '../../../components/AspectTable/TableCell/ContactsCell'
import { DateTimeCellFlagged } from '../../../components/AspectTable/TableCell/DateTimeCell'
import tableMessages from '../../../components/AspectTable/TableCell/messages'
import NumberCell from '../../../components/AspectTable/TableCell/NumberCell'
import messages from './messages'
import NotificationsContextualMenu from './NotificationsContextualMenu'

const tableConfig = ({ formatMessage, formatNumber }) => ({
  name: formatMessage(messages.notificationsTableName),
  namePlural: formatMessage(messages.notificationsTableNamePlural),
  columns: [
    {
      key: 'lastTriggeredOn',
      label: formatMessage(messages.notificationsTableHeaderLastTriggered),
      width: 10,
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
      width: 30,
      disableHide: true,
      disableGroupBy: true,
      aggregate: 'count',
      Aggregated: ({ value }) =>
        `${formatMessage(messages.notificationsTableHeaderNameCount, {
          itemCount: formatNumber(value),
        })}`,
    },
    {
      key: 'typeCategory',
      filterKey: 'typeCategory',
      label: formatMessage(messages.notificationsTableHeaderCategory),
      width: 15,
      disableHide: true,
      disableGroupBy: true,
      translate: translate(messages, formatMessage),
    },
    {
      key: 'totalTriggers',
      label: formatMessage(messages.notificationsTableHeaderTotalTriggers),
      width: 5,
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
      key: 'jobFunctions',
      label: formatMessage(messages.notificationsTableHeaderJobFunctions),
      disableHide: true,
      disableGroupBy: true,
      width: 25,
      aggregate: totalItemCount,
      Aggregated: ({ value }) =>
        `${formatMessage(messages.notificationsTableJobFunctionsCount, {
          itemCount: formatNumber(value),
        })}`,
      format: ContactsCell,
    },
    {
      key: 'persons',
      label: formatMessage(messages.notificationsTableHeaderJobFunctionsPersons),
      disableHide: true,
      disableGroupBy: true,
      width: 25,
      aggregate: totalItemCount,
      Aggregated: ({ value }) =>
        `${formatMessage(messages.notificationsTableJobFunctionsCountPersons, {
          itemCount: formatNumber(value),
        })}`,
      format: ContactsCell,
    },
    {
      key: 'sendToPatient',
      label: formatMessage(messages.sendToPatient),
      disableHide: true,
      disableGroupBy: true,
      width: 5,
      format: ({ value }) => {
        if (value === true || value === 'true') return formatMessage(messages.yes)
        return formatMessage(messages.no)
      },
    },
    {
      key: 'enabled',
      label: formatMessage(messages.status),
      disableHide: true,
      disableGroupBy: true,
      width: 5,
      format: ({ value }) => {
        return <input type="checkbox" checked={value} disabled />
      },
    },
  ],
  columnOrder: {
    allow: false,
    initialOrder: ['name', 'typeCategory', 'lastTriggeredOn', 'totalTriggers', 'contacts'],
  },
  contextualMenu: NotificationsContextualMenu,
})

export default tableConfig
