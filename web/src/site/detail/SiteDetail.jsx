import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { Switch, Route, Redirect } from 'react-router-dom'
import Immutable from 'immutable'
import Helmet from 'react-helmet'
import classnames from 'classnames/bind'

// Material-UI
import Paper from '@material-ui/core/Paper'
import LinearProgress from '@material-ui/core/LinearProgress'

import isEditable from '../../shared/selectors/site'
import { fetchSingleSite, updateSingleSite, Site } from '../SiteRedux'
import { fetchTags, updateTags } from '../../tag/TagRedux'
import messages from './messages'
import SiteDetailAlert from './alerts/SiteDetailAlerts'
import SiteDetailProfile from './profile/SiteDetailProfile'
import SiteForm from './edit/SiteForm'
import SiteLocationFormMap from './SiteLocationFormMap'

const cssClasses = classnames.bind(require('./SiteDetail.css'))

const SiteDetail = props => {
  useEffect(
    () => {
      handleFetchSite(props)
    },
    [props.match.params.siteId]
  )
  const onSiteTagChange = (qryId, qryType, tags) => {
    props.updateTags(qryId, qryType, tags.join(','))
  }

  const handleFetchSite = ({ match }) => {
    props.fetchSingleSite(match.params.siteId)
    props.fetchTags(match.params.siteId, 'site')
  }

  const hasSiteWithLocation = () => {
    const { site } = props
    return site && site.has('longitude') && site.has('latitude')
  }
  const { intl, updateSingleSite, site, match, siteTags, editable } = props
  return (
    <div>
      <Helmet title={intl.formatMessage(messages.title)} />
      {!hasSiteWithLocation() && <LinearProgress />}
      {hasSiteWithLocation() && (
        <Switch>
          <Route
            exact
            path={match.path}
            render={props => (
              <SiteDetailProfile
                formatMessage={intl.formatMessage}
                disabled={!editable}
                {...props}
                site={site}
                siteTags={siteTags.toJS()}
              />
            )}
          />
          <Route
            exact
            path={`${match.path}/alerts`}
            render={props => (
              <SiteDetailAlert
                formatMessage={intl.formatMessage}
                disabled={!editable}
                {...props}
                site={site}
              />
            )}
          />
          <Route
            exact
            path={`${match.path}/edit`}
            render={props =>
              editable ? (
                <SiteForm
                  formatMessage={intl.formatMessage}
                  onSubmit={updateSingleSite}
                  onSiteTagChange={onSiteTagChange}
                  disabled={!editable}
                  {...props}
                  site={site}
                  siteTags={siteTags.toJS()}
                />
              ) : (
                <Redirect to={match.url} />
              )
            }
          />
        </Switch>
      )}
      <section className={cssClasses('Section', 'Section--first')}>
        <Paper>
          {hasSiteWithLocation() && (
            <SiteLocationFormMap editable={editable} site={site} />
          )}
        </Paper>
      </section>
    </div>
  )
}

const mapStateToProps = (state, ownProps) => {
  const site = state.site.items.byId.get(ownProps.match.params.siteId)
  const siteTags = state.tag.tags.getIn(
    ['site', ownProps.match.params.siteId],
    Immutable.List()
  )
  return {
    editable: isEditable(state.user, site),
    site,
    siteTags,
  }
}

SiteDetail.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      siteId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  location: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  history: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  intl: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  editable: PropTypes.bool.isRequired,
  site: PropTypes.objectOf(Site).isRequired,
  siteTags: PropTypes.instanceOf(Immutable.List).isRequired,
  fetchSingleSite: PropTypes.func.isRequired,
  updateSingleSite: PropTypes.func.isRequired,
  fetchTags: PropTypes.func.isRequired,
  updateTags: PropTypes.func.isRequired,
}
export default connect(mapStateToProps, {
  fetchSingleSite,
  updateSingleSite,
  fetchTags,
  updateTags,
})(SiteDetail)
