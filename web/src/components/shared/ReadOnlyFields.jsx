// Imports from packages
import React, { PropTypes } from 'react'
import { compose, setPropTypes, pure } from 'recompose'

// Material-UI
import TextField from 'material-ui/TextField'

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
  <TextField
    disabled
    value={value}
    floatingLabelText={label}
    fullWidth
  />
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
