import PropTypes from 'prop-types'
// Imports from packages
import React, { PureComponent } from 'react'

// Our own imports
import ReadOnlyFields from '../../components/shared/ReadOnlyFields'
import { EditableFieldsFormContainer } from './EditableFieldsForm'
import messages from './messages'

// If editable, it renders all editable fields in a form for a single site.
// Otherwise, it renders read only fields
export default class SiteForm extends PureComponent {

  static propTypes = {
    formatMessage: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    editable: PropTypes.bool.isRequired,
    site: PropTypes.object
  }

  static defaultProps = {
    site: null
  }

  handleSubmit = (data) => {
    const { site } = this.props

    this.props.onSubmit(site.get('id'), {
      // Map form fields to API fields
      name: data.get('name'),
      shortname: data.get('shortName'),
      externalId: data.get('externalId'),
      timezone: data.get('timezone'),
      countryId: data.get('countryId'),
      stateId: data.get('stateId'),
      lgaId: data.get('lgaId'),
      street1: data.get('address'),
      street2: data.get('address2'),
      city: data.get('city'),
      zip: data.get('zip'),
      longitude: data.get('lng'),
      latitude: data.get('lat')
    })
  }

  // this renders the fields in controls for a user who has write access
  renderEditableFieldsFormContainer() {
    const { site, formatMessage } = this.props
    const extraValuesForMap = {
      // SiteLocationFormMap reads the values from redux-form to construct names for Geocoder
      country: site.get('country'),
      state: site.get('state'),
      lga: site.get('lga')
    }
    const initialValues = {
      ...extraValuesForMap,
      // Map API fields to form fields
      name: site.get('name'),
      shortName: site.get('shortname'),
      externalId: site.get('externalId') || '',
      timezone: site.get('timezone') || /* FIXME */ '',
      countryId: site.get('countryId'),
      stateId: site.get('stateId'),
      lgaId: site.get('lgaId'),
      address: site.get('street1'),
      address2: site.get('street2') || /* FIXME */ '',
      city: site.get('city'),
      zip: site.get('zip')
    }
    const labels = {
      name: formatMessage(messages.fieldName),
      shortName: formatMessage(messages.fieldShortname),
      externalId: formatMessage(messages.fieldExternalId),
      timezone: formatMessage(messages.fieldTimeZone),
      address: formatMessage(messages.fieldAddress),
      address2: formatMessage(messages.fieldAddress2),
      city: formatMessage(messages.fieldCity),
      zip: formatMessage(messages.fieldZip)
    }
    return (
      <EditableFieldsFormContainer
        labels={labels}
        enableReinitialize
        initialValues={initialValues}
        onSubmit={this.handleSubmit}
      />
    )
  }

  // these are the same fields in read only mode in case the user has read access only
  renderReadOnlyFields() {
    const { site, formatMessage } = this.props
    const fields = [
      {
        label: formatMessage(messages.fieldName),
        value: site.get('name')
      },
      {
        label: formatMessage(messages.fieldShortname),
        value: site.get('shortname')
      },
      {
        label: formatMessage(messages.fieldExternalId),
        value: site.get('externalId')
      },
      {
        label: formatMessage(messages.fieldTimeZone),
        value: site.get('timezone')
      },
      {
        label: formatMessage(messages.fieldCountry),
        value: site.get('country')
      },
      {
        label: formatMessage(messages.fieldState),
        value: site.get('state')
      },
      {
        label: formatMessage(messages.fieldLGA),
        value: site.get('lga')
      },
      {
        label: formatMessage(messages.fieldAddress),
        value: site.get('street1')
      },
      {
        label: formatMessage(messages.fieldAddress2),
        value: site.get('street2')
      },
      {
        label: formatMessage(messages.fieldCity),
        value: site.get('city')
      },
      {
        label: formatMessage(messages.fieldZip),
        value: site.get('zip')
      }
    ]
    return (
      <ReadOnlyFields fields={fields} />
    )
  }

  render() {
    const { site, editable } = this.props
    if (site) {
      return (
        editable ?
        this.renderEditableFieldsFormContainer() :
        this.renderReadOnlyFields()
      )
    }

    return false
  }
}
