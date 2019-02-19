// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { withStyles } from '@material-ui/core/styles'
// Material-UI
import TextField from '@material-ui/core/TextField'

const styles = () => ({
  root: {
    marginTop: 8,
    marginBottom: 20,
    width: 256,
  },
})

export class FocusBlurTextField extends PureComponent {
  static defaultProps = {
    onBlur: _.noop,
    onFocus: _.noop,
    onKeyUp: _.noop,
    value: '',
    component: withStyles(styles)(TextField),
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
    const restProps = _.omit(this.props, ['onCommitValue', 'component'])

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
