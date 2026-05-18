import React from 'react'
import identity from 'lodash/identity'
import PropTypes from 'prop-types'
import { FaExternalLinkAlt as FaExternalLink } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { compose, setPropTypes, pure } from 'recompose'
import styles from './ReadOnlyField.module.css'

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

export default enhance(ReadOnlyField)
