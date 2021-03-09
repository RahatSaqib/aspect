import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'

import { useIntl, defineMessages } from 'react-intl'
import SelectField from '../../components/shared/SelectField'
import stockLeftOptions from './stockLeftOptions'

export default ({ allItemText, onChange, value, ...restProps }) => {
  const handleSelectFieldChange = ({ target: { value } }) => {
    onChange(value === 'all' ? undefined : value)
  }
  const messages = defineMessages({
    outOfStock: {
      id: 'filter.btnGroup.stockLeft.outOfStock',
      defaultMessage: 'Out of Stock',
    },
    upTo14: {
      id: 'filter.btnGroup.stockLeft.upTo14',
      defaultMessage: '1-14 Days',
    },
    upTo30: {
      id: 'filter.btnGroup.stockLeft.upTo30',
      defaultMessage: '15-30 Daysssssssssssss',
    },
    upTo90: {
      id: 'filter.btnGroup.stockLeft.upTo90',
      defaultMessage: '1-3 Months',
    },
    upTo180: {
      id: 'filter.btnGroup.stockLeft.upTo180',
      defaultMessage: '4-6 Months',
    },
    moreThan180: {
      id: 'filter.btnGroup.stockLeft.moreThan180',
      defaultMessage: '>6 Months',
    },
    notRecorded: {
      id: 'filter.btnGroup.stockLeft.notRecorded',
      defaultMessage: 'Not Recorded',
    },
    noConsumption: {
      id: 'filter.btnGroup.stockLeft.noConsumption',
      defaultMessage: 'No Consumption',
    },
  })
  const { formatMessage } = useIntl()
  return (
    <SelectField
      {...restProps}
      value={value}
      onChange={handleSelectFieldChange}
    >
      {allItemText ? <MenuItem value="all">{allItemText}</MenuItem> : null}
      {stockLeftOptions.map(({ externalId, name }) => (
        <MenuItem key={externalId} value={externalId}>
          {messages[externalId] ? formatMessage(messages[externalId]) : name}
        </MenuItem>
      ))}
    </SelectField>
  )
}
