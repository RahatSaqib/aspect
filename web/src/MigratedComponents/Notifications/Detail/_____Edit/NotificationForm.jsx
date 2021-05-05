import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Card from '@material-ui/core/Card'

import { EditableFieldsFormContainer } from './EditableFieldsForm'
import messages from '../messages'
// import { Site } from '../../../../site/SiteRedux'

const cssClasses = classnames.bind(require('../SiteDetail.css'))

const NotificationForm = props => {
  const handleSubmit = async data => {
    const { notification, onSubmit, updateLatLongFromFormAddress } = props
    if (!data.get('longitude') || !data.get('latitude')) {
      await updateLatLongFromFormAddress()
    }
    return onSubmit(notification.get('id'))
  }
  const {
    notification,
    notificationTags,
    formatMessage,
    onNotificationTagChange,
    updateLatLongFromFormAddress,
  } = props
  const extraValuesForMap = {
    // // SiteLocationFormMap reads the values from redux-form to construct names for Geocoder
    // country: notification.get('country'),
    // state: notification.get('state'),
    // lga: notification.get('lga'),
  }
  const initialValues = {
    ...extraValuesForMap,
    // // Map API fields to form fields
    // name: notification.get('name'),
    // shortName: notification.get('shortName'),
    // externalId: notification.get('externalId') || '',
    // timezone: notification.get('timezone') || /* FIXME */ '',
    // countryId: notification.get('countryId'),
    // stateId: notification.get('stateId'),
    // lgaId: notification.get('lgaId'),
    // address: notification.get('street1'),
    // address2: notification.get('street2') || /* FIXME */ '',
    // city: notification.get('city'),
    // zip: notification.get('zip'),
    // id: notification.get('id'),
    // longitude: notification.get('longitude'),
    // latitude: notification.get('latitude'),
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
    noMatch: formatMessage(messages.fieldNoMatchTags),
  }
  return (
    <div>
      <section className={cssClasses('Section', 'Section--first')}>
        <Card className={cssClasses('Section__Content')}>
          <EditableFieldsFormContainer
            formatMessage={formatMessage}
            labels={labels}
            id={notification.id}
            enableReinitialize
            initialValues={initialValues}
            notificationTags={notificationTags}
            onSubmit={handleSubmit}
            onSiteTagChange={onNotificationTagChange}
            updateLatLongFromFormAddress={updateLatLongFromFormAddress}
          />
        </Card>
      </section>
    </div>
  )
}

NotificationForm.propTypes = {
  formatMessage: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onNotificationTagChange: PropTypes.func.isRequired,
  updateLatLongFromFormAddress: PropTypes.func.isRequired,
  notification: PropTypes.objectOf(PropTypes.object).isRequired,
  notificationTags: PropTypes.arrayOf(PropTypes.object),
}
NotificationForm.defaultProps = {
  notificationTags: [],
}

export default NotificationForm
