import React, { useEffect, useState } from 'react'
import { Box, LinearProgress, Paper } from '@mui/material'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { defineMessages, useIntl } from 'react-intl'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { DetailHeader } from '../../../components'
import AspectButton from '../../../components/shared/AspectButton'
import useSite from '../../../hooks/site/useSite'
import useAuthState from '../../../hooks/useAuthState'
import isEditable from '../../../utils/selectors/isEditable'
import { getReturnUrl } from '../../../utils/utils/browser'
import SiteForm from './Edit/SiteForm'
import messages from './messages'
import SiteDetailProfile from './Profile/SiteDetailProfile'
import styles from './SiteDetail.module.css'
import SiteLocationFormMap from './SiteLocationFormMap'

const titleMessages = defineMessages({
  profile: { id: 'pages.SiteDetail.profile', defaultMessage: 'Profile' },
  alerts: { id: 'pages.SiteDetail.alerts', defaultMessage: 'Alerts' },
  edit: { id: 'pages.SiteDetail.edit', defaultMessage: 'Edit' },
})

const SiteDetail = ({ navigate, location }) => {
  const intl = useIntl()
  const { siteId } = useParams()
  const { isLoading, data: site } = useSite(siteId)
  const user = useAuthState()
  const editable = isEditable(user, 'site')
  const [latLong, setLatLong] = useState({ lat: 0, lng: 0 })

  useEffect(() => {
    setLatLong({ lat: site?.latitude, lng: site?.longitude })
  }, [site])

  const onButtonClick = event => navigate(event.currentTarget.dataset.path)

  return (
    <>
      <Helmet title={intl.formatMessage(messages.title)} />
      <DetailHeader name={(site && site.name) || 'Site'} back={getReturnUrl(location, '/browse/site')}>
        {[
          { label: intl.formatMessage(titleMessages.profile), path: `/browse/site/${siteId}${location.search}` },
          {
            label: intl.formatMessage(titleMessages.edit),
            path: `/browse/site/${siteId}/edit${location.search}`,
            disabled: false,
          },
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
              path="edit"
              element={
                editable ? <SiteForm site={site} onLatLongChange={setLatLong} /> : <Navigate replace to={location} />
              }
            />
          </Routes>
        )}
        <section className={`${styles.Section} ${styles.Section__first}`}>
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
