// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'

// Material-UI
import TextField from 'material-ui/TextField'

export class FocusBlurTextField extends PureComponent {

  static defaultProps = {
    onBlur: _.noop,
    onFocus: _.noop,
    onKeyUp: _.noop
  }

  static propTypes = {
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    onKeyUp: PropTypes.func,
    onCommitValue: PropTypes.func.isRequired,
    value: PropTypes.string
  }

  state = {
    isFocused: false,
    pendingValue: this.props.value
  }

  componentWillReceiveProps(nextProps) {
    if (!this.state.isFocused) {
      this.setState({ pendingValue: nextProps.value })
    }
  }

  handleBlur = (...args) => {
    this.setState({ isFocused: false })
    this.props.onBlur(...args)

    const event = args[0]
    this.props.onCommitValue(event)
  }

  handleKeyUp = (event) => {
    this.props.onKeyUp(event)
  }

  handleChange = (event) => {
    const { value } = event.target
    this.setState({ pendingValue: value })
  }

  handleFocus = (...args) => {
    this.setState({ isFocused: true })
    this.props.onFocus(...args)
  }

  render() {
    const { isFocused, pendingValue } = this.state
    const value = isFocused ? pendingValue : this.props.value
    const restProps = _.omit(this.props, ['onCommitValue'])

    return (
      <TextField
        {...restProps}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        onKeyUp={this.handleKeyUp}
        onChange={this.handleChange}
        value={value}
      />
    )
  }
}

export default FocusBlurTextField
