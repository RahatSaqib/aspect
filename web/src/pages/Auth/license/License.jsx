import React, { useEffect } from 'react'
import { Box, Button, Card } from '@mui/material'
import flowRight from 'lodash/flowRight'
import get from 'lodash/get'
import omit from 'lodash/omit'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { acceptLicenseStart, fetchLicense, useAuthStore, userRequestedLogout } from '../../../store/authStore'
import styles from './License.module.css'
import messages from './messages'

const AspectLogo = () => (
  <img className={styles.Logo__Image} src={require('../../../assets/logo_aspect.png')} alt="Aspect" />
)

export const License = ({ intl, licenseContent, onDoNotAcceptClick, onAcceptClick }) => (
  <div className={styles.Background}>
    <Helmet title={intl.formatMessage(messages.title)} />
    <div>
      <Box sx={{ margin: '0 auto', width: { sm: '90%', md: '80%', xl: '66%' } }}>
        <Card>
          <div className={styles.Logo__Container}>
            <AspectLogo />
          </div>
          <div className={styles.License__Container}>
            <div className={styles.License__Container__License}>
              {licenseContent && licenseContent.split('\n').map((item, key) => <p key={key}>{item}</p>)}
            </div>
            <div className={styles.License__Container__ActionRow}>
              <Button type="submit" variant="contained" color="primary" onClick={onAcceptClick}>
                {intl.formatMessage(messages.accept)}
              </Button>
              <Button type="submit" variant="contained" onClick={onDoNotAcceptClick}>
                {intl.formatMessage(messages.doNotAccept)}
              </Button>
            </div>
          </div>
        </Card>
      </Box>
    </div>
  </div>
)

const LicenseContainer = ({ navigate, location }) => {
  const intl = useIntl()
  const { jwt, licenseContent } = useAuthStore()
  const { hasToAcceptLicenseId } = jwt

  useEffect(() => {
    if (hasToAcceptLicenseId) {
      fetchLicense(hasToAcceptLicenseId)
    }
  }, [hasToAcceptLicenseId])

  const onAcceptClick = () =>
    acceptLicenseStart(hasToAcceptLicenseId).then(() => {
      const referrer = flowRight(
        x => omit(x, 'search'),
        x =>
          get(x, 'state.referrer', {
            pathname: '/',
          })
      )(location)
      navigate(referrer)
    })

  return (
    <License
      intl={intl}
      licenseContent={licenseContent}
      onAcceptClick={onAcceptClick}
      onDoNotAcceptClick={userRequestedLogout}
    />
  )
}

export default LicenseContainer
