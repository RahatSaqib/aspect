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
import IconButton from 'material-ui/IconButton'
import NavigationCheck from 'material-ui/svg-icons/navigation/check'
import PrioHigh from 'material-ui/svg-icons/notification/priority-high'
import Build from 'material-ui/svg-icons/action/build'
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card'

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
    const { intl: { formatMessage, formatNumber } } = this.props

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <Paper>
          <Unit sm="1-2" md="2-3">
            <section style={{ height: '220px' }} className={styles.Section}>
              <header className={styles.Section__Header}>
                <h2>Right Now</h2>
              </header>
              <div>
                <p>
                  <span className={styles.Count__Emphasis}>{formatNumber(126)}</span> Devices at {formatNumber(53)} Sites Managed
                </p>
                <p>
                  <span className={styles.Count__Emphasis}>{formatNumber(1435)}</span> Results in the last 30 days (<span className={styles.Count__Positive}>+{formatNumber(15)} today</span>)
                </p>
              </div>
            </section>
            <section className={styles.Section}>
              <header className={styles.Section__Header}>
                <h2>
                  Patient Care<small> ({formatNumber(1435)} results in last 30 days)</small>
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
            <section style={{ height: '220px' }} className={styles.Section}>
              <header className={styles.Section__Header}>
                <h2>To Do</h2>
              </header>
              <div style={{ width: '180px' }}>
                <p>Result Alerts <span className={styles.Alert__Positive}>0</span></p>
                <p>Device Alerts <span className={styles.Alert__Negative}>4</span></p>
                <p>Inventory Alerts <span className={styles.Alert__Negative}>3</span></p>
              </div>
            </section>
            <section className={styles.Section}>
              <header className={styles.Section__Header}>
                <h2>Recommendations</h2>
              </header>
              <div style={{ paddingTop: '15px' }}>
                <Card>
                  <CardHeader title="GeneXpert Franklin" />
                  <CardText>
                    This device hasn&#39;t reported in <b>8</b> days.
                  </CardText>
                  <CardActions style={{ textAlign: 'right' }}>
                    <IconButton tooltip="Fix this" iconStyle={{ color: 'gray' }} >
                      <Build />
                    </IconButton>
                    <IconButton tooltip="Escalate" iconStyle={{ color: '#f57c00' }} >
                      <PrioHigh />
                    </IconButton>
                    <IconButton tooltip="Hide this notification" iconStyle={{ color: '#63a021' }} >
                      <NavigationCheck primary />
                    </IconButton>
                  </CardActions>
                </Card>
                <Card style={{ marginTop: '15px' }}>
                  <CardHeader title="Daktari Omaha" />
                  <CardText>
                    This device is low on inventory (<b>54 cartridges</b>) and will run out in <b>9 days</b> given the curent utilization rate.
                  </CardText>
                  <CardActions style={{ textAlign: 'right' }}>
                    <IconButton tooltip="Fix this" iconStyle={{ color: 'gray' }} >
                      <Build />
                    </IconButton>
                    <IconButton tooltip="Escalate" iconStyle={{ color: '#f57c00' }} >
                      <PrioHigh />
                    </IconButton>
                    <IconButton tooltip="Hide this notification" iconStyle={{ color: '#63a021' }} >
                      <NavigationCheck primary />
                    </IconButton>
                  </CardActions>
                </Card>
                <Card style={{ marginTop: '15px' }}>
                  <CardHeader title="Daktari Dayton" />
                  <CardText>
                    Has a high error rate (<b>11%</b>). The average error rate for Daktari devices is <b>5%</b>.
                  </CardText>
                  <CardActions style={{ textAlign: 'right' }}>
                    <IconButton tooltip="Fix this" iconStyle={{ color: 'gray' }} >
                      <Build />
                    </IconButton>
                    <IconButton tooltip="Escalate" iconStyle={{ color: '#f57c00' }} >
                      <PrioHigh />
                    </IconButton>
                    <IconButton tooltip="Hide this notification" iconStyle={{ color: '#63a021' }} >
                      <NavigationCheck primary />
                    </IconButton>
                  </CardActions>
                </Card>
                <Card style={{ marginTop: '15px' }}>
                  <CardHeader title="GeneXpert Boston" />
                  <CardText>
                    This device was expected to come back online <b>yesterday</b> after being serviced but has not connected yet.
                  </CardText>
                  <CardActions style={{ textAlign: 'right' }}>
                    <IconButton tooltip="Fix this" iconStyle={{ color: 'gray' }} >
                      <Build />
                    </IconButton>
                    <IconButton tooltip="Escalate" iconStyle={{ color: '#f57c00' }} >
                      <PrioHigh />
                    </IconButton>
                    <IconButton tooltip="Hide this notification" iconStyle={{ color: '#63a021' }} >
                      <NavigationCheck primary />
                    </IconButton>
                  </CardActions>
                </Card>
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
