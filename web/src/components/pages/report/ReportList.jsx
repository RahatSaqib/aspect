// Imports from packages
import React, { PureComponent } from 'react'
import Helmet from 'react-helmet'

// Our own imports
import styles from './ReportList.css'

export class ReportList extends PureComponent {
  render() {
    return (
      <div className={styles.Content}>
        <Helmet title="Reports" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div className="pure-g">
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            Reports Here!
          </div>
        </div>
      </div>
    )
  }
}

export default ReportList
