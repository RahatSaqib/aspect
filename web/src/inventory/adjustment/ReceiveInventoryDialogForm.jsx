import _ from 'lodash'
import { compose, withProps, lifecycle, pure } from 'recompose'
import { defineMessages } from 'react-intl'

import recomposeForm from '../../components/recomposeForm'
import {
  SHARED_DEFAULT_VALUES,
  sharedMessages,
  sharedFields,
  withTodayProps,
  connectConsumableFromInventoryItem,
  InventoryAdjustmentDialogForm,
} from './InventoryAdjustmentDialogForm'

const messages = defineMessages({
  siteShouldBeDifferent: {
    id: 'pages.ReceiveInventoryDialogForm.siteShouldBeDifferent',
    defaultMessage: 'Please choose a different site',
  },
  quantityRequired: {
    id: 'pages.ReceiveInventoryDialogForm.quantityRequired',
    defaultMessage: 'Please specify the quantity to receive',
  },
  dialogTitle: {
    id: 'pages.ReceiveInventoryDialogForm.dialogTitle',
    defaultMessage: 'Receive {consumableName}',
  },
  quantity: {
    id: 'pages.ReceiveInventoryDialogForm.quantity',
    defaultMessage: 'Quantity Received',
  },
  dateAdjusted: {
    id: 'pages.ReceiveInventoryDialogForm.dateAdjusted',
    defaultMessage: 'Date Received',
  },
  nextQuantityStatus: {
    id: 'pages.ReceiveInventoryDialogForm.nextQuantityStatus',
    defaultMessage: '(Quantity Transferred: {nextQuantity} {unitShortName})',
  },
})

export function validate(
  { canExpire, expiresOn, fromSiteId, toSiteId, quantity, dateAdjusted },
  { intl }
) {
  const errors = {}
  if (canExpire && !expiresOn) {
    errors.expiresOn = intl.formatMessage(sharedMessages.expiryDateRequired)
  }
  if (!fromSiteId) {
    errors.fromSiteId = intl.formatMessage(sharedMessages.siteRequired)
  }
  if (!toSiteId) {
    errors.toSiteId = intl.formatMessage(sharedMessages.siteRequired)
  }
  if (!errors.toSiteId && fromSiteId === toSiteId) {
    errors.toSiteId = intl.formatMessage(messages.siteShouldBeDifferent)
  }
  if (!quantity || quantity <= 0) {
    errors.quantity = intl.formatMessage(messages.quantityRequired)
  }
  if (!dateAdjusted) {
    errors.dateAdjusted = intl.formatMessage(sharedMessages.dateRequired)
  }
  return errors
}

const DEFAULT_VALUES = _.pick(SHARED_DEFAULT_VALUES, [
  'lotNumber',
  'canExpire',
  'expiresOn',
  'fromSiteId',
  'toSiteId',
  'quantity',
  'dateAdjusted',
  'notes',
])

const enhance = compose(
  pure,
  withTodayProps,
  lifecycle({
    componentWillMount() {
      const onChange = values => this.setState({ values })

      this.setState({
        onChange,
        values: DEFAULT_VALUES,
      })
    },

    componentWillReceiveProps(nextProps) {
      const { inventoryItem, today } = nextProps
      if (this.props.inventoryItem === inventoryItem) {
        return
      }
      // Re-initialize
      this.state.onChange({
        ...DEFAULT_VALUES,
        lotNumber: inventoryItem.get('lotNumber') || DEFAULT_VALUES.lotNumber,
        canExpire: inventoryItem.get('canExpire') === 1,
        expiresOn: inventoryItem.get('expiresOn')
          ? new Date(inventoryItem.get('expiresOn'))
          : undefined,
        fromSiteId: inventoryItem.get('inTransitFromSiteId'),
        toSiteId: inventoryItem.get('siteId'),
        quantity: inventoryItem.get('quantityOnHand'),
        dateAdjusted: today,
      })
    },
  }),
  connectConsumableFromInventoryItem,
  withProps(({ intl, inventoryItem, values, consumable }) => ({
    labels: {
      dialogTitle: intl.formatMessage(messages.dialogTitle, {
        consumableName: consumable.get('name'),
      }),
      quantity: intl.formatMessage(messages.quantity),
      dateAdjusted: intl.formatMessage(messages.dateAdjusted),
      nextQuantityStatus: intl.formatMessage(messages.nextQuantityStatus, {
        nextQuantity: inventoryItem.get('quantityOnHand', 0) + values.quantity,
        unitShortName: consumable.get('unitShortName'),
      }),
    },
  })),
  recomposeForm({
    fields: [
      sharedFields.lotNumber,
      sharedFields.canExpire,
      sharedFields.expiresOn,
      sharedFields.fromSiteId,
      sharedFields.toSiteId,
      sharedFields.quantity,
      sharedFields.dateAdjusted,
      sharedFields.notes,
    ],
    validate,
  })
)
export default enhance(InventoryAdjustmentDialogForm)
