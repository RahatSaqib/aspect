import React from 'react'
import { Button, TextField } from '@mui/material'
import _fp from 'lodash/fp'
import PropTypes from 'prop-types'
import { defineMessages, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { compose, pure, setPropTypes, lifecycle } from 'recompose'
import { SiteSelect } from '../../../components'
import CountrySelectField from '../../../components/Geography/CountrySelectFieldOld'
import PartnerSelectField from '../../../components/partner/PartnerSelectField'
import recomposeForm, { errorProps } from '../../../components/recomposeForm'
import AspectDialog from '../../../components/shared/AspectDialog'
import { fetchCountriesForLocationSelector, LazyLoadItems } from '../../../store/GeographyRedux'
import { fetchPartnersAndJobFunctionsForSelectList } from '../../../store/JobRedux'
import PropTypeOf from '../../../utils/types'

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
  countryRequired: {
    id: 'pages.DeviceApiKeyList.countryRequired',
    defaultMessage: 'Please select a country',
  },
  partnerRequired: {
    id: 'pages.DeviceApiKeyList.partnerRequired',
    defaultMessage: 'Please select a partner',
  },
})

const getInitialValues = (partnerList, countries) => ({
  count: 1,
  partnerId: partnerList && partnerList.size > 0 ? partnerList.first().get('id') : null,
  countryId: countries && countries.items && countries.items.size > 0 ? countries.items.first().get('id') : null,
})

const enhance = compose(
  injectIntl,
  pure,
  connect(
    state => {
      const countries = state.geography.countriesForLocationSelector
      const partnerList = state.jobs.partnersAndJobFunctionsForSelectList.partners
      return {
        partnerList,
        countries,
      }
    },
    {
      fetchCountriesForLocationSelector,
      fetchPartnersAndJobFunctionsForSelectList,
    }
  ),
  lifecycle({
    UNSAFE_componentWillReceiveProps() {
      const { partnerList, countries } = this.props

      const onChange = values => this.setState({ values })
      this.setState({
        onChange,
        values: getInitialValues(partnerList, countries),
      })
    },
    componentDidMount() {
      const { countries, partnerList } = this.props
      if (!countries || countries.items.size === 0) {
        this.props.fetchCountriesForLocationSelector(countries)
      }
      if (!partnerList || partnerList.size === 0) {
        this.props.fetchPartnersAndJobFunctionsForSelectList()
      }
    },
  }),
  setPropTypes({
    onCancel: PropTypes.func,
    isDialogOpen: PropTypes.bool.isRequired,
    values: PropTypes.object.isRequired,
    intl: PropTypeOf.intl.isRequired,
    countries: PropTypes.objectOf(LazyLoadItems).isRequired,
    fetchCountriesForLocationSelector: PropTypes.func.isRequired,
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
        valueFromChangeEvent: event => event.target.value,
      },
    ],
    validate({ countryId, partnerId }, { intl }) {
      const errors = {}
      if (!countryId) {
        errors.countryId = intl.formatMessage(messages.countryRequired)
      }

      if (!partnerId) {
        errors.partnerId = intl.formatMessage(messages.partnerRequired)
      }

      return errors
    },
  })
)

const errorStyle = {
  float: 'left',
  whiteSpace: 'nowrap',
  textOverflow: 'visible',
}

function DeviceApiKeyGeneratorDialogForm({
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
    <Button disabled={!form.valid || form.submitting} onClick={handleSubmit} type="button" color="primary">
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
        <SiteSelect
          id="siteId"
          name="siteId"
          label={formatMessage(messages.siteId)}
          value={values.siteId || ''}
          onChange={onSiteIdChange}
          error={meta.siteId.touched && meta.siteId.error}
        />
      </form>
    </AspectDialog>
  )
}

export default enhance(DeviceApiKeyGeneratorDialogForm)
