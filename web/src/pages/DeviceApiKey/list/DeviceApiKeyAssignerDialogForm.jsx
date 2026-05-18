import React from 'react'
import { Button } from '@mui/material'
import _fp from 'lodash/fp'
import PropTypes from 'prop-types'
import { defineMessages, injectIntl } from 'react-intl'
import { compose, pure, setPropTypes } from 'recompose'
import { SiteSelect } from '../../../components'
import CountrySelectFieldOld from '../../../components/geography/CountrySelectFieldOld'
import PartnerSelectField from '../../../components/partner/PartnerSelectField'
import recomposeForm from '../../../components/recomposeForm'
import DeviceSelectField from '../../../components/resource/DeviceSelectField'
import AspectDialog from '../../../components/shared/AspectDialog'
import PropTypeOf from '../../../utils/types'

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
  injectIntl,
  pure,
  setPropTypes({
    isDialogOpen: PropTypes.bool.isRequired,
    count: PropTypes.number.isRequired,
    onCancel: PropTypes.func,
    values: PropTypes.object.isRequired,
    intl: PropTypeOf.intl.isRequired,
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
        valueFromChangeEvent: event => event.target.value,
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

function DeviceApiKeyAssignerDialogForm({
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
    <AspectDialog
      title={formatMessage(messages.assignerDialogTitle, { count })}
      actions={actions}
      open={isDialogOpen}
      onRequestClose={onCancel}
      autoScrollBodyContent
    >
      <form>
        <CountrySelectFieldOld
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
        <SiteSelect
          id="siteId"
          name="siteId"
          label={formatMessage(messages.siteId)}
          value={values.siteId || ''}
          onChange={onSiteIdChange}
          error={meta.siteId.touched && meta.siteId.error}
        />
        {values.deviceApiKeyIds.length === 1 && (
          <DeviceSelectField
            disabled={!values.siteId}
            name="deviceId"
            floatingLabelText={formatMessage(messages.deviceId)}
            countryId={values.countryId}
            partnerId={values.partnerId}
            siteId={values.siteId || ''}
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
        )}
      </form>
    </AspectDialog>
  )
}

export default enhance(DeviceApiKeyAssignerDialogForm)
