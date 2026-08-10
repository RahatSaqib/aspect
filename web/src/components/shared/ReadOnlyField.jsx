import React from 'react'
import identity from 'lodash/identity'
import PropTypes from 'prop-types'
import { FaExternalLinkAlt as FaExternalLink } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import styles from './ReadOnlyField.module.css'

const readOnlyFieldPropTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  lg: PropTypes.bool,
  hideLabel: PropTypes.bool,
  linkButton: PropTypes.object,
  to: PropTypes.any,
  format: PropTypes.func,
  nullText: PropTypes.string,
}

const readOnlyFieldDefaultProps = {
  value: undefined,
  lg: false,
  hideLabel: false,
  linkButton: null,
  to: undefined,
  format: identity,
  nullText: '-',
}

const ReadOnlyField = ({ label, value, lg, hideLabel, linkButton, to, format, nullText }) =>
  label && (
    <div className={`${styles.Container} ${lg ? styles.Container__large : ''}`}>
      {/* eslint-disable jsx-a11y/label-has-for */}
      <label
        htmlFor={label.replace(' ', '_')}
        className={`${styles.Container__Label} ${hideLabel ? styles.Container__Label__hidden : ''}`}
      >
        {label}
      </label>
      {/* eslint-enable jsx-a11y/label-has-for */}
      <div id={label.replace(' ', '_')} className={styles.Container__Value}>
        {!value ? nullText : format ? format(value) : value}
        {to && (
          <Link to={to} className={styles.Container__Link}>
            <FaExternalLink />
          </Link>
        )}
        {linkButton && (
          <Link to={linkButton.to || '#'} className={styles.button}>
            {linkButton.text}
          </Link>
        )}
      </div>
    </div>
  )

ReadOnlyField.propTypes = readOnlyFieldPropTypes
ReadOnlyField.defaultProps = readOnlyFieldDefaultProps

export default React.memo(ReadOnlyField)
