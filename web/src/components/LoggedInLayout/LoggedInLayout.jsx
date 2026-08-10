import React, { useEffect, useState } from 'react'
import { Grid } from '@mui/material'
import { Container } from '@mui/system'
import { Helmet } from 'react-helmet'
import { aspectFetch } from '../../utils/utils/fetch'
import Header from './LoggedInLayout.AppBar'
import styles from './styles.module.css'

const LoggedInLayout = ({ children }) => {
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
      <Helmet titleTemplate="%s - Aspect" defaultTitle="Aspect" />
      <Container maxWidth="100%" disableGutters className={styles.Container}>
        <Header />
        <Grid container spacing={2}>
          {children}
        </Grid>
      </Container>
    </>
  )
}

export default LoggedInLayout
