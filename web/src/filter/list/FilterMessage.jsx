// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import {
  injectIntl,
  intlShape
} from 'react-intl'
import { connect } from 'react-redux'

import {
  getFilterMessage
} from '../utils'
import { ListFilter } from '../../filter/FilterRedux'
import { Assay } from '../../assay/AssayRedux'
import { Consumable } from '../../consumable/ConsumableRedux'
import { SelectListItems } from '../../site/SiteRedux'


export const FilterMessage = ({
  intl: { formatMessage, formatDate },
  listFilter,
  countries,
  assay,
  consumable,
  siteItemsById,
  partnerItems,
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
      partnerItems,
      workflowStatusItems,
      deviceStatusItems)
    }
  </span>
)

FilterMessage.propTypes = {
  intl: intlShape.isRequired,
  listFilter: PropTypes.objectOf(ListFilter).isRequired,
  countries: PropTypes.shape({
    laoding: PropTypes.bool,
    items: PropTypes.object.isRequired, // eslint-disable-line
  }).isRequired,
  assay: PropTypes.objectOf(Assay).isRequired,
  consumable: PropTypes.objectOf(Consumable).isRequired,
  siteItemsById: PropTypes.objectOf(SelectListItems).isRequired,
  partnerItems: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    jobFunctions: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string
    }))
  }).isRequired,
  workflowStatusItems: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string
  }),
  deviceStatusItems: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string
  }).isRequired,
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
    partnerItems: state.jobs.partnersAndJobFunctionsForSelectList.partners,
    workflowStatusItems: state.resultWorkflowStatus.items,
    deviceStatusItems: state.deviceStatus.items,
  }
}

export default _.flowRight(
  injectIntl,
  connect(mapStateToProps, null)
)(FilterMessage)
