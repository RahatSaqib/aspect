// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import _ from 'lodash'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form/immutable'

// Material-UI

// Our own imports
import { fetchSites } from '../../site/SiteRedux'
import { fetchConsumableReasons } from '../../consumable/ConsumableRedux'
import { addOperation, removeOperation, transferOperation } from '../InventoryRedux'

const messages = defineMessages({
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

class InventoryAdjustmentForm extends PureComponent {
  static propTypes = {
    intl: PropTypes.object.isRequired,
    operation: PropTypes.oneOf([addOperation, removeOperation, transferOperation]).isRequired,
    handleSubmit: PropTypes.func.isRequired,
    pristine: PropTypes.bool.isRequired,
    invalid: PropTypes.bool.isRequired,
    initialValues: PropTypes.object.isRequired,
    fetchSites: PropTypes.func.isRequired,
    fetchConsumableReasons: PropTypes.func.isRequired
  }

  componentDidMount() {
    const { fetchSites, fetchConsumableReasons } = this.props
    fetchSites()
    fetchConsumableReasons()
  }

  render() {
    const {
      intl: { formatMessage },
      handleSubmit, operation, initialValues, pristine, invalid } = this.props
    return (
      <form onSubmit={handleSubmit}>
        <p>
          { operation }
        </p>
        <p>
          { formatMessage(messages.lotNumber) }
        </p>
        <p>
          { JSON.stringify(initialValues) }
        </p>
        <span>
          { pristine }
        </span>
        <span>
          { invalid }
        </span>
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
    fetchConsumableReasons
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

export default _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'inventoryAdjustment',
    enableReinitialize: true,
    validate
  })
)(InventoryAdjustmentForm)
