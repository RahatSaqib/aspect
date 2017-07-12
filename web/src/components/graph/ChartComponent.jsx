import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Alert from './ChartAlert'
import styles from './ChartComponent.css'

const cssClasses = classnames.bind(styles)

const ChartComponent = ({ alert, alertMsg, title }) => (
  <div className={cssClasses('graph')}>
    <h1 className={cssClasses('title')}>
      {title}
    </h1>
    {this.props.children}
    {alertMsg && <Alert status={alert} statusString={alertMsg} />}
  </div>
)

ChartComponent.propTypes = {
  title: PropTypes.string,
  alert: PropTypes.string,
  alertMsg: PropTypes.string,
}

ChartComponent.defaultProps = {
  title: '',
  alertMsg: '',
  alert: '',
}

export default ChartComponent
