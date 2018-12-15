// Imports from packages
import _fp from 'lodash/fp'
import PropTypes from 'prop-types'
import React from 'react'
import { compose, pure, setPropTypes } from 'recompose'
import { defineMessages, intlShape } from 'react-intl'

// Material-UI
import Button from '@material-ui/core/Button'
import Dialog from 'material-ui/Dialog'

// Our own imports
import recomposeForm from '../../components/recomposeForm'
import CountrySelectField from '../../filter/geography/CountrySelectField'
import PartnerSelectField from '../../filter/partner/PartnerSelectField'
import SiteSelectField from '../../filter/resource/SiteSelectField'
import DeviceSelectField from '../../filter/resource/DeviceSelectField'

const messages = defineMessages({
  cancel: {
    id: 'pages.DeviceApiKeyList.cancel',
    defaultMessage: 'Cancel',
  },
  assign: {
    id: 'pages.DeviceApiKeyList.assign',
    defaultMessage: 'Assign',
  },
  assignerDialogTitle: {
    id: 'pages.DeviceApiKeyList.assignerDialogTitle',
    defaultMessage: 'Assign {count} Keys',
  },
  countryId: {
    id: 'pages.DeviceApiKeyList.countryId',
    defaultMessage: 'Country',
  },
  partnerId: {
    id: 'pages.DeviceApiKeyList.partnerId',
    defaultMessage: 'Partner',
  },
  siteId: {
    id: 'pages.DeviceApiKeyList.siteId',
    defaultMessage: 'Site',
  },
  deviceId: {
    id: 'pages.DeviceApiKeyList.deviceId',
    defaultMessage: 'Device',
  },
})

const enhance = compose(
  pure,
  setPropTypes({
    isDialogOpen: PropTypes.bool.isRequired,
    count: PropTypes.number.isRequired,
    onCancel: PropTypes.func,
    values: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
  }),
  recomposeForm({
    fields: [
      {
        fieldName: 'countryId',
        valueFromChangeEvent: _fp.identity,
      },
      {
        fieldName: 'partnerId',
        valueFromChangeEvent: _fp.identity,
      },
      {
        fieldName: 'siteId',
        valueFromChangeEvent: _fp.identity,
      },
      {
        fieldName: 'deviceId',
        valueFromChangeEvent: _fp.identity,
      },
    ],
    validate() {
      const errors = {}
      return errors
    },
  })
)

export function DeviceApiKeyAssignerDialogForm({
  isDialogOpen,
  count,
  onCancel,
  onCountryIdChange,
  onPartnerIdChange,
  onSiteIdChange,
  onDeviceIdChange,
  handleSubmit,
  form,
  meta,
  values,
  intl,
}) {
  const { formatMessage } = intl

  const actions = [
    <Button type="button" color="secondary" onClick={onCancel}>
      {intl.formatMessage(messages.cancel)}
    </Button>,
    <Button
      disabled={form.pristine || !form.valid || form.submitting}
      onClick={handleSubmit}
      type="button"
      color="primary"
    >
      {intl.formatMessage(messages.assign)}
    </Button>,
  ]
  return (
    <Dialog
      title={formatMessage(messages.assignerDialogTitle, { count })}
      actions={actions}
      open={isDialogOpen}
      onRequestClose={onCancel}
      autoScrollBodyContent
    >
      <form>
        <CountrySelectField
          name="countryId"
          floatingLabelText={formatMessage(messages.countryId)}
          allItemText=""
          countryId={values.countryId}
          onCountryIdChange={onCountryIdChange}
          errorStyle={{
            float: 'left',
            whiteSpace: 'nowrap',
            textOverflow: 'visible',
          }}
          errorText={meta.countryId.touched && meta.countryId.error}
          fullWidth
          tabIndex="0"
          aria-haspopup
        />
        <PartnerSelectField
          name="partnerId"
          floatingLabelText={formatMessage(messages.partnerId)}
          emptyId="-1"
          emptyText=""
          partnerId={values.partnerId}
          onChangePartner={onPartnerIdChange}
          errorStyle={{
            float: 'left',
            whiteSpace: 'nowrap',
            textOverflow: 'visible',
          }}
          errorText={meta.partnerId.touched && meta.partnerId.error}
          fullWidth
          tabIndex="0"
          aria-haspopup
        />
        <SiteSelectField
          name="siteId"
          floatingLabelText={formatMessage(messages.siteId)}
          countryId={values.countryId}
          partnerId={values.partnerId}
          value={values.siteId}
          onSiteChange={onSiteIdChange}
          errorStyle={{
            float: 'left',
            whiteSpace: 'nowrap',
            textOverflow: 'visible',
          }}
          errorText={meta.siteId.touched && meta.siteId.error}
          fullWidth
          tabIndex="0"
          aria-haspopup
        />
        <DeviceSelectField
          name="deviceId"
          floatingLabelText={formatMessage(messages.deviceId)}
          countryId={values.countryId}
          partnerId={values.partnerId}
          siteId={values.siteId}
          value={values.deviceId}
          onDeviceChange={onDeviceIdChange}
          errorStyle={{
            float: 'left',
            whiteSpace: 'nowrap',
            textOverflow: 'visible',
          }}
          errorText={meta.deviceId.touched && meta.deviceId.error}
          fullWidth
          tabIndex="0"
          aria-haspopup
        />
      </form>
    </Dialog>
  )
}

export default enhance(DeviceApiKeyAssignerDialogForm)
