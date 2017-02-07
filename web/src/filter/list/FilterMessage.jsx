// Imports from packages
import _ from 'lodash'
import React, { PropTypes } from 'react'
import {
  injectIntl,
  intlShape
} from 'react-intl'
import { connect } from 'react-redux'

import {
  getFilterMessage
} from '../utils'

export const FilterMessage = ({
  intl: { formatMessage, formatDate },
  listFilter,
  countries,
  assay,
  consumable,
  siteItemsById,
  workflowStatusItems,
  deviceStatusItems,
  subject,
  filterTemplate,
  filterTemplateOptional
}) => (
  <span>{
    getFilterMessage(listFilter.toJS(),
      countries,
      assay,
      consumable,
      siteItemsById,
      subject,
      filterTemplate,
      filterTemplateOptional,
      formatMessage,
      formatDate,
      workflowStatusItems,
      deviceStatusItems)
    }
  </span>
)

FilterMessage.propTypes = {
  intl: intlShape.isRequired,
  listFilter: PropTypes.object.isRequired,
  countries: PropTypes.object.isRequired,
  assay: PropTypes.object.isRequired,
  consumable: PropTypes.object.isRequired,
  siteItemsById: PropTypes.object.isRequired,
  workflowStatusItems: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string
  }),
  deviceStatusItems: PropTypes.object.isRequired,
  subject: PropTypes.string,
  filterTemplate: PropTypes.string.isRequired,
  filterTemplateOptional: PropTypes.string,
}

FilterMessage.defaultProps = {
  workflowStatusItems: null,
  subject: '',
  filterTemplateOptional: ''
}

function mapStateToProps(state) {
  return {
    listFilter: state.filter.listFilter,
    countries: state.geography.countriesForLocationSelector,
    assay: state.assay,
    consumable: state.consumable.consumables,
    siteItemsById: state.site.items.byId,
    workflowStatusItems: state.resultWorkflowStatus.items,
    deviceStatusItems: state.deviceStatus.items
  }
}

export default _.flowRight(
  injectIntl,
  connect(mapStateToProps, null)
)(FilterMessage)
