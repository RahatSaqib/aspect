import _ from 'lodash'
import Immutable from 'immutable'
import { compose, withProps, lifecycle, pure } from 'recompose'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'

import recomposeForm from '../../components/recomposeForm'
import {
  SHARED_DEFAULT_VALUES,
  sharedMessages,
  sharedFields,
  withTodayProps,
  InventoryAdjustmentDialogForm,
} from './InventoryAdjustmentDialogForm'

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
    defaultMessage: '(New quantity on hand: {nextQuantity} {unitShortname})',
  },
})

export function validate(
  { consumableId, canExpire, expiresOn, toSiteId, quantity, dateAdjusted },
  { intl }
) {
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
  consumableId: '',
  ..._.pick(SHARED_DEFAULT_VALUES, [
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
  lifecycle({
    componentWillMount() {
      const onChange = values => this.setState({ values })

      this.setState({
        onChange,
        values: DEFAULT_VALUES,
      })
    },

    componentWillReceiveProps(nextProps) {
      const { today } = nextProps
      // Re-initialize
      // Create new inventoryItem (without associating to any existing inventoryItem)
      this.state.onChange({
        ...DEFAULT_VALUES,
        canExpire: true,
        expiresOn: today,
        dateAdjusted: today,
      })
    },
  }),
  connect((state, { values }) => ({
    consumable: state.consumable.consumables.items.find(
      c => c.get('id') === values.consumableId,
      null,
      EMPTY_MAP
    ),
  })),
  withProps(({ intl, values, consumable }) => ({
    labels: {
      dialogTitle: intl.formatMessage(messages.dialogTitle, {
        consumableName:
          consumable.get('name') ||
          intl.formatMessage(messages.defaultConsumableName),
      }),
      quantity: intl.formatMessage(messages.quantity),
      dateAdjusted: intl.formatMessage(messages.dateAdjusted),
      nextQuantityStatus: intl.formatMessage(messages.nextQuantityStatus, {
        nextQuantity: 0 + values.quantity,
        unitShortname: consumable.get('unitShortname'),
      }),
    },
  })),
  recomposeForm({
    fields: [
      {
        fieldName: 'consumableId',
        valueFromChangeEvent: _.identity,
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
  }),
  lifecycle({
    componentWillReceiveProps({
      today,
      consumable,
      values,
      onCanExpireChange,
      onExpiresOnChange,
    }) {
      if (this.props.values.consumableId !== values.consumableId) {
        onCanExpireChange(consumable.get('canExpire') === 1)
        onExpiresOnChange(
          consumable.get('canExpire') === 1 ? today : values.expiresOn
        )
      }
    },
  })
)

export default enhance(InventoryAdjustmentDialogForm)
