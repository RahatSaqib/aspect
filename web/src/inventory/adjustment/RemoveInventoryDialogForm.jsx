import _ from 'lodash'
import Immutable from 'immutable'
import { compose, withProps, lifecycle, pure } from 'recompose'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'

import recomposeForm from '../../components/recomposeForm'
import {
  SHARED_DEFAULT_VALUES,
  testConductedReasonI18nKey,
  sharedMessages,
  sharedFields,
  withTodayProps,
  InventoryAdjustmentDialogForm,
} from './InventoryAdjustmentDialogForm'

const EMPTY_MAP = Immutable.Map()

const messages = defineMessages({
  quantityRequired: {
    id: 'pages.RemoveInventoryDialogForm.quantityRequired',
    defaultMessage: 'Please specify the quantity to remove',
  },
  positiveQuantityRequired: {
    id: 'pages.RemoveInventoryDialogForm.positiveQuantityRequired',
    defaultMessage: 'The most that you can remove is {currentQuantity}',
  },
  dialogTitle: {
    id: 'pages.RemoveInventoryDialogForm.dialogTitle',
    defaultMessage: 'Remove {consumableName}',
  },
  quantity: {
    id: 'pages.RemoveInventoryDialogForm.quantity',
    defaultMessage: 'Quantity to Remove',
  },
  dateAdjusted: {
    id: 'pages.RemoveInventoryDialogForm.dateAdjusted',
    defaultMessage: 'Date Removed',
  },
  nextQuantityStatus: {
    id: 'pages.RemoveInventoryDialogForm.nextQuantityStatus',
    defaultMessage: '(New quantity on hand: {nextQuantity} {unitShortname})',
  },
})

export function validate(
  {
    reasonId,
    dateAdjustedFrom,
    dateAdjustedTo,
    canExpire,
    expiresOn,
    fromSiteId,
    quantity,
    dateAdjusted,
  },
  { intl, inventoryItem, consumableReason }
) {
  const errors = {}
  if (canExpire && !expiresOn) {
    errors.expiresOn = intl.formatMessage(sharedMessages.expiryDateRequired)
  }
  if (!fromSiteId) {
    errors.fromSiteId = intl.formatMessage(sharedMessages.siteRequired)
  }
  if (!quantity || quantity <= 0) {
    errors.quantity = intl.formatMessage(messages.quantityRequired)
  } else if (inventoryItem && quantity > inventoryItem.get('quantityOnHand')) {
    errors.quantity = intl.formatMessage(messages.positiveQuantityRequired, {
      currentQuantity: inventoryItem.get('quantityOnHand'),
    })
  }
  if (!reasonId) {
    errors.reasonId = intl.formatMessage(sharedMessages.reasonRequired)
  }
  if (
    consumableReason &&
    consumableReason.get('i18nKey') === testConductedReasonI18nKey
  ) {
    if (!dateAdjustedFrom) {
      errors.dateAdjustedFrom = intl.formatMessage(sharedMessages.dateRequired)
    }
    if (!dateAdjustedTo) {
      errors.dateAdjustedTo = intl.formatMessage(sharedMessages.dateRequired)
    } else if (dateAdjustedFrom > dateAdjustedTo) {
      errors.dateAdjustedTo = intl.formatMessage(
        sharedMessages.dateFromAfterDateTo
      )
    }
  } else if (!dateAdjusted) {
    errors.dateAdjusted = intl.formatMessage(sharedMessages.dateRequired)
  }
  return errors
}

const DEFAULT_VALUES = {
  reasonId: '',
  dateAdjustedFrom: undefined,
  dateAdjustedTo: undefined,
  ..._.pick(SHARED_DEFAULT_VALUES, [
    'lotNumber',
    'canExpire',
    'expiresOn',
    'fromSiteId',
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
        fromSiteId: inventoryItem.get('siteId'),
        dateAdjustedFrom: today,
        dateAdjustedTo: today,
        dateAdjusted: today,
      })
    },
  }),
  connect((state, { values, inventoryItem }) => ({
    consumable: state.consumable.consumables.items.find(
      c => c.get('id') === inventoryItem.get('consumableId'),
      null,
      EMPTY_MAP
    ),
    consumableReason: state.consumable.consumableReasons.items.find(
      c => c.get('id') === values.reasonId,
      null,
      EMPTY_MAP
    ),
  })),
  withProps(({ intl, inventoryItem, values, consumable }) => ({
    labels: {
      dialogTitle: intl.formatMessage(messages.dialogTitle, {
        consumableName: consumable.get('name'),
      }),
      quantity: intl.formatMessage(messages.quantity),
      dateAdjusted: intl.formatMessage(messages.dateAdjusted),
      nextQuantityStatus: intl.formatMessage(messages.nextQuantityStatus, {
        nextQuantity: inventoryItem.get('quantityOnHand', 0) - values.quantity,
        unitShortname: consumable.get('unitShortname'),
      }),
    },
  })),
  recomposeForm({
    fields: [
      sharedFields.lotNumber,
      sharedFields.canExpire,
      sharedFields.expiresOn,
      sharedFields.fromSiteId,
      sharedFields.quantity,
      {
        fieldName: 'reasonId',
        valueFromChangeEvent: _.identity,
      },
      {
        fieldName: 'dateAdjustedFrom',
        valueFromChangeEvent: _.identity,
      },
      {
        fieldName: 'dateAdjustedTo',
        valueFromChangeEvent: _.identity,
      },
      sharedFields.dateAdjusted,
      sharedFields.notes,
    ],
    validate,
  })
)

export default enhance(InventoryAdjustmentDialogForm)
