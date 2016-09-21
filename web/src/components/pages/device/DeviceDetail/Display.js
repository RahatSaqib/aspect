// Imports from packages
import React from 'react'

// Material-UI
import TextField from 'material-ui/TextField'

export default class Display extends React.PureComponent {
  static propTypes = {
    fields: React.PropTypes.arrayOf(React.PropTypes.shape({
      label: React.PropTypes.string.isRequired,
      value: React.PropTypes.string.isRequired
    })).isRequired
  }

  render() {
    const { fields } = this.props

    return (
      <div>
        {fields.map(({label, value}) => (
          <TextField
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
