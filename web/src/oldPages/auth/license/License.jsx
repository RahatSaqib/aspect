import React from 'react'
import { Box, Button, Card } from '@mui/material'
import classnames from 'classnames/bind'
import flowRight from 'lodash/flowRight'
import get from 'lodash/get'
import omit from 'lodash/omit'
import { Helmet } from 'react-helmet'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { compose, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { fetchLicense, userRequestedLogout, acceptLicenseStart } from '../../../store/AuthRedux'
import styles from './License.css'
import messages from './messages'

const cssClasses = classnames.bind(styles)

const enhance = compose(
  injectIntl,
  connect(
    state => ({
      hasToAcceptLicenseId: state.user.jwt.hasToAcceptLicenseId,
      licenseContent: state.user.licenseContent,
    }),
    bindActionCreators.bind(null, {
      fetchLicense,
      userRequestedLogout,
      acceptLicenseStart,
    })
  ),
  withHandlers({
    onInitialLoad:
      ({ hasToAcceptLicenseId, fetchLicense }) =>
      () => {
        if (hasToAcceptLicenseId) {
          fetchLicense(hasToAcceptLicenseId)
        }
      },
    onAcceptClick:
      ({ navigate, location, acceptLicenseStart, hasToAcceptLicenseId }) =>
      () => {
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
      },
    onDoNotAcceptClick:
      ({ userRequestedLogout }) =>
      () => {
        userRequestedLogout()
      },
  }),
  lifecycle({
    componentDidMount() {
      this.props.onInitialLoad()
    },
  })
)

const AspectLogo = () => (
  <img className={cssClasses('Logo__Image')} src={require('../../../assets/logo_aspect.png')} alt="Aspect" />
)

export const License = ({ intl, licenseContent, onDoNotAcceptClick, onAcceptClick }) => (
  <div className={cssClasses('Background')}>
    <Helmet title={intl.formatMessage(messages.title)} />
    <div>
      <Box sx={{ margin: '0 auto', width: { sm: '90%', md: '80%', xl: '66%' } }}>
        <Card>
          <div className={cssClasses('Logo__Container')}>
            <AspectLogo />
          </div>
          <div className={cssClasses('License__Container')}>
            <div className={cssClasses('License__Container__License')}>
              {licenseContent &&
                licenseContent
                  .split('\n')
                  // eslint-disable-next-line react/no-array-index-key
                  .map((item, key) => <p key={key}>{item}</p>)}
            </div>
            <div className={cssClasses('License__Container__ActionRow')}>
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

export default enhance(License)
