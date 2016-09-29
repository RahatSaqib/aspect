// Imports from packages
import _ from 'lodash'
import React from 'react'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Material-UI
import Paper from 'material-ui/Paper'
import LinearProgress from 'material-ui/LinearProgress'

// Our own imports
import { isEditable } from '../../../../selectors/site'
import {
  fetchSingleSite
} from '../../../../action_creators/site_creators'
import ReadOnlyFields from '../../../shared/ReadOnlyFields'
import { FormContainer } from './SiteForm'
import styles from './SiteDetail.css'

const messages = defineMessages({
  title: {
    id: 'pages.SiteDetail.title',
    defaultMessage: 'Site Detail'
  },
  fieldName: {
    id: 'pages.SiteDetail.fieldName',
    defaultMessage: 'Name'
  },
  fieldShortname: {
    id: 'pages.SiteDetail.fieldShortname',
    defaultMessage: 'Shortname'
  },
  fieldTimeZone: {
    id: 'pages.SiteDetail.fieldTimeZone',
    defaultMessage: 'Time Zone'
  },
  fieldState: {
    id: 'pages.SiteDetail.fieldState',
    defaultMessage: 'State'
  },
  fieldCountry: {
    id: 'pages.SiteDetail.fieldCountry',
    defaultMessage: 'Country'
  },
  fieldLGA: {
    id: 'pages.SiteDetail.fieldLGA',
    defaultMessage: 'LGA'
  },
  fieldAddress: {
    id: 'pages.SiteDetail.fieldAddress',
    defaultMessage: 'Address'
  },
  fieldAddress2: {
    id: 'pages.SiteDetail.fieldAddress2',
    defaultMessage: 'Address 2'
  },
  fieldCity: {
    id: 'pages.SiteDetail.fieldCity',
    defaultMessage: 'City'
  },
  fieldZip: {
    id: 'pages.SiteDetail.fieldZip',
    defaultMessage: 'Zip'
  }
})

export class SiteDetail extends React.PureComponent {

  handleFetchSite = () => {
    this.props.fetchSingleSite(this.props.params.siteId)
  }

  handleSubmit = data => {
    const { site } = this.props

    this.props.updateSingleDevice(site.get('id'), {
      // Map form fields to API fields
      name: data.get('name'),
      shortname: data.get('shortName'),
      notes: data.get('notes'),
      siteId: data.get('site')
    })
  }

  componentDidMount() {
    this.handleFetchSite()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.siteId !== nextProps.params.siteId) {
      this.handleFetchSite()
    }
  }

  renderProgress() {
    const { site } = this.props

    return !site && <LinearProgress />
  }

  renderFormContainer() {
    const { site, intl: { formatMessage } } = this.props
    const labels = {
      name: formatMessage(messages.fieldName),
      shortName: formatMessage(messages.fieldShortname),
      timezone: formatMessage(messages.fieldTimeZone),
      country: formatMessage(messages.fieldCountry),
      state: formatMessage(messages.fieldState),
      lga: formatMessage(messages.fieldLGA),
      address: formatMessage(messages.fieldAddress),
      address2: formatMessage(messages.fieldAddress2),
      city: formatMessage(messages.fieldCity),
      zip: formatMessage(messages.fieldZip)
    }
    const initialValues = {
      // Map API fields to form fields
      name: site.get('name'),
      shortName: site.get('shortname'),
      timezone: site.get('timezone'),
      country: site.get('country'),
      state: site.get('state'),
      lga: site.get('lga'),
      address: site.get('street1'),
      address2: site.get('street2'),
      city: site.get('city'),
      zip: site.get('zip')
    }
    return (
      <FormContainer
        labels={labels}
        enableReinitialize
        initialValues={initialValues}
        onSubmit={this.handleSubmit}
      />
    )
  }

  renderReadOnlyFields() {
    const { site, intl: { formatMessage } } = this.props
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

  renderContent() {
    const { site, editable } = this.props
    if (!site) {
      return
    }
    return (
      <div className={styles.FieldsContainer}>
        {editable ?
        this.renderFormContainer() :
        this.renderReadOnlyFields()}
      </div>
    )
  }

  render() {
    const { formatMessage } = this.props.intl

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <Paper>
          {this.renderProgress()}
          {this.renderContent()}
        </Paper>
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  const site = state.site.items.byId.get(props.params.siteId)

  return {
    editable: isEditable(state.user, site),
    site
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSingleSite
  }, dispatch)
}

export const SiteDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(SiteDetail)
