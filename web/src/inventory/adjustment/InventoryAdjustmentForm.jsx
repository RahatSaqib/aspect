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
import { reduxForm, change as changeFieldValue } from 'redux-form/immutable'

// Our own imports
import TextInput from '../../components/shared/TextInput'
import DateInput from '../../components/shared/DateInput'
import SelectInput from '../../components/shared/SelectInput'
import { fetchSitesForSelectList } from '../../site/SiteRedux'
import { fetchConsumables, fetchConsumableReasons } from '../../consumable/ConsumableRedux'
import {
  addOperation,
  removeOperation,
  transferOperation,
  receiveOperation,
  changeAdjustmentConsumable
} from '../InventoryRedux'

const messages = defineMessages({
  consumable: {
    id: 'pages.InventoryAdjustmentForm.consumable',
    defaultMessage: 'Consumable'
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
    defaultMessage: 'To Site'
  },
  fromSiteName: {
    id: 'pages.InventoryAdjustmentForm.fromSiteName',
    defaultMessage: 'From Site'
  },
  newQuantityOnHand: {
    id: 'pages.InventoryAdjustmentForm.newQuantityOnHand',
    defaultMessage: '(New quantity on hand: {newQuantityOnHand} {unitShortName})'
  },
  quantityTransferred: {
    id: 'pages.InventoryAdjustmentForm.quantityTransferred',
    defaultMessage: '(Quantity Transferred: {quantityOnHand} {unitShortName})'
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
  receiveQuantity: {
    id: 'pages.InventoryAdjustmentForm.receiveQuantity',
    defaultMessage: 'Quantity Received'
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
  receivedDateLabel: {
    id: 'pages.InventoryAdjustmentForm.receivedDateLabel',
    defaultMessage: 'Date Received'
  },
  notes: {
    id: 'pages.InventoryAdjustmentForm.notes',
    defaultMessage: 'Notes'
  },
  consumableRequired: {
    id: 'pages.InventoryAdjustmentForm.consumableRequired',
    defaultMessage: 'Please specify a consumable'
  },
  expiryDateRequired: {
    id: 'pages.InventoryAdjustmentForm.expiryDateRequired',
    defaultMessage: 'Please specify an expiry date'
  },
  siteRequired: {
    id: 'pages.InventoryAdjustmentForm.siteRequired',
    defaultMessage: 'Please select a site'
  },
  siteShouldBeDifferent: {
    id: 'pages.InventoryAdjustmentForm.siteShouldBeDifferent',
    defaultMessage: 'Please choose a different site'
  },
  quantityRequired: {
    id: 'pages.InventoryAdjustmentForm.quantityRequired',
    defaultMessage: 'Please specify the quantity to {operation}'
  },
  positiveQuantityRequired: {
    id: 'pages.InventoryAdjustmentForm.positiveQuantityRequired',
    defaultMessage: 'The most that you can {operation} is {currentQuantity}'
  },
  reasonRequired: {
    id: 'pages.InventoryAdjustmentForm.reasonRequired',
    defaultMessage: 'Please select a reason'
  },
  dateRequired: {
    id: 'pages.InventoryAdjustmentForm.dateRequired',
    defaultMessage: 'Please specify a date'
  },
  dateFromAfterDateTo: {
    id: 'pages.InventoryAdjustmentForm.dateFromAfterDateTo',
    defaultMessage: 'Please choose a date later or equal to from date'
  },
  ConsumableReason_Expired: {
    id: 'pages.InventoryAdjustmentForm.ConsumableReason_Expired',
    defaultMessage: 'Expired'
  },
  ConsumableReason_Lost: {
    id: 'pages.InventoryAdjustmentForm.ConsumableReason_Lost',
    defaultMessage: 'Lost'
  },
  ConsumableReason_Stolen: {
    id: 'pages.InventoryAdjustmentForm.ConsumableReason_Stolen',
    defaultMessage: 'Stolen'
  },
  ConsumableReason_TestConducted: {
    id: 'pages.InventoryAdjustmentForm.ConsumableReason_TestConducted',
    defaultMessage: 'Test Conducted'
  }
})

export const testConductedReasonI18nKey = 'ConsumableReason_TestConducted'

class InventoryAdjustmentForm extends PureComponent {
  static propTypes = {
    intl: PropTypes.object.isRequired,
    operation: PropTypes.oneOf(
      [addOperation, removeOperation, transferOperation, receiveOperation]),
    updating: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    changeFieldValue: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    fetchSitesForSelectList: PropTypes.func.isRequired,
    fetchConsumables: PropTypes.func.isRequired,
    fetchConsumableReasons: PropTypes.func.isRequired,
    changeAdjustmentConsumable: PropTypes.func.isRequired,
    consumables: PropTypes.object.isRequired,
    consumableReasons: PropTypes.object.isRequired,
    sitesSelectList: PropTypes.object.isRequired
  }

  state = {
    selectedReasonKey: null,
    adjustmentQuantity: 0
  }

  componentDidMount() {
    const { fetchSitesForSelectList, fetchConsumables, fetchConsumableReasons } = this.props
    fetchSitesForSelectList()
    fetchConsumables()
    fetchConsumableReasons()
  }

  handleReasonChange = (event, index, value) => {
    const { consumableReasons, changeFieldValue } = this.props
    const selectedAdjustmentReason =
      consumableReasons.items.find(reason => reason.get('id') === value)
    if (this.state.selectedReasonKey === testConductedReasonI18nKey &&
      selectedAdjustmentReason.get('i18nKey') !== testConductedReasonI18nKey) {
      changeFieldValue('inventoryAdjustment', 'dateAdjustedFrom', undefined)
      changeFieldValue('inventoryAdjustment', 'dateAdjustedTo', undefined)
    } else if (this.state.selectedReasonKey !== testConductedReasonI18nKey &&
      selectedAdjustmentReason.get('i18nKey') === testConductedReasonI18nKey) {
      changeFieldValue('inventoryAdjustment', 'dateAdjusted', undefined)
    }
    this.setState({
      selectedReasonKey: selectedAdjustmentReason.get('i18nKey')
    })
  }

  handleConsumableTypeChange = (event, index, value) => {
    const { consumables: { items }, changeAdjustmentConsumable } = this.props
    const selectedConsumable = items.find(
      consumable => consumable.get('id') === value)
    changeAdjustmentConsumable(selectedConsumable)
  }

  handleQuantityChanged = (event, value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      this.props.changeFieldValue('inventoryAdjustment', 'quantity', value)
      this.setState({
        adjustmentQuantity: Number(value)
      })
    }
  }

  render() {
    const {
      intl: { formatMessage },
      consumables, consumableReasons, sitesSelectList, operation,
      updating, handleSubmit, initialValues } = this.props

    const sitesLoading = sitesSelectList.loading
    const sites = sitesSelectList.items.toJS()

    const consumablesLoading = consumables.loading
    const consumablesList = consumables.items.toJS()
    const quantityLabel = operation === addOperation ? formatMessage(messages.addQuantity) :
      (operation === removeOperation ? formatMessage(messages.removeQuantity) :
        (operation === transferOperation ? formatMessage(messages.transferQuantity) :
          formatMessage(messages.receiveQuantity)))
    const newQuantityOnHand = [addOperation, receiveOperation].includes(operation) ?
      (initialValues.get('quantityOnHand') || 0) + (this.state.adjustmentQuantity || 0) :
      initialValues.get('quantityOnHand') - this.state.adjustmentQuantity
    const dateAdjustedLabel = operation === addOperation ? formatMessage(messages.addDateLabel) :
      (operation === removeOperation ? formatMessage(messages.removeDateLabel) :
        (operation === transferOperation ? formatMessage(messages.transferDateLabel) :
          formatMessage(messages.receivedDateLabel)))
    const consumableReasonsLoading = consumableReasons.loading
    const consumableReasonsForDropDownList =
      _.map(consumableReasons.items.toJS(), consumableReason => ({
        id: consumableReason.id,
        name: messages[consumableReason.i18nKey] ?
          formatMessage(messages[consumableReason.i18nKey]) :
          consumableReason.name
      }))
    const formFieldStyle = {
      display: 'inline-block',
      marginRight: '1em'
    }

    const hiddenStyles = { display: 'none' }
    const visibleStyles = { display: 'block' }
    return (
      <form onSubmit={handleSubmit}>
        {
          initialValues.get('inventoryItemId') <= 0 &&
          <section>
            <SelectInput
              name="consumableId" label={formatMessage(messages.consumable)}
              disabled={updating || consumablesLoading || _.isEmpty(consumables)} autoWidth
              dataSource={consumablesList} dataSourceConfig={{ text: 'name', value: 'id' }}
              style={formFieldStyle} onChange={this.handleConsumableTypeChange}
            />
          </section>
        }
        <section>
          <TextInput
            name="lotNumber" label={formatMessage(messages.lotNumber)}
            disabled={updating} maxLength="255" style={formFieldStyle}
            autoFocus
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
            [removeOperation, transferOperation, receiveOperation].includes(operation) &&
            <SelectInput
              name="fromSiteId" label={formatMessage(messages.fromSiteName)}
              disabled={updating || sitesLoading || _.isEmpty(sites)} autoWidth
              dataSource={sites} dataSourceConfig={{ text: 'name', value: 'id' }}
              style={formFieldStyle}
            />
          }
          {
            [addOperation, transferOperation, receiveOperation].includes(operation) &&
            <SelectInput
              name="toSiteId" label={formatMessage(messages.toSiteName)}
              disabled={updating || sitesLoading || _.isEmpty(sites)} autoWidth
              dataSource={sites} dataSourceConfig={{ text: 'name', value: 'id' }}
              style={formFieldStyle}
            />
          }
        </section>
        <section>
          <TextInput
            name="quantity" label={quantityLabel} disabled={updating}
            style={formFieldStyle} inputStyle={{ textAlign: 'right' }}
            onChange={this.handleQuantityChanged}
          />
          { initialValues.get('unitShortName') }
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <FormattedMessage
            {...(operation === receiveOperation ?
              messages.quantityTransferred :
              messages.newQuantityOnHand)}
            values={{
              newQuantityOnHand: newQuantityOnHand.toString(),
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
              autoWidth dataSource={consumableReasonsForDropDownList}
              dataSourceConfig={{ text: 'name', value: 'id' }}
              style={formFieldStyle} onChange={this.handleReasonChange}
            />
          </section>
        }
        <section
          style={this.state.selectedReasonKey === testConductedReasonI18nKey ?
            visibleStyles : hiddenStyles}
        >
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
        <section
          style={this.state.selectedReasonKey === testConductedReasonI18nKey ?
            hiddenStyles : visibleStyles}
        >
          <DateInput
            name="dateAdjusted" label={dateAdjustedLabel}
            disabled={updating} container="inline" mode="landscape" autoOk
            style={formFieldStyle}
          />
        </section>
        <section>
          <TextInput
            name="notes" label={formatMessage(messages.notes)} disabled={updating} maxLength="2000"
            multiLine fullWidth rows={2} style={formFieldStyle}
          />
        </section>
      </form>
    )
  }
}

function mapStateToProps(state) {
  return {
    updating: state.inventory.getIn(['inventoryAdjustment', 'updating']),
    operation: state.inventory.getIn(['inventoryAdjustment', 'operation']),
    consumables: state.consumable.get('consumables'),
    consumableReasons: state.consumable.get('consumableReasons'),
    sitesSelectList: state.site.get('selectList')
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSitesForSelectList,
    fetchConsumables,
    fetchConsumableReasons,
    changeFieldValue,
    changeAdjustmentConsumable
  }, dispatch)
}

