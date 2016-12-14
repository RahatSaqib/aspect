// Imports from packages
import React, { PropTypes } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import classnames from 'classnames/bind'

import styles from './ReadOnlyFields.css'

const cssClasses = classnames.bind(styles)

const enhanceField = compose(
  setPropTypes({
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
    lg: PropTypes.bool,
    format: PropTypes.func
  }),
  pure
)

export const ReadOnlyField = enhanceField(({ label, value, lg, format }) => (
  <div className={cssClasses('FieldContainer', { 'FieldContainer--large': lg })}>
    <label htmlFor={label.replace(' ', '_')} className={cssClasses(lg ? 'FieldContainerLarge__Label' : 'FieldContainer__Label')}>{label}</label>
    <div id={label.replace(' ', '_')}>{format && value ? format(value) : value || '-'}</div>
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
