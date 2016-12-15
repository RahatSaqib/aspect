// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import _ from 'lodash'
import {
  injectIntl,
  defineMessages,
  FormattedMessage
} from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form/immutable'

// Our own imports
import TextInput from '../../components/shared/TextInput'
import DateInput from '../../components/shared/DateInput'
import SelectInput from '../../components/shared/SelectInput'
import { fetchSitesForSelectList } from '../../site/SiteRedux'
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
    defaultMessage: 'To Site'
  },
  fromSiteName: {
    id: 'pages.InventoryAdjustmentForm.fromSiteName',
    defaultMessage: 'From Site'
  },
  currentQuantityOnHand: {
    id: 'pages.InventoryAdjustmentForm.currentQuantityOnHand',
    defaultMessage: 'Current Quantity on Hand: {quantityOnHand} {unitShortName}'
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
    updating: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    pristine: PropTypes.bool.isRequired,
    invalid: PropTypes.bool.isRequired,
    initialValues: PropTypes.object.isRequired,
    fetchSitesForSelectList: PropTypes.func.isRequired,
    fetchConsumableReasons: PropTypes.func.isRequired,
    consumableReasons: PropTypes.object.isRequired,
    sitesSelectList: PropTypes.object.isRequired
  }

  state = {
    selectedReasonTestsRun: false
  }

  componentDidMount() {
    const { fetchSitesForSelectList, fetchConsumableReasons } = this.props
    fetchSitesForSelectList()
    fetchConsumableReasons()
  }

  reasonChanged = (event, index, value) => {
    const { consumableReasons: { items } } = this.props
    const selectedReason = items.find(reason => reason.get('id') === value)
    this.setState({
      selectedReasonTestRun: selectedReason &&
        selectedReason.get('i18nKey') === 'ConsumableReason_TestConducted'
    })
  }

  render() {
    const {
      intl: { formatMessage },
      consumableReasons, sitesSelectList, operation, updating,
      handleSubmit, initialValues } = this.props

    const sitesLoading = sitesSelectList.loading
    const sites = sitesSelectList.items.toJS()
    const quantityLabel = operation === addOperation ? formatMessage(messages.addQuantity) :
      (operation === removeOperation ? formatMessage(messages.removeQuantity) :
      formatMessage(messages.transferQuantity))
    const dateAdjustedLabel = operation === addOperation ? formatMessage(messages.addDateLabel) :
      (operation === removeOperation ? formatMessage(messages.removeDateLabel) :
      formatMessage(messages.transferDateLabel))
    const consumableReasonsLoading = consumableReasons.loading
    const consumableReasonsForDropDownList = consumableReasons.items.toJS()
    const formFieldStyle = {
      display: 'inline-block',
      marginRight: '1em'
    }
    console.log(operation, this.state.selectedReasonTestsRun)
    return (
      <form onSubmit={handleSubmit}>
        <section>
          <TextInput
            name="lotNumber" label={formatMessage(messages.lotNumber)}
            disabled={updating} maxLength="255" style={formFieldStyle}
          />
          {
            initialValues.get('canExpire') &&
            <DateInput
              name="expiresOn" label={formatMessage(messages.expiryDate)}
              disabled={updating} container="inline" mode="landscape" autoOk
              style={formFieldStyle}
            />
          }
        </section>
        <section>
          {
            [removeOperation, transferOperation].includes(operation) &&
            <SelectInput
              name="fromSiteId" label={formatMessage(messages.fromSiteName)}
              disabled={updating || sitesLoading || _.isEmpty(sites)} autoWidth
              dataSource={sites} dataSourceConfig={{ text: 'name', value: 'id' }}
              style={formFieldStyle}
            />
          }
          {
            [addOperation, transferOperation].includes(operation) &&
            <SelectInput
              name="toSiteId" label={formatMessage(messages.toSiteName)}
              disabled={updating || sitesLoading || _.isEmpty(sites)} autoWidth
              dataSource={sites} dataSourceConfig={{ text: 'name', value: 'id' }}
              style={formFieldStyle}
            />
          }
        </section>
        <section>
          <TextInput name="quantity" label={quantityLabel} disabled={updating} />
          { initialValues.get('unitShortName') }
          <br />
          <FormattedMessage
            {...messages.currentQuantityOnHand}
            values={{
              quantityOnHand: initialValues.get('quantityOnHand'),
              unitShortName: initialValues.get('unitShortName')
            }}
          />
        </section>
        {
          operation === removeOperation &&
          <section>
            <SelectInput
              name="reasonId" label={formatMessage(messages.reason)}
              disabled={updating ||
              consumableReasonsLoading ||
              _.isEmpty(consumableReasonsForDropDownList)}
              onChange={this.reasonChanged}
              autoWidth dataSource={consumableReasonsForDropDownList}
              dataSourceConfig={{ text: 'name', value: 'id' }}
              style={formFieldStyle}
            />
          </section>
        }
        {
          operation === removeOperation && this.state.selectedReasonTestsRun &&
          <section>
            <DateInput
              name="dateAdjustedFrom" label={formatMessage(messages.testsRunBetween)}
              disabled={updating} container="inline" mode="landscape" autoOk
              style={formFieldStyle}
            />
            <DateInput
              name="dateAdjustedTo" label={formatMessage(messages.and)}
              disabled={updating} container="inline" mode="landscape" autoOk
              style={formFieldStyle}
            />
          </section>
        }
        {
          (!this.state.selectedReasonTestsRun) &&
          <section>
            <DateInput
              name="dateAdjusted" label={dateAdjustedLabel}
              disabled={updating} container="inline" mode="landscape" autoOk
              style={formFieldStyle}
            />
          </section>
        }
      </form>
    )
  }
}

function mapStateToProps(state) {
  return {
    updating: state.inventory.getIn(['inventoryAdjustment', 'updating']),
    operation: state.inventory.getIn(['inventoryAdjustment', 'operation']),
    consumableReasons: state.consumable.get('consumableReasons'),
    sitesSelectList: state.site.get('selectList')
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSitesForSelectList,
    fetchConsumableReasons
  }, dispatch)
}

const validate = (inventoryAdjustmentDetails, props) => {
  const { intl: { formatMessage }, operation } = props
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
