// Imports from packages
import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'

// This component returns a number formatted using the user's culture
class FormattedNumber extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
  }

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
