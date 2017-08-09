import PropTypes from 'prop-types'
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, intlShape } from 'react-intl'
import Helmet from 'react-helmet'
import { Link } from 'react-router-dom'

import Paper from 'material-ui/Paper'
import IconButton from 'material-ui/IconButton'
import NavigationCheck from 'material-ui/svg-icons/navigation/check'
import PrioHigh from 'material-ui/svg-icons/notification/priority-high'
import Build from 'material-ui/svg-icons/action/build'
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card'

// Our own imports
import { Unit } from '../../components/pureGrids'
import NavTitle from '../../globals/components/NavTitle'
import styles from './ManageDevices.css'

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
  }),
  pure,
  injectIntl,
  setPropTypes({
    intl: intlShape.isRequired,
  })
)

export const ManageDevices = () =>
  <div className={styles.Content}>
    <Helmet
      title="Manage Devices"
      titleTemplate="%s - Aspect"
      defaultTitle="Aspect"
    />
    <NavTitle title="Manage Devices" />
    <Paper>
      <Unit sm="1-2" md="2-3">
        <div>
          <Unit sm="1-2">
            <section className={styles.Section}>
              <header className={styles.Section__Header}>
                <h2>Current Status</h2>
              </header>
              <div>
                <img
                  alt="current status"
                  src={require('./current-status.png')}
                  style={{ display: 'block', width: '100%' }}
                />
              </div>
            </section>
          </Unit>
          <Unit sm="1-2" />
        </div>
        <section className={styles.Section}>
          <header className={styles.Section__Header}>
            <h2>
              Devices<small> (126 devices at 74 sites)</small>
            </h2>
          </header>
          <div>
            <Link to="/device">
              <img
                alt="devices"
                src={require('./devices.png')}
                style={{ display: 'block', width: '100%' }}
              />
            </Link>
          </div>
        </section>
        <div>
          <Unit sm="1-2" md="2-3">
            <section className={styles.Section}>
              <header className={styles.Section__Header}>
                <h2>
                  Inventory<small> (6 types at 53 sites)</small>
                </h2>
              </header>
              <div>
                <img
                  alt="inventory"
                  src={require('./inventory.png')}
                  style={{ display: 'block', width: '100%' }}
                />
              </div>
            </section>
          </Unit>
          <Unit sm="1-2" md="1-3">
            <section className={styles.Section}>
              <header className={styles.Section__Header}>
                <h2>
                  Staff<small> (120 at 53 sites)</small>
                </h2>
              </header>
              <div>
                <img
                  alt="staff"
                  src={require('./staff.png')}
                  style={{ display: 'block', width: '100%' }}
                />
              </div>
            </section>
          </Unit>
        </div>
      </Unit>
      <Unit sm="1-2" md="1-3">
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
                <IconButton tooltip="Fix this" iconStyle={{ color: 'gray' }}>
                  <Build />
                </IconButton>
                <IconButton tooltip="Escalate" iconStyle={{ color: '#f57c00' }}>
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
                This device is low on inventory (<b>54 cartridges</b>). It will
                run out in <b>9 days</b> given the curent utilization rate.
              </CardText>
              <CardActions style={{ textAlign: 'right' }}>
                <IconButton tooltip="Fix this" iconStyle={{ color: 'gray' }}>
                  <Build />
                </IconButton>
                <IconButton tooltip="Escalate" iconStyle={{ color: '#f57c00' }}>
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
                Has a high error rate (<b>11%</b>). The average error rate for
                Daktari devices is <b>5%</b>.
              </CardText>
              <CardActions style={{ textAlign: 'right' }}>
                <IconButton tooltip="Fix this" iconStyle={{ color: 'gray' }}>
                  <Build />
                </IconButton>
                <IconButton tooltip="Escalate" iconStyle={{ color: '#f57c00' }}>
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
                This device was expected to come back online <b>yesterday </b>
                after being serviced but has not connected yet.
              </CardText>
              <CardActions style={{ textAlign: 'right' }}>
                <IconButton tooltip="Fix this" iconStyle={{ color: 'gray' }}>
                  <Build />
                </IconButton>
                <IconButton tooltip="Escalate" iconStyle={{ color: '#f57c00' }}>
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

export default enhance(ManageDevices)
