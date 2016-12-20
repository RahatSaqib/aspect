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
    defaultMessage: '(Current Quantity on Hand: {quantityOnHand} {unitShortName})'
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
    defaultMessage: 'Please specify the quantity that you wish to {operation}'
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
    operation: PropTypes.oneOf([addOperation, removeOperation, transferOperation]),
    updating: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    changeFieldValue: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    fetchSitesForSelectList: PropTypes.func.isRequired,
    fetchConsumableReasons: PropTypes.func.isRequired,
    consumableReasons: PropTypes.object.isRequired,
    sitesSelectList: PropTypes.object.isRequired
  }

  state = {
    selectedReasonKey: null
  }

  componentDidMount() {
    const { fetchSitesForSelectList, fetchConsumableReasons } = this.props
    fetchSitesForSelectList()
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

  handleQuantityChanged = (event, value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      this.props.changeFieldValue('inventoryAdjustment', 'quantity', value)
    }
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
          <TextInput
            name="quantity" label={quantityLabel} disabled={updating}
            style={formFieldStyle} inputStyle={{ textAlign: 'right' }}
            onChange={this.handleQuantityChanged}
          />
          { initialValues.get('unitShortName') }
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
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
    consumableReasons: state.consumable.get('consumableReasons'),
    sitesSelectList: state.site.get('selectList')
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSitesForSelectList,
    fetchConsumableReasons,
    changeFieldValue
  }, dispatch)
}

const validate = (inventoryAdjustmentDetails, props) => {
  const { intl: { formatMessage }, operation } = props
  const errors = {}
  if (inventoryAdjustmentDetails) {
    if (inventoryAdjustmentDetails.get('canExpire') &&
      !inventoryAdjustmentDetails.get('expiresOn')) {
      errors.expiresOn = formatMessage(messages.expiryDateRequired)
    }
    if ([removeOperation, transferOperation].includes(operation) &&
      (!inventoryAdjustmentDetails.get('fromSiteId') ||
       inventoryAdjustmentDetails.get('fromSiteId') <= 0)) {
      errors.fromSiteId = formatMessage(messages.siteRequired)
    }
    if ([addOperation, transferOperation].includes(operation) &&
      (!inventoryAdjustmentDetails.get('toSiteId') ||
       inventoryAdjustmentDetails.get('toSiteId') <= 0)) {
      errors.toSiteId = formatMessage(messages.siteRequired)
    }
    if (operation === transferOperation && !errors.toSiteId &&
      inventoryAdjustmentDetails.get('fromSiteId') === inventoryAdjustmentDetails.get('toSiteId')) {
      errors.toSiteId = formatMessage(messages.siteShouldBeDifferent)
    }
    if (!inventoryAdjustmentDetails.get('quantity') ||
      inventoryAdjustmentDetails.get('quantity') <= 0) {
      errors.quantity = formatMessage(messages.quantityRequired, { operation })
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
