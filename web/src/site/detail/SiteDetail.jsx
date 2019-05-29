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

import isEditable from '../../shared/selectors/isEditable'
import {
  fetchSingleSite,
  updateSingleSiteFromForm,
  updateLatLongFromFormAddress,
  Site,
} from '../SiteRedux'
import { fetchTags, updateTags } from '../../tag/TagRedux'
import { fetchSiteContacts } from '../../person/PersonRedux'

import messages from './messages'
import SiteDetailAlert from './alerts/SiteDetailAlerts'
import SiteDetailProfile from './profile/SiteDetailProfile'
import SiteForm from './edit/SiteForm'
import SiteLocationFormMap from './SiteLocationFormMap'

const cssClasses = classnames.bind(require('./SiteDetail.css'))

export const SiteDetail = props => {
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
    props.fetchSiteContacts(match.params.siteId)
    props.fetchTags(match.params.siteId, 'site')
  }

  const hasSiteWithLocation = () => {
    const { site } = props
    return site && site.has('longitude') && site.has('latitude')
  }
  const {
    intl,
    updateSingleSiteFromForm,
    site,
    match,
    siteTags,
    editable,
    siteContacts,
    updateLatLongFromFormAddress,
  } = props
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
                onSiteTagChange={onSiteTagChange}
                siteContacts={siteContacts.toJS()}
              />
            )}
          />
          <Route
            exact
            path={`${match.path}/alerts`}
            render={props => (
              <SiteDetailAlert
                {...props}
                intl={intl}
                disabled={!editable}
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
                  onSubmit={updateSingleSiteFromForm}
                  onSiteTagChange={onSiteTagChange}
                  updateLatLongFromFormAddress={updateLatLongFromFormAddress}
                  disabled={!editable}
                  {...props}
                  site={site}
                  siteTags={siteTags.toJS()}
                  siteContacts={siteContacts.toJS()}
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
          {hasSiteWithLocation() && <SiteLocationFormMap site={site} />}
        </Paper>
      </section>
    </div>
  )
}

const mapStateToProps = (state, ownProps) => {
  const { siteId } = ownProps.match.params
  const site = state.site.items.byId.get(siteId)
  const siteTags = state.tag.tags.getIn(['site', siteId], Immutable.List())
  const siteContacts = state.person.siteContacts.getIn(
    [siteId],
    Immutable.List()
  )
  return {
    editable: isEditable(state.user, 'site'),
    site,
    siteTags,
    lastServerResponseTime: state.getIn(['globals', 'lastServerResponseTime']),
    siteContacts,
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
  siteContacts: PropTypes.instanceOf(Immutable.List).isRequired,
  onSiteTagChange: PropTypes.func.isRequired,
  fetchSingleSite: PropTypes.func.isRequired,
  updateSingleSiteFromForm: PropTypes.func.isRequired,
  fetchSiteContacts: PropTypes.func.isRequired,
  fetchTags: PropTypes.func.isRequired,
  updateTags: PropTypes.func.isRequired,
  updateLatLongFromFormAddress: PropTypes.func.isRequired,
}
export default connect(mapStateToProps, {
  fetchSingleSite,
  updateSingleSiteFromForm,
  fetchSiteContacts,
  fetchTags,
  updateTags,
  updateLatLongFromFormAddress,
})(SiteDetail)
