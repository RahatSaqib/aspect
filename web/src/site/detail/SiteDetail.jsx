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
import { isEditable } from '../../selectors/site'
import {
  fetchSingleSite,
  updateSingleSite
} from '../../action_creators/site_creators'
import SiteForm from './SiteForm'
import SiteLocationFormMap from './SiteLocationFormMap'
import messages from './messages'
import styles from './SiteDetail.css'

/*
 * This page component renders a single site
 */
export class SiteDetail extends PureComponent {

  static propTypes = {
    params: PropTypes.object.isRequired
  }

  handleFetchSite = ({ params }) => {
    this.props.fetchSingleSite(params.siteId)
  }

  componentDidMount() {
    this.handleFetchSite(this.props)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.siteId !== nextProps.params.siteId) {
      this.handleFetchSite(nextProps)
    }
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
          {!site && <LinearProgress />}
          <div className={styles.FieldsContainer}>
            <SiteForm
              formatMessage={formatMessage}
              onSubmit={updateSingleSite}
              editable={editable}
              site={site}
            />
          </div>
          {site && (
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
