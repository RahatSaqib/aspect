// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl
} from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Link } from 'react-router'

import Paper from 'material-ui/Paper'

// Our own imports
import { Unit } from '../../components/pureGrids'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter } from '../../filter/FilterRedux'
import styles from './ManageDevices.css'

export class ManageDevices extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired
  }

  componentWillMount() {
    const { setPageTitle, configureListFilter } = this.props
    setPageTitle('ManageDevices')
    configureListFilter({
      assayAndResultCategory: true,
      geography: true,
      date: true,
      deviceName: true })
  }

  render() {
    return (
      <div className={styles.Content}>
        <Helmet title="ManageDevices" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ListFilterContainer subject="devices" />
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
                      role="presentation"
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
                    role="presentation"
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
                      role="presentation"
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
                      role="presentation"
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

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    configureListFilter
  }, dispatch)
}

export const ManageDevicesContainer = _.flowRight(
  injectIntl,
  connect(null, mapDispatchToProps)
)(ManageDevices)

