import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import flowRight from 'lodash/flowRight'
import { connect } from 'react-redux'
import { Routes, Route, Navigate } from 'react-router-dom'
import Immutable from 'immutable'
import { Helmet } from 'react-helmet'
import classnames from 'classnames/bind'
import { injectIntl } from 'react-intl'

import Paper from '@mui/material/Paper'
import LinearProgress from '@mui/material/LinearProgress'
import useI18n from '../../hooks/i18n/useI18n'

import isEditable from '../../utils/selectors/isEditable'
import { fetchSingleSite, updateSingleSiteFromForm, updateLatLongFromFormAddress, Site } from '../SiteRedux'
import { fetchTags, updateTags } from '../../tag/TagRedux'
import { fetchSiteContacts } from '../../person/PersonRedux'

import messages from './messages'
import SiteDetailAlert from './alerts/SiteDetailAlerts'
import SiteDetailProfile from './profile/SiteDetailProfile'
import SiteForm from './edit/SiteForm'
import SiteLocationFormMap from './SiteLocationFormMap'

import styles from './SiteDetail.css'

const cssClasses = classnames.bind(styles)

export const SiteDetail = props => {
  const intl = useI18n()
  const {
    updateSingleSiteFromForm,
    site,
    match,
    siteTags,
    editable,
    siteContacts,
    updateLatLongFromFormAddress,
    fetchSingleSite,
    fetchSiteContacts,
    fetchTags,
    updateTags,
    user,
  } = props

  useEffect(
    () => {
      const handleFetchSite = ({ match }) => {
        fetchSingleSite(match.params.siteId)
        fetchSiteContacts(match.params.siteId)
        fetchTags(match.params.siteId, 'site')
      }

      handleFetchSite(props)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [match.params.siteId]
  )

  const onSiteTagChange = (qryId, qryType, tags) => {
    updateTags(qryId, qryType, tags.join(','))
  }

  const hasSiteWithLocation = () => {
    return site && site.has('longitude') && site.has('latitude')
  }

  return (
    <div>
      <Helmet title={intl.formatMessage(messages.title)} />
      {!hasSiteWithLocation() ? <LinearProgress /> : null}
      {hasSiteWithLocation() ? (
        <Routes>
          <Route path="">
            <SiteDetailProfile
              formatMessage={intl.formatMessage}
              disabled={!editable}
              {...props}
              site={site}
              siteTags={siteTags.toJS()}
              onSiteTagChange={onSiteTagChange}
              siteContacts={siteContacts.toJS()}
              user={user}
            />
          </Route>
          <Route path="alerts">
            <SiteDetailAlert {...props} disabled={!editable} site={site} />
          </Route>
          <Route path="edit">
            {editable ? (
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
              <Navigate replace to={match.url} />
            )}
          </Route>
        </Routes>
      ) : null}
      <section className={cssClasses('Section', 'Section--first')}>
        <Paper>{hasSiteWithLocation() ? <SiteLocationFormMap site={site} /> : null}</Paper>
      </section>
    </div>
  )
}

const mapStateToProps = (state, ownProps) => {
  const { siteId } = ownProps.match.params
  const site = state.site.items.byId.get(siteId)
  const siteTags = state.tag.tags.getIn(['site', siteId], Immutable.List())
  const siteContacts = state.person.siteContacts.getIn([siteId], Immutable.List())
  return {
    editable: isEditable(state.user, 'site'),
    site,
    siteTags,
    lastServerResponseTime: state.getIn(['globals', 'lastServerResponseTime']),
    siteContacts,
    user: state.user,
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
  user: PropTypes.oneOfType([PropTypes.object]).isRequired,
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
