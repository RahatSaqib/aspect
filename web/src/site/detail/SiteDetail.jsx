// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { injectIntl } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Material-UI
import Paper from 'material-ui/Paper'
import LinearProgress from 'material-ui/LinearProgress'

// Our own imports
import isEditable from '../../shared/selectors/site'
import {
  fetchSingleSite,
  updateSingleSite,
  intlShape
} from '../SiteRedux'
import SiteForm from './SiteForm'
import SiteLocationFormMap from './SiteLocationFormMap'
import messages from './messages'
import styles from './SiteDetail.css'

/*
 * This page component renders a single site
 */
export class SiteDetail extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    intl: intlShape,
    fetchSingleSite: PropTypes.func.isRequired,
    site: PropTypes.object,
    updateSingleSite: PropTypes.func.isRequired,
    editable: PropTypes.bool.isRequired
  }

  componentWillMount() {
    const { setPageTitle, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
  }

  componentDidMount() {
    this.handleFetchSite(this.props)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.siteId !== nextProps.params.siteId) {
      this.handleFetchSite(nextProps)
    }
  }

  handleFetchSite = ({ params }) => {
    this.props.fetchSingleSite(params.siteId)
  }

  hasSiteWithLocation() {
    const { site } = this.props
    return site && site.has('longitude') && site.has('latitude')
  }

  render() {
    const {
      intl: { formatMessage },
      updateSingleSite,
      site, editable
    } = this.props

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <Paper>
          {!this.hasSiteWithLocation() && <LinearProgress />}
          {this.hasSiteWithLocation() && (
            <div className={styles.FieldsContainer}>
              <SiteForm
                formatMessage={formatMessage}
                onSubmit={updateSingleSite}
                editable={editable}
                site={site}
              />
            </div>
          )}
          {this.hasSiteWithLocation() && (
            <SiteLocationFormMap
              editable={editable}
              site={site}
            />
          )}
        </Paper>
      </div>
    )
  }
}

function mapStateToProps(state, { params }) {
  const site = state.site.items.byId.get(params.siteId)

  return {
    editable: isEditable(state.user, site),
    site
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSingleSite,
    updateSingleSite
  }, dispatch)
}

export const SiteDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(SiteDetail)
