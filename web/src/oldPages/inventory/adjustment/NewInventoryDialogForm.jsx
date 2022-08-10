import pick from 'lodash/pick'
import identity from 'lodash/identity'
import Immutable from 'immutable'
import { compose, withProps, lifecycle, pure } from 'recompose'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'

import recomposeForm from '../../../oldComponents/recomposeForm'
import {
  SHARED_DEFAULT_VALUES,
  sharedMessages,
  sharedFields,
  InventoryAdjustmentDialogForm,
} from './InventoryAdjustmentDialogForm'
import { withTodayProps, withDateFormatProps } from '../../../utils/utils/dateFormat'

const EMPTY_MAP = Immutable.Map()

const messages = defineMessages({
  quantityRequired: {
    id: 'pages.NewInventoryDialogForm.quantityRequired',
    defaultMessage: 'Please specify the quantity to add',
  },
  defaultConsumableName: {
    id: 'pages.NewInventoryDialogForm.defaultConsumableName',
    defaultMessage: 'Inventory Item',
  },
  dialogTitle: {
    id: 'pages.NewInventoryDialogForm.dialogTitle',
    defaultMessage: 'Add {consumableName}',
  },
  quantity: {
    id: 'pages.NewInventoryDialogForm.quantity',
    defaultMessage: 'Quantity to Add',
  },
  dateAdjusted: {
    id: 'pages.NewInventoryDialogForm.dateAdjusted',
    defaultMessage: 'Date Added',
  },
  nextQuantityStatus: {
    id: 'pages.NewInventoryDialogForm.nextQuantityStatus',
    defaultMessage: '(New quantity on hand: {nextQuantity} {unitShortName})',
  },
})

export function validate({ consumableId, canExpire, expiresOn, toSiteId, quantity, dateAdjusted }, { intl }) {
  const errors = {}
  if (!consumableId || consumableId <= 0) {
    errors.consumableId = intl.formatMessage(sharedMessages.consumableRequired)
  }
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

const DEFAULT_VALUES = {
  consumableId: null,
  ...pick(SHARED_DEFAULT_VALUES, [
    'lotNumber',
    'canExpire',
    'expiresOn',
    'toSiteId',
    'quantity',
    'dateAdjusted',
    'notes',
  ]),
}

const enhance = compose(
  pure,
  withTodayProps,
  withDateFormatProps,
  lifecycle({
    UNSAFE_componentWillMount() {
      const onChange = values => this.setState({ values })
      this.setState({
        onChange,
        values: DEFAULT_VALUES,
      })
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      const { inventoryItem, today } = nextProps

      // Every time the dialog opens or closes, we need to clean the form
      if (this.props.isDialogActive !== nextProps.isDialogActive) this.setState({ values: DEFAULT_VALUES })

      if (this.props.inventoryItem !== inventoryItem) {
        // Re-initialize
        // Add quantities to existing inventoryItem
        this.state.onChange({
          ...DEFAULT_VALUES,
          lotNumber: inventoryItem.get('lotNumber') || DEFAULT_VALUES.lotNumber,
          canExpire: inventoryItem.get('canExpire') === 1,
          expiresOn: inventoryItem.get('expiresOn') ? new Date(inventoryItem.get('expiresOn')) : null,
          toSiteId: inventoryItem.get('siteId'),
          dateAdjusted: today,
        })
      }
    },
  }),
  connect((state, { values }) => ({
    consumable: state.consumable.consumables.items.find(c => c.get('id') === values.consumableId, null, EMPTY_MAP),
  })),
  withProps(({ intl, consumable }) => ({
    currInventoryItem: null,
    consumable,
    labels: {
      dialogTitle: intl.formatMessage(messages.dialogTitle, {
        consumableName: consumable.get('name') || intl.formatMessage(messages.defaultConsumableName),
      }),
      quantity: intl.formatMessage(messages.quantity),
      dateAdjusted: intl.formatMessage(messages.dateAdjusted),
    },
  })),
  recomposeForm({
    fields: [
      {
        fieldName: 'consumableId',
        valueFromChangeEvent: identity,
      },
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
