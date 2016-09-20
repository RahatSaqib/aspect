// Imports from packages
import _ from 'lodash'
import React from 'react'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import Helmet from 'react-helmet'

// Our own imports
import styles from './DeviceDetail.css'

const messages = defineMessages({
  title: {
    id: 'pages.DeviceDetail.title',
    defaultMessage: 'Device Detail'
  }
})

export class DeviceDetail extends React.PureComponent {

  render() {
    const { formatMessage } = this.props.intl

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
      </div>
    )
  }
}

export const DeviceDetailContainer = _.flowRight(
  injectIntl
)(DeviceDetail)
