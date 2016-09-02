// Imports from packages
import React from 'react'

// This component returns a number formatted using the user's culture
class FormattedNumber extends React.PureComponent {

  static propTypes = {
    // any instead of number because we might get a percentage
    number: React.PropTypes.any.isRequired,
    culture: React.PropTypes.string.isRequired
  }

  render() {
    return (
        <span>
          {this.props.number.toLocaleString(this.props.culture)}
        </span>
      )
  }
}

export default FormattedNumber
