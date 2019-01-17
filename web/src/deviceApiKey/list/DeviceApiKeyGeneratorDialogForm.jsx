// Imports from packages
import _fp from 'lodash/fp'
import PropTypes from 'prop-types'
import React from 'react'
import { compose, pure, setPropTypes } from 'recompose'
import { defineMessages, intlShape } from 'react-intl'

// Material-UI
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'

// Our own imports
import recomposeForm, { errorProps } from '../../components/recomposeForm'
import CountrySelectField from '../../filter/geography/CountrySelectField'
import PartnerSelectField from '../../filter/partner/PartnerSelectField'
import SiteSelectField from '../../filter/resource/SiteSelectField'
import AspectDialog from '../../components/shared/AspectDialog'

const messages = defineMessages({
  cancel: {
    id: 'pages.DeviceApiKeyList.cancel',
    defaultMessage: 'Cancel',
  },
  generate: {
    id: 'pages.DeviceApiKeyList.generate',
    defaultMessage: 'Generate',
  },
  generatorDialogTitle: {
    id: 'pages.DeviceApiKeyList.generatorDialogTitle',
    defaultMessage: 'Device API Keys Generator',
  },
  count: {
    id: 'pages.DeviceApiKeyList.count',
    defaultMessage: 'Count (1-100)',
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
})

const enhance = compose(
  pure,
  setPropTypes({
    onCancel: PropTypes.func,
    isDialogOpen: PropTypes.bool.isRequired,
    values: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
  }),
  recomposeForm({
    fields: [
      {
        fieldName: 'count',
        valueFromChangeEvent(event) {
          const count = event.target.value
          return _fp.min([_fp.max([1, count]), 100])
        },
      },
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
    ],
    validate() {
      const errors = {}
      return errors
    },
  })
)

const errorStyle = {
  float: 'left',
  whiteSpace: 'nowrap',
  textOverflow: 'visible',
}

export function DeviceApiKeyGeneratorDialogForm({
  isDialogOpen,
  onCancel,
  onCountChange,
  onCountryIdChange,
  onPartnerIdChange,
  onSiteIdChange,
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
      {intl.formatMessage(messages.generate)}
    </Button>,
  ]
  return (
    <AspectDialog
      title={formatMessage(messages.generatorDialogTitle)}
      actions={actions}
      open={isDialogOpen}
      onRequestClose={onCancel}
      autoScrollBodyContent
    >
      <form>
        <TextField
          fullWidth
          name="count"
          type="number"
          label={formatMessage(messages.count)}
          InputLabelProps={{
            shrink: undefined,
          }}
          errorStyle={errorStyle}
          {...errorProps(meta.count)}
          value={values.count}
          onChange={onCountChange}
        />
        <CountrySelectField
          name="countryId"
          floatingLabelText={formatMessage(messages.countryId)}
          allItemText=""
          countryId={values.countryId}
          onCountryIdChange={onCountryIdChange}
          errorStyle={errorStyle}
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
          errorStyle={errorStyle}
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
          errorStyle={errorStyle}
          errorText={meta.siteId.touched && meta.siteId.error}
          fullWidth
          tabIndex="0"
          aria-haspopup
        />
      </form>
    </AspectDialog>
  )
}

export default enhance(DeviceApiKeyGeneratorDialogForm)
