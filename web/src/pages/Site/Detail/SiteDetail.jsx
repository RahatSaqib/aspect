import React, { useEffect, useState } from 'react'
import { Box, LinearProgress, Paper } from '@mui/material'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { defineMessages } from 'react-intl'
import { useSelector } from 'react-redux'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { DetailHeader } from '../../../cleanComponents'
import useSite from '../../../hooks/site/useSite'
import useI18n from '../../../hooks/useI18n'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import TaskList from '../../../oldPages/task/list/TaskList'
import isEditable from '../../../utils/selectors/isEditable' // eslint-disable-line import/no-named-default
import SiteForm from './Edit/SiteForm'
import messages from './messages'
import SiteDetailProfile from './Profile/SiteDetailProfile'
import styles from './SiteDetail.css'
import SiteLocationFormMap from './SiteLocationFormMap'

const cssClasses = classnames.bind(styles)

const titleMessages = defineMessages({
  profile: { id: 'pages.SiteDetail.profile', defaultMessage: 'Profile' },
  alerts: { id: 'pages.SiteDetail.alerts', defaultMessage: 'Alerts' },
  edit: { id: 'pages.SiteDetail.edit', defaultMessage: 'Edit' },
})

const SiteDetail = ({ navigate, location }) => {
  const intl = useI18n()
  const { siteId } = useParams()
  const { isLoading, data: site } = useSite(siteId)
  const { editable, user } = useSelector(state => ({
    editable: isEditable(state.user, 'site'),
    user: state.user.toJS(),
  }))
  const [latLong, setLatLong] = useState({ lat: 0, lng: 0 })

  useEffect(() => {
    setLatLong({ lat: site?.latitude, lng: site?.longitude })
  }, [site])

  const onButtonClick = event => navigate(event.currentTarget.dataset.path)

  return (
    <>
      <Helmet title={intl.formatMessage(messages.title)} />
      <DetailHeader name={(site && site.name) || 'Site'} back="/browse/site">
        {[
          { label: intl.formatMessage(titleMessages.profile), path: `/browse/site/${siteId}` },
          { label: intl.formatMessage(titleMessages.alerts), path: `/browse/site/${siteId}/alerts` },
          { label: intl.formatMessage(titleMessages.edit), path: `/browse/site/${siteId}/edit`, disabled: false },
        ].map(({ label, path, disabled = false }) => (
          <AspectButton
            key={path}
            onClick={onButtonClick}
            disabled={disabled}
            data-path={path}
            color="primary"
            variant="contained"
            inverse={path !== location?.pathname}
          >
            {label}
          </AspectButton>
        ))}
      </DetailHeader>
      <Box component="main" sx={{ width: '100%' }}>
        {isLoading ? (
          <LinearProgress />
        ) : (
          <Routes>
            <Route
              path=""
              element={
                <SiteDetailProfile formatMessage={intl.formatMessage} disabled={!editable} site={site} user={user} />
              }
            />
            <Route
              path="alerts"
              element={
                <section className={cssClasses('Section', 'Section--first')}>
                  <TaskList intl={intl} navigate={navigate} location={location} filterOptions={{ siteId }} />
                </section>
              }
            />
            <Route
              path="edit"
              element={
                editable ? <SiteForm site={site} onLatLongChange={setLatLong} /> : <Navigate replace to={location} />
              }
            />
          </Routes>
        )}
        <section className={cssClasses('Section', 'Section--first')}>
          {latLong.lat && latLong.lng ? (
            <Paper>
              <SiteLocationFormMap latLong={latLong} />
            </Paper>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <span>{intl.formatMessage(messages.siteWithoutLocation)}</span>
            </div>
          )}
        </section>
      </Box>
    </>
  )
}

SiteDetail.propTypes = {
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  navigate: PropTypes.oneOfType([PropTypes.func]).isRequired,
}
export default SiteDetail
