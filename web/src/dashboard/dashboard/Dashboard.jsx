// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Link } from 'react-router'

import Paper from 'material-ui/Paper'

// Our own imports
import { Unit } from '../../components/pureGrids'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import styles from './Dashboard.css'

const messages = defineMessages({
  title: {
    id: 'pages.Dashboard.title',
    defaultMessage: 'Dashboard'
  },
  welcome: {
    id: 'pages.Dashboard.welcome',
    defaultMessage: 'Welcome {userName}'
  }
})

export class Dashboard extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    showAcknowledgement: PropTypes.func.isRequired,
    userName: PropTypes.string,
    location: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired
  }

  componentWillMount() {
    this.props.setPageTitle(null)
  }

  componentWillReceiveProps(nextProps) {
    const { location, showAcknowledgement, userName } = nextProps
    if (location.query.fl && nextProps.userName !== this.props.userName) {
      showAcknowledgement({
        title: messages.welcome,
        messageValues: { userName }
      })
    }
  }

  render() {
    const { intl: { formatMessage } } = this.props

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <Paper>
          <Unit sm="1-2" md="2-3">
            <section className={styles.Section}>
              <header className={styles.Section__Header}>
                <h2>Right Now</h2>
              </header>
              <div>
                <img role="presentation" src={require('./right-now.png')} />
              </div>
            </section>
            <section className={styles.Section}>
              <header className={styles.Section__Header}>
                <h2>
                  Patient Care<small> (1435 results in last 30 days)</small>
                </h2>
              </header>
              <div>
                <Unit sm="1-2">
                  <h3>
                    TB<small> (650 results)</small>
                  </h3>
                  <div>
                    <Link to="/dashboard/patient-care?type=TB">
                      <img role="presentation" src={require('./TB.png')} />
                    </Link>
                  </div>
                </Unit>
                <Unit sm="1-2">
                  <h3>
                    HCV<small> (885 results)</small>
                  </h3>
                  <div>
                    <Link to="/dashboard/patient-care?type=HCV">
                      <img role="presentation" src={require('./HCV.png')} />
                    </Link>
                  </div>
                </Unit>
                <Unit sm="1-2">
                  <h3>
                    Devices<small> (126 at 53 sites)</small>
                  </h3>
                  <div>
                    <Link to="/dashboard/manage-devices">
                      <img role="presentation" src={require('./devices.png')} />
                    </Link>
                  </div>
                </Unit>
                <Unit sm="1-2">
                  <h3>
                    Supplies<small> (6 types of disposables at 53 sites)</small>
                  </h3>
                  <div>
                    <Link to="/dashboard/manage-supplies">
                      <img role="presentation" src={require('./supplies.png')} />
                    </Link>
                  </div>
                </Unit>
              </div>
            </section>
          </Unit>
          <Unit sm="1-2" md="1-3">
            <section className={styles.Section}>
              <header className={styles.Section__Header}>
                <h2>To Do</h2>
              </header>
              <div>
                <img role="presentation" src={require('./todos.png')} />
              </div>
            </section>
            <section className={styles.Section}>
              <header className={styles.Section__Header}>
                <h2>Recommendations</h2>
              </header>
              <div>
                <img
                  role="presentation"
                  src={require('./recommendation.png')}
                  style={{ display: 'block', width: '100%' }}
                />
                <img
                  role="presentation"
                  src={require('./recommendation.png')}
                  style={{ display: 'block', width: '100%' }}
                />
                <img
                  role="presentation"
                  src={require('./recommendation.png')}
                  style={{ display: 'block', width: '100%' }}
                />
              </div>
            </section>
          </Unit>
        </Paper>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    userName: state.getIn(['user', 'name'])
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    showAcknowledgement
  }, dispatch)
}

export const DashboardContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(Dashboard)
