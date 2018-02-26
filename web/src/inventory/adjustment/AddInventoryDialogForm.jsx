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
  quantityRequired: {
    id: 'pages.AddInventoryDialogForm.quantityRequired',
    defaultMessage: 'Please specify the quantity to add',
  },
  dialogTitle: {
    id: 'pages.AddInventoryDialogForm.dialogTitle',
    defaultMessage: 'Add {consumableName}',
  },
  quantity: {
    id: 'pages.AddInventoryDialogForm.quantity',
    defaultMessage: 'Quantity to Add',
  },
  dateAdjusted: {
    id: 'pages.AddInventoryDialogForm.dateAdjusted',
    defaultMessage: 'Date Added',
  },
  nextQuantityStatus: {
    id: 'pages.AddInventoryDialogForm.nextQuantityStatus',
    defaultMessage: '(New quantity on hand: {nextQuantity} {unitShortname})',
  },
})

export function validate(
  { canExpire, expiresOn, toSiteId, quantity, dateAdjusted },
  { intl }
) {
  const errors = {}
  if (canExpire && !expiresOn) {
    errors.expiresOn = intl.formatMessage(sharedMessages.expiryDateRequired)
  }
  if (!toSiteId) {
    errors.toSiteId = intl.formatMessage(sharedMessages.siteRequired)
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
      // Add quantities to existing inventoryItem
      this.state.onChange({
        ...DEFAULT_VALUES,
        lotNumber: inventoryItem.get('lotNumber') || DEFAULT_VALUES.lotNumber,
        canExpire: inventoryItem.get('canExpire') === 1,
        expiresOn: inventoryItem.get('expiresOn')
          ? new Date(inventoryItem.get('expiresOn'))
          : undefined,
        toSiteId: inventoryItem.get('siteId'),
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
        unitShortname: consumable.get('unitShortname'),
      }),
    },
  })),
  recomposeForm({
    fields: [
      sharedFields.lotNumber,
      sharedFields.canExpire,
      sharedFields.expiresOn,
      sharedFields.toSiteId,
      sharedFields.quantity,
      sharedFields.dateAdjusted,
      sharedFields.notes,
    ],
    validate,
  })
)

export default enhance(InventoryAdjustmentDialogForm)
