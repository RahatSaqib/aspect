// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl
} from 'react-intl'
import Helmet from 'react-helmet'

// Our own imports
import styles from './ReportList.css'

export class ReportList extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired
  }

  componentWillMount() {
    this.props.setPageTitle('Reports')
  }

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

export const ReportListContainer = _.flowRight(
  injectIntl
)(ReportList)

