import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Link } from 'react-router-dom'

// Material-UI
import Paper from 'material-ui/Paper'
import LinearProgress from 'material-ui/LinearProgress'
import IconButton from 'material-ui/IconButton'
import NavigationCheck from 'material-ui/svg-icons/navigation/check'
import PrioHigh from 'material-ui/svg-icons/notification/priority-high'
import Build from 'material-ui/svg-icons/action/build'
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card'

// Our own imports
import { Unit } from '../../components/pureGrids'
import NavTitle from '../../globals/components/NavTitle'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import DashboardTB from './DashboardTB'
import DashboardHCV from './DashboardHCV'
import DashboardDevicesErrorRates from './DashboardDevicesErrorRates'
import DashboardSuppliesRunningLow from './DashboardSuppliesRunningLow'
import DashboardSuppliesExpiringSoon from './DashboardSuppliesExpiringSoon'
import styles from './Dashboard.css'
import { fetchDashboardHome } from '../DashboardRedux'

const messages = defineMessages({
  title: {
    id: 'pages.Dashboard.title',
    defaultMessage: 'Dashboard',
  },
  welcome: {
    id: 'pages.Dashboard.welcome',
    defaultMessage: 'Welcome {userName}',
  },
})

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
  }),
  pure,
  injectIntl,
  connect(
    state => ({
      userName: state.getIn(['user', 'name']),
      totals: state.getIn(['dashboard', 'home']),
    }),
    dispatch =>
      bindActionCreators(
        {
          showAcknowledgement,
          fetchDashboardHome,
        },
        dispatch
      )
  ),
  setPropTypes({
    intl: intlShape.isRequired,
    userName: PropTypes.string,
    totals: PropTypes.object,
    showAcknowledgement: PropTypes.func.isRequired,
    fetchDashboardHome: PropTypes.func.isRequired,
  })
)

export class Dashboard extends PureComponent {
  static defaultProps = {
    userName: '',
    totals: null,
  }

  componentDidMount() {
    this.props.fetchDashboardHome()
  }

  componentWillReceiveProps(nextProps) {
    const { location, showAcknowledgement, userName } = nextProps
    const search = new URLSearchParams(location.search)

    if (search.has('fl') && nextProps.userName !== this.props.userName) {
      showAcknowledgement({
        title: messages.welcome,
        messageValues: { userName },
      })
    }
  }

