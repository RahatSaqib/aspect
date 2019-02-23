import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import Helmet from 'react-helmet'

import {
  fetchLicense,
  userRequestedLogout,
  acceptLicenseStart,
} from '../AuthRedux'

const cssClasses = classnames.bind(require('./License.css'))

const enhance = compose(
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
    onInitialLoad: ({ hasToAcceptLicenseId, fetchLicense }) => () => {
      fetchLicense(hasToAcceptLicenseId)
    },
    onAcceptClick: ({
      history,
      location,
      acceptLicenseStart,
      hasToAcceptLicenseId,
    }) => () => {
      acceptLicenseStart(hasToAcceptLicenseId).then(() => {
        const referrer = _.flowRight(
          x => _.omit(x, 'search'),
          x =>
            _.get(x, 'state.referrer', {
              pathname: '/',
            })
        )(location)
        history.push(referrer)
      })
    },
    onDoNotAcceptClick: ({ userRequestedLogout }) => () => {
      userRequestedLogout()
    },
  }),
  lifecycle({
    componentDidMount() {
      this.props.onInitialLoad()
    },
  })
)

const License = ({ licenseContent, onDoNotAcceptClick, onAcceptClick }) => (
  <div className={cssClasses('Container')}>
    <Helmet title="Not Found" />
    <h1 className={cssClasses('Container__Title')}>
      <FormattedMessage id="pages.License.title" defaultMessage="License" />
    </h1>
    <p>{licenseContent}</p>
    <button onClick={onAcceptClick}>I Accept</button>
    <button onClick={onDoNotAcceptClick}>I Do Not Accept</button>
  </div>
)

export default enhance(License)
