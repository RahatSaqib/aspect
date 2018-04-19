import _ from 'lodash'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { Link } from 'react-router-dom'
import FaExternalLink from 'react-icons/lib/fa/external-link'

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
  to,
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
      {to && (
        <Link to={to} className={cssClasses('Container__Link')}>
          <FaExternalLink />
        </Link>
      )}
    </div>
  </div>
)

export default enhance(ReadOnlyField)