  render() {
    const { totals, intl: { formatMessage, formatNumber } } = this.props

    return (
      <div className={styles.Content}>
        <Helmet
          title={formatMessage(messages.title)}
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <NavTitle title={null} />
        <Paper>
          <Unit sm="1-2" md="2-3">
            <section style={{ height: '220px' }} className={styles.Section}>
              <header className={styles.Section__Header}>
                <h2>Right Now</h2>
              </header>
              {!totals && <LinearProgress />}
              {totals &&
                totals.get !== undefined &&
                <div>
                  <p>
                    <span className={styles.Count__Emphasis}>
                      {formatNumber(totals.get('devicesTotal'))}
                    </span>
                    {' '}
                    Devices at
                    {' '}
                    {formatNumber(totals.get('sitesTotal'))}
                    {' '}
                    Sites Managed
                  </p>
                  <p>
                    <span className={styles.Count__Emphasis}>
                      {formatNumber(totals.get('resultsTotal30d'))}
                    </span>
                    {' '}
                    Results in the last 30 days (
                    <span className={styles.Count__Positive}>
                      +{formatNumber(totals.get('resultsTotal1d'))} today
                    </span>
                    )
                  </p>
                </div>}
            </section>
            <section className={styles.Section}>
              <header className={styles.Section__Header}>
                {totals &&
                  totals.get !== undefined &&
                  <h2>
                    Patient Care
                    <small>
                      {' '}
                      (
                      {formatNumber(totals.get('resultsTotal30d'))}
                      {' '}
                      results in last 30 days)
                    </small>
                  </h2>}
              </header>
              <div>
                <Unit sm="1-2">
                  <h3>
                    TB<small> (650 results)</small>
                  </h3>
                  <div>
                    <Link to="/dashboard/patient-care?type=TB">
                      <DashboardTB
                        width={180}
                        height={180}
                        margin={{ top: 0, right: 0, bottom: 30, left: 30 }}
                      />
                      <img alt="tb" src={require('./TB.png')} />
                    </Link>
                  </div>
                </Unit>
                <Unit sm="1-2">
                  <h3>
                    HCV<small> (790 results)</small>
                  </h3>
                  <div>
                    <Link to="/dashboard/patient-care?type=HCV">
                      <DashboardHCV
                        width={180}
                        height={180}
                        margin={{ top: 0, right: 0, bottom: 30, left: 30 }}
                      />
                      <img alt="hcv" src={require('./HCV.png')} />
                    </Link>
                  </div>
                </Unit>
                <Unit sm="1-2">
                  {totals &&
                    totals.get !== undefined &&
                    <h3>
                      Devices
                      <small>
                        {' '}
                        (
                        {totals.get('devicesTotal')}
                        {' '}
                        at
                        {' '}
                        {totals.get('sitesTotal')}
                        {' '}
                        sites)
                      </small>
                    </h3>}
                  <div>
                    <h4>Error Rates</h4>
                    <Link to="/dashboard/manage-devices">
                      <DashboardDevicesErrorRates
                        width={180}
                        height={280}
                        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                      />
                      <img alt="devices" src={require('./devices.png')} />
                    </Link>
                  </div>
                </Unit>
                <Unit sm="1-2">
                  <h3>
                    Supplies<small> (2 disposable types at 24 sites)</small>
                  </h3>
                  <div>
                    <Unit sm="1-2">
                      <h4>Running Low</h4>
                      <Link to="/dashboard/manage-supplies">
                        <DashboardSuppliesRunningLow
                          width={100}
                          height={280}
                          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                        />
                      </Link>
                    </Unit>
                    <Unit sm="1-2">
                      <h4>Expiring Soon</h4>
                      <Link to="/dashboard/manage-supplies">
                        <DashboardSuppliesExpiringSoon
                          width={100}
                          height={280}
                          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                        />
                      </Link>
                    </Unit>
                    <Link to="/dashboard/manage-supplies">
                      <img alt="supplies" src={require('./supplies.png')} />
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
                <p>
                  Result Alerts
                  {' '}
                  <span className={styles.Alert__Positive}>0</span>
                </p>
                <p>
                  Device Alerts
                  {' '}
                  <span className={styles.Alert__Negative}>4</span>
                </p>
                <p>
                  Inventory Alerts
                  {' '}
                  <span className={styles.Alert__Negative}>3</span>
                </p>
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
                    This device hasn't reported in <b>8</b> days.
                  </CardText>
                  <CardActions style={{ textAlign: 'right' }}>
                    <IconButton
                      tooltip="Fix this"
                      iconStyle={{ color: 'gray' }}
                    >
                      <Build />
                    </IconButton>
                    <IconButton
                      tooltip="Escalate"
                      iconStyle={{ color: '#f57c00' }}
                    >
                      <PrioHigh />
                    </IconButton>
                    <IconButton
                      tooltip="Hide this notification"
                      iconStyle={{ color: '#63a021' }}
                    >
                      <NavigationCheck />
                    </IconButton>
                  </CardActions>
                </Card>
                <Card style={{ marginTop: '15px' }}>
                  <CardHeader title="Daktari Omaha" />
                  <CardText>
                    This device is low on inventory (<b>54 cartridges</b>).
                    It will run out in
                    {' '}
                    <b>9 days</b>
                    {' '}
                    given the curent utilization rate.
                  </CardText>
                  <CardActions style={{ textAlign: 'right' }}>
                    <IconButton
                      tooltip="Fix this"
                      iconStyle={{ color: 'gray' }}
                    >
                      <Build />
                    </IconButton>
                    <IconButton
                      tooltip="Escalate"
                      iconStyle={{ color: '#f57c00' }}
                    >
                      <PrioHigh />
                    </IconButton>
                    <IconButton
                      tooltip="Hide this notification"
                      iconStyle={{ color: '#63a021' }}
                    >
                      <NavigationCheck />
                    </IconButton>
                  </CardActions>
                </Card>
                <Card style={{ marginTop: '15px' }}>
                  <CardHeader title="Daktari Dayton" />
                  <CardText>
                    Has a high error rate (<b>11%</b>).
                    The average error rate for Daktari devices is <b>5%</b>.
                  </CardText>
                  <CardActions style={{ textAlign: 'right' }}>
                    <IconButton
                      tooltip="Fix this"
                      iconStyle={{ color: 'gray' }}
                    >
                      <Build />
                    </IconButton>
                    <IconButton
                      tooltip="Escalate"
                      iconStyle={{ color: '#f57c00' }}
                    >
                      <PrioHigh />
                    </IconButton>
                    <IconButton
                      tooltip="Hide this notification"
                      iconStyle={{ color: '#63a021' }}
                    >
                      <NavigationCheck />
                    </IconButton>
                  </CardActions>
                </Card>
                <Card style={{ marginTop: '15px' }}>
                  <CardHeader title="GeneXpert Boston" />
                  <CardText>
                    This device was expected to come back online
                    {' '}
                    <b>yesterday </b>
                    after being serviced but has not connected yet.
                  </CardText>
                  <CardActions style={{ textAlign: 'right' }}>
                    <IconButton
                      tooltip="Fix this"
                      iconStyle={{ color: 'gray' }}
                    >
                      <Build />
                    </IconButton>
                    <IconButton
                      tooltip="Escalate"
                      iconStyle={{ color: '#f57c00' }}
                    >
                      <PrioHigh />
                    </IconButton>
                    <IconButton
                      tooltip="Hide this notification"
                      iconStyle={{ color: '#63a021' }}
                    >
                      <NavigationCheck />
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

export default enhance(Dashboard)
