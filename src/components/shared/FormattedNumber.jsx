// Imports from packages
import React from 'react'

// This component returns a number formatted using the user's culture
class FormattedNumber extends React.PureComponent {
  render() {
    return (
        <span>
          {this.props.number.toLocaleString(this.props.culture)}
        </span>
      )
  }
}

FormattedNumber.propTypes = {
  // any instead of number because we might get a percentage
  number: React.PropTypes.any.isRequired,
  culture: React.PropTypes.string.isRequired
}

export default FormattedNumber
