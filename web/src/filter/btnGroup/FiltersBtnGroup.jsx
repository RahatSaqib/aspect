import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React, { Children } from 'react'
import { compose, pure } from 'recompose'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'
import { Button } from 'react-toolbox/lib/button'
import MdClose from 'react-icons/lib/md/close'

const cssClasses = classnames.bind(require('./FiltersBtnGroup.css'))

const EMPTY_CONTEXT = null
const EMPTY_MAP = Immutable.Map()

const messages = defineMessages({
  dateFrom: {
    id: 'filter.btnGroup.dateFrom',
    defaultMessage: 'after {date}',
  },
  dateTo: {
    id: 'filter.btnGroup.dateTo',
    defaultMessage: 'before {date}',
  },
  partnerId: {
    id: 'filter.btnGroup.partnerId',
    defaultMessage: 'partner "{partnerName}"',
  },
  patientOrResearchId: {
    id: 'filter.btnGroup.patientOrResearchId',
    defaultMessage: 'patient/study ID {patientOrResearchId}',
  },
  sampleId: {
    id: 'filter.btnGroup.sampleId',
    defaultMessage: 'sample {sampleId}',
  },
  sampleGroup: {
    id: 'filter.btnGroup.sampleGroup',
    defaultMessage: 'sample group {sampleGroup}',
  },
  whereDeviceNameIncludes: {
    id: 'filter.btnGroup.whereDeviceNameIncludes',
    defaultMessage: 'where device name includes "{deviceName}"',
  },
  withResultCategory: {
    id: 'filter.btnGroup.withResultCategory',
    defaultMessage: 'with result {resultCategoryName}',
  },
  whereSiteNameIncludes: {
    id: 'filter.btnGroup.whereSiteNameIncludes',
    defaultMessage: 'where site name includes "{siteName}"',
  },
  sampleOriginSite: {
    id: 'filter.btnGroup.sampleOriginSite',
    defaultMessage: 'sample origin site is {sampleOriginSiteName}',
  },
  whoseNameOrEmailIncludes: {
    id: 'filter.btnGroup.whoseNameOrEmailIncludes',
    defaultMessage: 'whose name/email includes "{contactNameOrEmail}"',
  },
  withWorkflowStatus: {
    id: 'filter.btnGroup.withWorkflowStatus',
    defaultMessage: 'with workflow status is {workflowStatusName}',
  },
  withDeviceStatus: {
    id: 'filter.btnGroup.withDeviceStatus',
    defaultMessage: 'with device status is {deviceStatusName}',
  },
  whereExternalIdIncludes: {
    id: 'filter.btnGroup.whereExternalIdIncludes',
    defaultMessage: 'where externalId includes "{externalId}"',
  },
})

const enhance = compose(
  pure,
  connect(
    state => ({
      siteItemsById: state.site.items.byId,
      countryItems: state.geography.countriesForLocationSelector.items,
      consumableItems: state.consumable.consumables.items,
      assayItems: state.assay.items,
      partnerItems: state.jobs.partnersAndJobFunctionsForSelectList.partners,
      workflowStatusItems: state.resultWorkflowStatus.items,
      deviceStatusItems: state.deviceStatus.items,
    }),
    null
  )
)

const filtersOrdering = {
  // Manually keep this in sync with the components ordering in FiltersPanel
  assayId: 4,
  countryId: 1,
  stateId: 2,
  lgaId: 3,
  minDate: 18,
  maxDate: 19,
  partnerId: 7,
  patientOrResearchId: 8,
  sampleId: 9,
  sampleGroup: 10,
  deviceName: 11,
  resultCategoryId: 5,
  siteName: 12,
  sampleOriginSite: 13,
  contactNameOrEmail: 14,
  consumableId: 6,
  workflowStatusId: 16,
  deviceStatusId: 17,
  externalId: 15,
}

const makeButton = labelFn => (props, filterKey) =>
  <Button
    key={filterKey}
    className={cssClasses('Button')}
    raised
    onClick={() => props.onRemoveFilterItem(filterKey)}
  >
    {labelFn(props, props.filters[filterKey])}
    <MdClose className={cssClasses('Button__icon')} />
  </Button>

