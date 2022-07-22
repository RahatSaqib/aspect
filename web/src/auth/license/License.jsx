import flowRight from 'lodash/flowRight'
import omit from 'lodash/omit'
import get from 'lodash/get'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { defineMessages, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import { Helmet } from 'react-helmet'
import { Unit } from '../../components/pureGrids'

import { fetchLicense, userRequestedLogout, acceptLicenseStart } from '../AuthRedux'

import styles from './License.css'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  title: {
    id: 'pages.License.title',
    defaultMessage: 'License',
  },
  accept: {
    id: 'pages.License.accept',
    defaultMessage: 'I Accept',
  },
  doNotAccept: {
    id: 'pages.License.doNotAccept',
    defaultMessage: 'I Do Not Accept',
  },
})

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

const AspectLogo = () => <img className={cssClasses('Logo__Image')} src={require('../logo_aspect.png')} alt="Aspect" />

export const License = ({ intl, licenseContent, onDoNotAcceptClick, onAcceptClick }) => (
  <div className={cssClasses('Background')}>
    <Helmet title="License" />
    <div>
      <Unit sm="1-24" md="1-12" lg="1-12" xl="1-6" />
      <Unit sm="11-12" md="5-6" lg="5-6" xl="2-3">
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
      </Unit>
    </div>
  </div>
)

export default enhance(License)