const validate = (inventoryAdjustmentDetails, props) => {
  const { intl: { formatMessage }, initialValues, operation } = props
  const errors = {}
  if (inventoryAdjustmentDetails) {
    if (!inventoryAdjustmentDetails.get('consumableId') ||
      inventoryAdjustmentDetails.get('consumableId') <= 0) {
      errors.consumableId = formatMessage(messages.consumableRequired)
    }
    if (inventoryAdjustmentDetails.get('canExpire') &&
      !inventoryAdjustmentDetails.get('expiresOn')) {
      errors.expiresOn = formatMessage(messages.expiryDateRequired)
    }
    if ([removeOperation, transferOperation, receiveOperation].includes(operation) &&
      (!inventoryAdjustmentDetails.get('fromSiteId') ||
       inventoryAdjustmentDetails.get('fromSiteId') <= 0)) {
      errors.fromSiteId = formatMessage(messages.siteRequired)
    }
    if ([addOperation, transferOperation, receiveOperation].includes(operation) &&
      (!inventoryAdjustmentDetails.get('toSiteId') ||
       inventoryAdjustmentDetails.get('toSiteId') <= 0)) {
      errors.toSiteId = formatMessage(messages.siteRequired)
    }
    if ([transferOperation, receiveOperation].includes(operation) && !errors.toSiteId &&
      inventoryAdjustmentDetails.get('fromSiteId') === inventoryAdjustmentDetails.get('toSiteId')) {
      errors.toSiteId = formatMessage(messages.siteShouldBeDifferent)
    }
    if (!inventoryAdjustmentDetails.get('quantity') ||
      inventoryAdjustmentDetails.get('quantity') <= 0) {
      errors.quantity = formatMessage(messages.quantityRequired, { operation })
    } else if ([removeOperation, transferOperation].includes(operation) &&
      inventoryAdjustmentDetails.get('quantity') > initialValues.get('quantityOnHand')) {
      errors.quantity = formatMessage(messages.positiveQuantityRequired,
        { operation, currentQuantity: initialValues.get('quantityOnHand') })
    }
    if (operation === removeOperation &&
      (!inventoryAdjustmentDetails.get('reasonId') ||
      inventoryAdjustmentDetails.get('reasonId') <= 0)) {
      errors.reasonId = formatMessage(messages.reasonRequired)
    }
    const selectedReason = props.consumableReasons.items.find(
      reason => reason.get('id') === inventoryAdjustmentDetails.get('reasonId'))
    if (operation === removeOperation && selectedReason &&
      selectedReason.get('i18nKey') === testConductedReasonI18nKey) {
      if (!inventoryAdjustmentDetails.get('dateAdjustedFrom')) {
        errors.dateAdjustedFrom = formatMessage(messages.dateRequired)
      }
      if (!inventoryAdjustmentDetails.get('dateAdjustedTo')) {
        errors.dateAdjustedTo = formatMessage(messages.dateRequired)
      } else if (inventoryAdjustmentDetails.get('dateAdjustedFrom') > inventoryAdjustmentDetails.get('dateAdjustedTo')) {
        errors.dateAdjustedTo = formatMessage(messages.dateFromAfterDateTo)
      }
    } else if (!inventoryAdjustmentDetails.get('dateAdjusted')) {
      errors.dateAdjusted = formatMessage(messages.dateRequired)
    }
  }
  return errors
}

export default _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'inventoryAdjustment',
    validate
  })
)(InventoryAdjustmentForm)
