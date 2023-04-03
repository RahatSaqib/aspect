import { defineMessages } from 'react-intl'

const messages = defineMessages({
  outOfStock: {
    id: 'filter.btnGroup.daysStockLeft.outOfStock',
    defaultMessage: 'Out of Stock',
  },
  upTo14: {
    id: 'filter.btnGroup.daysStockLeft.upTo14',
    defaultMessage: '1-14 Days',
  },
  upTo30: {
    id: 'filter.btnGroup.daysStockLeft.upTo30',
    defaultMessage: '15-30 Days',
  },
  upTo90: {
    id: 'filter.btnGroup.daysStockLeft.upTo90',
    defaultMessage: '1-3 Months',
  },
  upTo180: {
    id: 'filter.btnGroup.daysStockLeft.upTo180',
    defaultMessage: '4-6 Months',
  },
  moreThan180: {
    id: 'filter.btnGroup.daysStockLeft.moreThan180',
    defaultMessage: '>6 Months',
  },
  notRecorded: {
    id: 'filter.btnGroup.daysStockLeft.notRecorded',
    defaultMessage: 'Not Recorded',
  },
  noConsumption: {
    id: 'filter.btnGroup.daysStockLeft.noConsumption',
    defaultMessage: 'No Consumption',
  },
})

export default messages
