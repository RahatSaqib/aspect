// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'

// Material-UI
import TextField from 'material-ui/TextField'

export class FocusBlurTextField extends PureComponent {
  static defaultProps = {
    onBlur: _.noop,
    onFocus: _.noop,
    onKeyUp: _.noop,
    value: '',
    component: TextField,
  }

  static propTypes = {
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    onKeyUp: PropTypes.func,
    onCommitValue: PropTypes.func.isRequired,
    value: PropTypes.string,
    component: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  }

  state = {
    isFocused: false,
    pendingValue: this.props.value,
  }

  componentWillReceiveProps(nextProps) {
    if (!this.state.isFocused) {
      this.setState({ pendingValue: nextProps.value })
    }
  }

  handleBlur = event => {
    this.setState({ isFocused: false })
    this.props.onBlur(event)

    this.props.onCommitValue(event)
  }

  handleKeyUp = event => {
    this.props.onKeyUp(event)
    if (event.key === 'Enter') {
      this.props.onCommitValue(event)
    }
  }

  handleChange = event => {
    const { value } = event.target || { value: event }
    this.setState({ pendingValue: value })
  }

  handleFocus = event => {
    this.setState({ isFocused: true })
    this.props.onFocus(event)
  }

  render() {
    const { isFocused, pendingValue } = this.state
    const value = isFocused ? pendingValue : this.props.value
    const restProps = _.omit(this.props, ['onCommitValue'])

    return React.createElement(this.props.component, {
      ...restProps,
      onFocus: this.handleFocus,
      onBlur: this.handleBlur,
      onKeyUp: this.handleKeyUp,
      onChange: this.handleChange,
      value,
    })
  }
}

export default FocusBlurTextField
