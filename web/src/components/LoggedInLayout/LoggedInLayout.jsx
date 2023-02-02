import React, { useEffect, useState } from 'react'
import { CssBaseline, Grid } from '@mui/material'
import { Container } from '@mui/system'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import useI18n from '../../hooks/useI18n'
import AppNotificationDialog from '../../oldComponents/appNotification/AppNotificationDialog'
import AppNotificationSnackBar from '../../oldComponents/appNotification/AppNotificationSnackBar'
import { aspectFetch } from '../../utils/utils/fetch'
import Header from './LoggedInLayout.AppBar'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

export const LoggedInLayout = ({ children }) => {
  const intl = useI18n()
  const [version, setVersion] = useState({ fetched: false, v: '' })

  useEffect(() => {
    const getVersion = async () => {
      aspectFetch('/version').then(r => setVersion({ fetched: true, v: r.version }))
    }

    if (!version.fetched) {
      getVersion()
    }
  }, [version])

  return (
    <>
      <CssBaseline />
      <Helmet titleTemplate="%s - Aspect" defaultTitle="Aspect" />
      <Container maxWidth="100%" disableGutters className={cssClasses('Container')}>
        <Header />
        <Grid container spacing={2}>
          {children}
        </Grid>
        <AppNotificationDialog intl={intl} />
        <AppNotificationSnackBar intl={intl} />
      </Container>
    </>
  )
}

export default LoggedInLayout
