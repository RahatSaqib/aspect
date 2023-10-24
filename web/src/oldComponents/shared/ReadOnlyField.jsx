import React from 'react'
import classnames from 'classnames/bind'
import identity from 'lodash/identity'
import PropTypes from 'prop-types'
import { FaExternalLinkAlt as FaExternalLink } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { compose, setPropTypes, pure } from 'recompose'
import styles from './ReadOnlyField.css'

const cssClasses = classnames.bind(styles)

const readOnlyFieldPropTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  lg: PropTypes.bool,
  format: PropTypes.func,
  nullText: PropTypes.string,
}

const enhance = compose(pure, setPropTypes(readOnlyFieldPropTypes))

const ReadOnlyField = ({
  label,
  value,
  lg,
  hideLabel = false,
  linkButton = null,
  to,
  format = identity,
  nullText = '-',
}) =>
  label && (
    <div className={cssClasses('Container', { 'Container--large': lg })}>
      {/* eslint-disable jsx-a11y/label-has-for */}
      <label
        htmlFor={label.replace(' ', '_')}
        className={cssClasses('Container__Label', {
          'Container__Label--hidden': hideLabel,
        })}
      >
        {label}
      </label>
      {/* eslint-enable jsx-a11y/label-has-for */}
      <div id={label.replace(' ', '_')} className={cssClasses('Container__Value')}>
        {!value ? nullText : format ? format(value) : value}
        {to && (
          <Link to={to} className={cssClasses('Container__Link')}>
            <FaExternalLink />
          </Link>
        )}
        {linkButton && (
          <Link to={linkButton.to || '#'} className={cssClasses('button')}>
            {linkButton.text}
          </Link>
        )}
      </div>
    </div>
  )

export default enhance(ReadOnlyField)
