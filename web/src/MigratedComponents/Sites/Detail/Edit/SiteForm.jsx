import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Card from '@mui/material/Card'

import { EditableFieldsFormContainer } from './EditableFieldsForm'
import messages from '../messages'
import { Site } from '../../../../site/SiteRedux'

import styles from '../SiteDetail.css'

const cssClasses = classnames.bind(styles)

const SiteForm = props => {
  const handleSubmit = async data => {
    const { site, onSubmit, updateLatLongFromFormAddress } = props
    if (!data.get('longitude') || !data.get('latitude')) {
      await updateLatLongFromFormAddress()
    }
    return onSubmit(site.get('id'))
  }
  const { site, siteTags, formatMessage, onSiteTagChange, updateLatLongFromFormAddress } = props
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
    externalId: formatMessage(messages.fieldExternalId),
    timezone: formatMessage(messages.fieldTimeZone),
    address: formatMessage(messages.fieldAddress),
    address2: formatMessage(messages.fieldAddress2),
    city: formatMessage(messages.fieldCity),
    zip: formatMessage(messages.fieldZip),
    longitude: formatMessage(messages.fieldLongitude),
    latitude: formatMessage(messages.fieldLatitude),
    tags: formatMessage(messages.fieldTags),
    noMatch: formatMessage(messages.fieldNoMatchTags),
  }
  return (
    <div>
      <section className={cssClasses('Section', 'Section--first')}>
        <Card className={cssClasses('Section__Content')}>
          <EditableFieldsFormContainer
            formatMessage={formatMessage}
            labels={labels}
            id={site.get('id')}
            enableReinitialize
            initialValues={initialValues}
            siteTags={siteTags}
            onSubmit={handleSubmit}
            onSiteTagChange={onSiteTagChange}
            updateLatLongFromFormAddress={updateLatLongFromFormAddress}
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
  updateLatLongFromFormAddress: PropTypes.func.isRequired,
  site: PropTypes.objectOf(Site).isRequired,
  siteTags: PropTypes.arrayOf(PropTypes.object),
}
SiteForm.defaultProps = {
  siteTags: [],
}

export default SiteForm
