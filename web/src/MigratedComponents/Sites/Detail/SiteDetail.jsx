import flowRight from 'lodash/flowRight'
import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { Switch, Route, Redirect, useHistory } from 'react-router-dom'
import Immutable from 'immutable'
import { Helmet } from 'react-helmet'
import classnames from 'classnames/bind'
import { injectIntl, defineMessages, useIntl } from 'react-intl'

import Paper from '@material-ui/core/Paper'
import LinearProgress from '@material-ui/core/LinearProgress'
import Shell from '../../Shell'

import isEditable from '../../../shared/selectors/isEditable'
import {
  fetchSingleSite,
  updateSingleSiteFromForm,
  updateLatLongFromFormAddress,
  Site,
} from '../../../site/SiteRedux'
import { fetchTags, updateTags } from '../../../tag/TagRedux'
import { fetchSiteContacts } from '../../../person/PersonRedux'

import messages from './messages'
import SiteDetailAlert from './Alerts/SiteDetailAlerts'
import SiteDetailProfile from './Profile/SiteDetailProfile'
import SiteForm from './Edit/SiteForm'
import SiteLocationFormMap from './SiteLocationFormMap'
import ShellHeader from '../../Shell/Header'
import ShellContent from '../../Shell/Content'
import AspectButton from '../../../components/shared/AspectButton'

const cssClasses = classnames.bind(require('./SiteDetail.css'))

const titleMessages = defineMessages({
  profile: {
    id: 'pages.SiteDetail.profile',
    defaultMessage: 'Profile',
  },
  alerts: {
    id: 'pages.SiteDetail.alerts',
    defaultMessage: 'Alerts',
  },
  edit: {
    id: 'pages.SiteDetail.edit',
    defaultMessage: 'Edit',
  },
})

export const SiteDetail = props => {
  const {
    updateSingleSiteFromForm,
    site,
    match: {
      params: { siteId },
      path,
      url,
    },
    siteTags,
    editable,
    siteContacts,
    updateLatLongFromFormAddress,
    fetchSingleSite,
    fetchSiteContacts,
    fetchTags,
    updateTags,
  } = props

  const intl = useIntl()
  const history = useHistory()

  useEffect(() => {
    const handleFetchSite = siteId => {
      fetchSingleSite(siteId)
      fetchSiteContacts(siteId)
      fetchTags(siteId, 'site')
    }

    handleFetchSite(siteId)
  }, [siteId, fetchSingleSite, fetchSiteContacts, fetchTags])

  const onSiteTagChange = (qryId, qryType, tags) => {
    updateTags(qryId, qryType, tags.join(','))
  }

  const hasSiteWithLocation = () =>
    site && site.has('longitude') && site.has('latitude')

  return (
    <Shell>
      <ShellHeader title={(site && site.get('name')) || 'Site'}>
        {[
          {
            label: intl.formatMessage(titleMessages.profile),
            path: `/browse/site/${siteId}`,
          },
          {
            label: intl.formatMessage(titleMessages.alerts),
            path: `/browse/site/${siteId}/alerts`,
          },
          {
            label: intl.formatMessage(titleMessages.edit),
            path: `/browse/site/${siteId}/edit`,
            disabled: false,
          },
        ].map(({ label, path, disabled = false }) => (
          <AspectButton
            key={path}
            onClick={({
              currentTarget: {
                dataset: { path },
              },
            }) => history.push(path)}
            disabled={disabled}
            data-path={path}
            color="primary"
            variant="contained"
            inverse={path !== history?.location?.pathname}
          >
            {label}
          </AspectButton>
        ))}
      </ShellHeader>
      <ShellContent>
        <Helmet title={intl.formatMessage(messages.title)} />
        {!hasSiteWithLocation() ? <LinearProgress /> : null}
        {hasSiteWithLocation() ? (
          <Switch>
            <Route
              exact
              path={path}
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
              path={`${path}/alerts`}
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
              path={`${path}/edit`}
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
                  <Redirect to={url} />
                )
              }
            />
          </Switch>
        ) : null}
        <section className={cssClasses('Section', 'Section--first')}>
          <Paper>
            {hasSiteWithLocation() ? <SiteLocationFormMap site={site} /> : null}
          </Paper>
        </section>
      </ShellContent>
    </Shell>
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
    path: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
  }).isRequired,
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  history: PropTypes.oneOfType([PropTypes.object]).isRequired,
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
export default flowRight(
  injectIntl,
  connect(mapStateToProps, {
    fetchSingleSite,
    updateSingleSiteFromForm,
    fetchSiteContacts,
    fetchTags,
    updateTags,
    updateLatLongFromFormAddress,
  })
)(SiteDetail)
