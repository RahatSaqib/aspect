// Imports from packages
import React, { PureComponent, PropTypes } from 'react'

// Material-UI
import TextField from 'material-ui/TextField'

export default class ReadOnlyFields extends PureComponent {
  static propTypes = {
    fields: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]).isRequired
    })).isRequired
  }

  render() {
    const { fields } = this.props

    return (
      <div>
        {fields.map(({label, value}) => (
          <TextField
            key={label}
            disabled
            value={value}
            floatingLabelText={label}
            fullWidth={true}
          />
        ))}
      </div>
    )
  }
}
