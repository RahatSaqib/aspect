// Imports from packages
import React, { PureComponent, PropTypes } from 'react'

// Material-UI
import TextField from 'material-ui/TextField'

export class ReadOnlyField extends PureComponent {
  static propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]).isRequired
  }

  render() {
    const { label, value } = this.props

    return (
      <TextField
        disabled
        value={value}
        floatingLabelText={label}
        fullWidth
      />
    )
  }
}

export class ReadOnlyFields extends PureComponent {
  static propTypes = {
    fields: PropTypes.arrayOf(
      PropTypes.shape(ReadOnlyField.propTypes)
    ).isRequired
  }

  render() {
    const { fields, ...restProps } = this.props

    return (
      <div {...restProps}>
        {fields.map(({ label, value }) => (
          <ReadOnlyField
            key={label}
            label={label}
            value={value}
          />
        ))}
      </div>
    )
  }
}

export default ReadOnlyFields
