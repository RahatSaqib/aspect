import React, { PureComponent, PropTypes } from 'react'

import Helmet from 'react-helmet'

// Material-UI
import Paper from 'material-ui/Paper'

// Our own imports
import styles from './DeviceDemo.css'

export class DeviceDemo extends PureComponent {
  render() {
    return (
      <div className={styles.Content}>
        <Helmet title="Device Demo" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <Paper>
          <div>Device Demo!!!! {this.props.params.deviceId}</div>
        </Paper>
      </div>
    )
  }
}

export const DeviceDemoContainer = DeviceDemo
