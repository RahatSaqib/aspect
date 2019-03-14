import PropTypes from 'prop-types'
import React from 'react'
import classnames from 'classnames/bind'
import Card from '@material-ui/core/Card'

import { EditableFieldsFormContainer } from './EditableFieldsForm'
import messages from '../messages'
import { Site } from '../../SiteRedux'
import SiteDetailBackBar from '../SiteDetailBackBar'

const cssClasses = classnames.bind(require('../SiteDetail.css'))

const SiteForm = props => {
  const handleSubmit = data => {
    const { site, onSubmit } = props

    onSubmit(site.get('id'), {
      // Map form fields to API fields
      name: data.get('name'),
      shortName: data.get('shortName'),
      externalId: data.get('externalId'),
      timezone: data.get('timezone'),
      countryId: data.get('countryId'),
      stateId: data.get('stateId'),
      lgaId: data.get('lgaId'),
      street1: data.get('address'),
      street2: data.get('address2'),
      city: data.get('city'),
      zip: data.get('zip'),
      longitude: data.get('longitude'),
      latitude: data.get('latitude'),
    })
  }
  const {
    site,
    siteTags,
    formatMessage,
    onSiteTagChange,
    onSetBasedAddressClick,
    history,
    location,
    match,
    disabled,
  } = props
  const extraValuesForMap = {
    // SiteLocationFormMap reads the values from redux-form to construct names for Geocoder
    country: site.get('country'),
    state: site.get('state'),
    lga: site.get('lga'),
  }
  const initialValues = {
    ...extraValuesForMap,
    // Map API fields to form fields
    name: site.get('name'),
    shortName: site.get('shortName'),
    externalId: site.get('externalId') || '',
    timezone: site.get('timezone') || /* FIXME */ '',
    countryId: site.get('countryId'),
    stateId: site.get('stateId'),
    lgaId: site.get('lgaId'),
    address: site.get('street1'),
    address2: site.get('street2') || /* FIXME */ '',
    city: site.get('city'),
    zip: site.get('zip'),
    id: site.get('id'),
    longitude: site.get('longitude'),
    latitude: site.get('latitude'),
  }
  const labels = {
    name: formatMessage(messages.fieldName),
    shortName: formatMessage(messages.fieldShortName),
    facilityCode: formatMessage(messages.fieldFacilityCode),
    externalId: formatMessage(messages.fieldExternalId),
    timezone: formatMessage(messages.fieldTimeZone),
    address: formatMessage(messages.fieldAddress),
    address2: formatMessage(messages.fieldAddress2),
    city: formatMessage(messages.fieldCity),
    zip: formatMessage(messages.fieldZip),
    longitude: formatMessage(messages.fieldLongitude),
    latitude: formatMessage(messages.fieldLatitude),
    tags: formatMessage(messages.fieldTags),
  }
  return (
    <div>
      {site && (
        <SiteDetailBackBar
          formatMessage={formatMessage}
          history={history}
          location={location}
          match={match}
          title={site.get('name')}
          disabled={disabled}
        />
      )}
      <section className={cssClasses('Section', 'Section--first')}>
        <Card className={cssClasses('Section__Content')}>
          <EditableFieldsFormContainer
            formatMessage={formatMessage}
            labels={labels}
            enableReinitialize
            initialValues={initialValues}
            siteTags={siteTags}
            onSubmit={handleSubmit}
            onSiteTagChange={onSiteTagChange}
            onSetBasedAddressClick={onSetBasedAddressClick}
          />
        </Card>
      </section>
    </div>
  )
}

SiteForm.propTypes = {
  formatMessage: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onSiteTagChange: PropTypes.func.isRequired,
  onSetBasedAddressClick: PropTypes.func.isRequired,
  site: PropTypes.objectOf(Site).isRequired,
  siteTags: PropTypes.arrayOf(PropTypes.object),
  history: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  location: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  match: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  disabled: PropTypes.bool.isRequired,
}
SiteForm.defaultProps = {
  siteTags: [],
}

export default SiteForm
