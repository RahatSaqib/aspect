import _ from 'lodash'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'

const cssClasses = classnames.bind(require('./ReadOnlyField.css'))

const enhance = compose(
  pure,
  setPropTypes({
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
    lg: PropTypes.bool,
    format: PropTypes.func,
    nullText: PropTypes.string,
  })
)

export const ReadOnlyField = ({
  label,
  value,
  lg,
  hideLabel = false,
  format = _.identity,
  nullText = '-',
}) => (
  <div className={cssClasses('Container', { 'Container--large': lg })}>
    <label
      htmlFor={label.replace(' ', '_')}
      className={cssClasses('Container__Label', {
        'Container__Label--hidden': hideLabel,
      })}
    >
      {label}
    </label>
    <div
      id={label.replace(' ', '_')}
      className={cssClasses('Container__Value')}
    >
      {!value ? nullText : format ? format(value) : value}
    </div>
  </div>
)

export default enhance(ReadOnlyField)
