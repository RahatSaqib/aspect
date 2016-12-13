// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import _ from 'lodash'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { reduxForm, SubmissionError } from 'redux-form/immutable'

// Material-UI

// Our own imports
import { fetchSites } from '../../site/SiteRedux'
import { fetchConsumableReasons } from '../../consumable/ConsumableRedux'
import {
  addInventory,
  removeInventory,
  transferInventory
} from '../InventoryRedux'

const messages = defineMessages({
  addTitle: {
    id: 'pages.InventoryAdjustmentForm.addTitle',
    defaultMessage: 'Add {consumableName}'
  },
  removeTitle: {
    id: 'pages.InventoryAdjustmentForm.removeTitle',
    defaultMessage: 'Remove {consumableName}'
  },
  transferTitle: {
    id: 'pages.InventoryAdjustmentForm.transferTitle',
    defaultMessage: 'Transfer {consumableName}'
  },
  lotNumber: {
    id: 'pages.InventoryAdjustmentForm.lotNumber',
    defaultMessage: 'Lot Number'
  },
  expiryDate: {
    id: 'pages.InventoryAdjustmentForm.expiryDate',
    defaultMessage: 'Expiry Date'
  },
  toSiteName: {
    id: 'pages.InventoryAdjustmentForm.toSiteName',
    defaultMessage: 'to'
  },
  fromSiteName: {
    id: 'pages.InventoryAdjustmentForm.fromSiteName',
    defaultMessage: 'from'
  },
  currentQuantityOnHand: {
    id: 'pages.InventoryAdjustmentForm.currentQuantityOnHand',
    defaultMessage: 'Current Quantity on Hand: {quantityOnHand}'
  },
  addQuantity: {
    id: 'pages.InventoryAdjustmentForm.addQuantity',
    defaultMessage: 'Quantity to Add'
  },
  removeQuantity: {
    id: 'pages.InventoryAdjustmentForm.removeQuantity',
    defaultMessage: 'Quantity to Remove'
  },
  transferQuantity: {
    id: 'pages.InventoryAdjustmentForm.transferQuantity',
    defaultMessage: 'Quantity to Transfer'
  },
  reason: {
    id: 'pages.InventoryAdjustmentForm.reason',
    defaultMessage: 'Reason'
  },
  testsRunBetween: {
    id: 'pages.InventoryAdjustmentForm.testsRunBetween',
    defaultMessage: 'Tests Run Between'
  },
  and: {
    id: 'pages.InventoryAdjustmentForm.and',
    defaultMessage: 'and'
  },
  addDateLabel: {
    id: 'pages.InventoryAdjustmentForm.addDateLabel',
    defaultMessage: 'Date Added'
  },
  removeDateLabel: {
    id: 'pages.InventoryAdjustmentForm.removeDateLabel',
    defaultMessage: 'Date Removed'
  },
  transferDateLabel: {
    id: 'pages.InventoryAdjustmentForm.transferDateLabel',
    defaultMessage: 'Date Transferred'
  },
  notes: {
    id: 'pages.InventoryAdjustmentForm.notes',
    defaultMessage: 'Notes'
  },
  submit: {
    id: 'pages.InventoryAdjustmentForm.submit',
    defaultMessage: 'Submit'
  },
  cancel: {
    id: 'pages.InventoryAdjustmentForm.cancel',
    defaultMessage: 'Cancel'
  },
  quantityRequired: {
    id: 'pages.InventoryAdjustmentForm.quantityRequired',
    defaultMessage: 'Please specify the quantity that you wish to {operation}'
  }
})

export const addOperation = 'add'
export const removeOperation = 'remove'
export const transferOperation = 'transfer'

class InventoryAdjustmentForm extends PureComponent {
  static propTypes = {
    intl: PropTypes.object.isRequired,
    operation: PropTypes.oneOf([addOperation, removeOperation, transferOperation]).isRequired,
    initialValues: PropTypes.object.isRequired,
    fetchSites: PropTypes.func.isRequired,
    fetchConsumableReasons: PropTypes.func.isRequired,
    addInventory: PropTypes.func.isRequired,
    removeInventory: PropTypes.func.isRequired,
    transferInventory: PropTypes.func.isRequired
  }

  componentDidMount() {
    const { fetchSites, fetchConsumableReasons } = this.props
    fetchSites()
    fetchConsumableReasons()
  }
  handleSubmit = (formValues) => {
    const { operation, addInventory, removeInventory, transferInventory } = this.props
    switch (operation) {
      case addOperation:
        return addInventory(formValues.get('id'), formValues.toJS())
      case removeOperation:
        return removeInventory(formValues.get('id'), formValues.toJS())
      case transferOperation:
        return transferInventory(formValues.get('id'), formValues.toJS())
      default:
        throw new SubmissionError({ _error: `Invalid operation ${operation} for inventory adjustment form` })
    }
  }

  render() {
    const { intl: { formatMessage }, operation, initialValues } = this.props

    const formHeaderValues = { consumableName: initialValues.get('consumableName') }
    const formHeader = operation === addOperation ?
      formatMessage(messages.addTitle, formHeaderValues) :
      (operation === removeOperation ?
        formatMessage(messages.removeTitle, formHeaderValues) :
        formatMessage(messages.transferTitle, formHeaderValues))
    return (
      <form onSubmit={this.handleSubmit}>
        <h3>{formHeader}</h3>
      </form>
    )
  }
}

function mapStateToProps(state) {
  return {
    operation: state.inventory.get('currentAdjustmentOperation')
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSites,
    fetchConsumableReasons,
    addInventory,
    removeInventory,
    transferInventory
  }, dispatch)
}

const validate = (inventoryAdjustmentDetails, props) => {
  const { formatMessage, operation } = props.intl
  const errors = {}
  if (inventoryAdjustmentDetails) {
    if (!inventoryAdjustmentDetails.get('quantity')) {
      errors.quantity = formatMessage(messages.quantityRequired, { operation })
    }
  }
  return errors
}

export const InventoryAdjustmentFormContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'inventoryAdjustment',
    enableReinitialize: true,
    validate
  })
)(InventoryAdjustmentForm)
