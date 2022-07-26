import flowRight from 'lodash/flowRight'
import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import { connect, useSelector } from 'react-redux'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import Immutable from 'immutable'
import { Helmet } from 'react-helmet'
import classnames from 'classnames/bind'
import { injectIntl, defineMessages, useIntl } from 'react-intl'
import isNil from 'lodash/isNil'

import Paper from '@material-ui/core/Paper'
import LinearProgress from '@material-ui/core/LinearProgress'
import Shell from '../../Shell'

import isEditable from '../../../shared/selectors/isEditable'
import { fetchSingleSite, updateSingleSiteFromForm, updateLatLongFromFormAddress } from '../../../site/SiteRedux'
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

import styles from './SiteDetail.css'

const cssClasses = classnames.bind(styles)

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
    updateLatLongFromFormAddress,
    fetchSingleSite,
    fetchSiteContacts,
    fetchTags,
    updateTags,
    navigate,
    location,
  } = props
  const { siteId } = useParams()
  const intl = useIntl()
  const { editable, site, siteTags, siteContacts, user } = useSelector(state => {
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
  })

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

  const hasSiteWithLocation = () => site && !isNil(site.get('longitude')) && !isNil(site.get('latitude'))

  const hasSite = () => site && site.has('longitude') && site.has('latitude')

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
            }) => navigate(path)}
            disabled={disabled}
            data-path={path}
            color="primary"
            variant="contained"
            inverse={path !== location?.pathname}
          >
            {label}
          </AspectButton>
        ))}
      </ShellHeader>
      <ShellContent>
        <Helmet title={intl.formatMessage(messages.title)} />
        {!hasSite() ? <LinearProgress /> : null}
        {hasSite() ? (
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
              <SiteDetailAlert {...props} intl={intl} disabled={!editable} siteId={+siteId} />
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
                <Navigate replace to={location} />
              )}
            </Route>
          </Routes>
        ) : null}
        <section className={cssClasses('Section', 'Section--first')}>
          {hasSiteWithLocation() ? (
            <Paper>
              <SiteLocationFormMap site={site} />
            </Paper>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <span>{intl.formatMessage(messages.siteWithoutLocation)}</span>
            </div>
          )}
        </section>
      </ShellContent>
    </Shell>
  )
}

SiteDetail.propTypes = {
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  navigate: PropTypes.oneOfType([PropTypes.func]).isRequired,
  fetchSingleSite: PropTypes.func.isRequired,
  updateSingleSiteFromForm: PropTypes.func.isRequired,
  fetchSiteContacts: PropTypes.func.isRequired,
  fetchTags: PropTypes.func.isRequired,
  updateTags: PropTypes.func.isRequired,
  updateLatLongFromFormAddress: PropTypes.func.isRequired,
}
export default flowRight(
  injectIntl,
  connect(null, {
    fetchSingleSite,
    updateSingleSiteFromForm,
    fetchSiteContacts,
    fetchTags,
    updateTags,
    updateLatLongFromFormAddress,
  })
)(SiteDetail)