const buttonBy = {
  assayId: makeButton(({ assayItems }, assayId) =>
    assayItems
      .find(it => it.get('id') === assayId, EMPTY_CONTEXT, EMPTY_MAP)
      .get('name')
  ),
  countryId: makeButton(({ countryItems }, countryId) =>
    countryItems
      .find(it => it.id === countryId, EMPTY_CONTEXT, EMPTY_MAP)
      .get('name')
  ),
  stateId: makeButton(({ countryItems, filters }, stateId) =>
    countryItems
      .find(it => it.id === filters.countryId, EMPTY_CONTEXT, EMPTY_MAP)
      .getIn(['children', 'items'], EMPTY_MAP)
      .find(it => it.id === stateId, EMPTY_CONTEXT, EMPTY_MAP)
      .get('name')
  ),
  lgaId: makeButton(({ countryItems, filters }, lgaId) =>
    countryItems
      .find(it => it.id === filters.countryId, EMPTY_CONTEXT, EMPTY_MAP)
      .getIn(['children', 'items'], EMPTY_MAP)
      .find(it => it.id === filters.stateId, EMPTY_CONTEXT, EMPTY_MAP)
      .getIn(['children', 'items'], EMPTY_MAP)
      .find(it => it.id === lgaId, EMPTY_CONTEXT, EMPTY_MAP)
      .get('name')
  ),
  minDate: makeButton(({ intl }, date) =>
    intl.formatMessage(messages.dateFrom, { date: intl.formatDate(date) })
  ),
  maxDate: makeButton(({ intl }, date) =>
    intl.formatMessage(messages.dateTo, { date: intl.formatDate(date) })
  ),
  partnerId: makeButton(({ intl, partnerItems }, partnerId) =>
    intl.formatMessage(messages.partnerId, {
      partnerName: partnerItems
        .find(it => it.get('id') === partnerId, EMPTY_CONTEXT, EMPTY_MAP)
        .get('name'),
    })
  ),
  patientOrResearchId: makeButton(({ intl }, patientOrResearchId) =>
    intl.formatMessage(messages.patientOrResearchId, { patientOrResearchId })
  ),
  sampleId: makeButton(({ intl }, sampleId) =>
    intl.formatMessage(messages.sampleId, { sampleId })
  ),
  sampleGroup: makeButton(({ intl }, sampleGroup) =>
    intl.formatMessage(messages.sampleGroup, { sampleGroup })
  ),
  deviceName: makeButton(({ intl }, deviceName) =>
    intl.formatMessage(messages.whereDeviceNameIncludes, {
      deviceName,
    })
  ),
  resultCategoryId: makeButton(
    ({ intl, filters, assayItems }, resultCategoryId) =>
      intl.formatMessage(messages.withResultCategory, {
        resultCategoryName: assayItems
          .find(
            it => it.get('id') === filters.assayId,
            EMPTY_CONTEXT,
            EMPTY_MAP
          )
          .get('resultCategories', EMPTY_MAP)
          .find(
            it => it.get('id') === resultCategoryId,
            EMPTY_CONTEXT,
            EMPTY_MAP
          )
          .get('name', ''),
      })
  ),
  siteName: makeButton(({ intl }, siteName) =>
    intl.formatMessage(messages.whereSiteNameIncludes, {
      siteName,
    })
  ),
  sampleOriginSite: makeButton(({ intl, siteItemsById }, sampleOriginSiteId) =>
    intl.formatMessage(messages.sampleOriginSite, {
      sampleOriginSiteName: siteItemsById
        .valueSeq()
        .find(
          it => it.get('id') === sampleOriginSiteId,
          EMPTY_CONTEXT,
          EMPTY_MAP
        )
        .get('name'),
    })
  ),
  contactNameOrEmail: makeButton(({ intl }, contactNameOrEmail) =>
    intl.formatMessage(messages.whoseNameOrEmailIncludes, {
      contactNameOrEmail,
    })
  ),
  consumableId: makeButton(({ consumableItems }, consumableId) =>
    consumableItems
      .find(it => it.id === consumableId, EMPTY_CONTEXT, EMPTY_MAP)
      .get('name')
  ),
  workflowStatusId: makeButton(
    ({ intl, workflowStatusItems }, workflowStatusId) =>
      intl.formatMessage(messages.withWorkflowStatus, {
        workflowStatusName: workflowStatusItems
          .find(
            it => it.get('id') === workflowStatusId,
            EMPTY_CONTEXT,
            EMPTY_MAP
          )
          .get('name'),
      })
  ),
  deviceStatusId: makeButton(({ intl, deviceStatusItems }, deviceStatusId) =>
    intl.formatMessage(messages.withDeviceStatus, {
      deviceStatusName: deviceStatusItems
        .find(it => it.get('id') === deviceStatusId, EMPTY_CONTEXT, EMPTY_MAP)
        .get('name'),
    })
  ),
  externalId: makeButton(({ intl }, externalId) =>
    intl.formatMessage(messages.whereExternalIdIncludes, {
      externalId,
    })
  ),
}

const FiltersBtnGroup = ({ className, children, ...restProps }) =>
  <div className={cssClasses(className, 'FiltersBtnGroup')}>
    {Children.map(children, child =>
      React.cloneElement(child, {
        className: cssClasses('FiltersBtnGroup__Child'),
      })
    )}
    {Immutable.Map(restProps.filters)
      .keySeq()
      .sortBy(filterKey => filtersOrdering[filterKey])
      .map(filterKey => buttonBy[filterKey](restProps, filterKey))}
  </div>

export default enhance(FiltersBtnGroup)
