// Imports from packages
import noop from 'lodash/noop'
import omit from 'lodash/omit'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { withStyles } from '@mui/styles'
// Material-UI
import TextField from '@mui/material/TextField'

const styles = () => ({
  root: {
    marginTop: 0,
    marginBottom: 20,
    width: 256,
  },
})

export class FocusBlurTextField extends PureComponent {
  static propTypes = {
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    onKeyUp: PropTypes.func,
    onCommitValue: PropTypes.func.isRequired,
    value: PropTypes.string,
    component: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.func,
      PropTypes.object, // type of default object after withStyles()()
    ]),
  }

  static defaultProps = {
    onBlur: noop,
    onFocus: noop,
    onKeyUp: noop,
    value: '',
    component: withStyles(styles)(TextField),
  }

  constructor(props) {
    super(props)

    this.state = {
      isFocused: false,
      pendingValue: props.value,
    }
  }

  componentDidUpdate(prevProps) {
    if (!this.state.isFocused && prevProps.value !== this.props.value) {
      this.setState({ pendingValue: this.props.value }) // eslint-disable-line react/no-did-update-set-state
    }
  }

  handleBlur = event => {
    this.setState({ isFocused: false, pendingValue: this.props.value })
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
    const restProps = omit(this.props, ['onCommitValue', 'component'])

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
