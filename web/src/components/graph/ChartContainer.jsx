import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Alert from './ChartAlert'
import styles from './ChartContainer.css'

const cssClasses = classnames.bind(styles)

const ChartContainer = props =>
  <div className={cssClasses(props.className, 'graph')}>
    {!props.bottomTitle &&
      <h1 className={cssClasses('title')}>
        {props.title}
      </h1>}
    {props.children}
    {props.bottomTitle &&
      <h1 className={cssClasses('title')}>
        {props.title}
      </h1>}
    {props.alertMsg &&
      <Alert status={props.alert} statusString={props.alertMsg} />}
  </div>

ChartContainer.propTypes = {
  className: PropTypes.string,
  title: PropTypes.string,
  bottomTitle: PropTypes.bool,
  alert: PropTypes.string,
  alertMsg: PropTypes.string,
  children: PropTypes.element.isRequired,
}

ChartContainer.defaultProps = {
  className: '',
  title: '',
  bottomTitle: false,
  alertMsg: '',
  alert: '',
}

export default ChartContainer
