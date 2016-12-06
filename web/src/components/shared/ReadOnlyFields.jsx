// Imports from packages
import React, { PropTypes } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import classnames from 'classnames/bind'

import styles from './ReadOnlyFields.css'

const cssClasses = classnames.bind(styles)

const enhanceField = compose(
  setPropTypes({
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]).isRequired
  }),
  pure
)

export const ReadOnlyField = enhanceField(({ label, value }) => (
  <div className={cssClasses('FieldContainer')}>
    <label htmlFor={label.replace(' ', '_')} className={cssClasses('FieldContainer__Label')}>{label}</label>
    <div id={label.replace(' ', '_')}>{value || '-'}</div>
  </div>
))

const enhanceFields = compose(
  setPropTypes({
    fields: PropTypes.arrayOf(
      PropTypes.shape(ReadOnlyField.propTypes)
    ).isRequired
  }),
  pure
)

export const ReadOnlyFields = enhanceFields(({ fields, ...restProps }) => (
  <div {...restProps}>
    {fields.map(({ label, value }) => (
      <ReadOnlyField
        key={label}
        label={label}
        value={value}
      />
    ))}
  </div>
))

export default ReadOnlyFields
