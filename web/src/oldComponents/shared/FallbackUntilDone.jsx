/* eslint-disable react/no-find-dom-node */
import React, { PureComponent } from 'react'
import classnames from 'classnames'
import elementResizeDetectorMaker from 'element-resize-detector'
import noop from 'lodash/noop'
import omit from 'lodash/omit'
import throttle from 'lodash/throttle'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'

class FallbackUntilDone extends PureComponent {
  static propTypes = {
    component: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
    className: PropTypes.string,
    fallbacks: PropTypes.arrayOf(PropTypes.object).isRequired,
    isDone: PropTypes.func.isRequired,
  }

  static defaultProps = {
    component: 'div',
    className: '',
  }

  // eslint-disable-next-line react/sort-comp
  erd = elementResizeDetectorMaker({
    strategy: 'scroll', // <- For ultra performance.
  })

  state = this.initialState()

  handleResize = throttle(() => {
    this.setState(this.initialState)
  }, 1000)

  componentDidMount() {
    window.addEventListener('resize', this.handleResize)
  }

  componentDidUpdate() {
    if (!this.state.isStable) {
      this.setState(this.updateState) // eslint-disable-line react/no-did-update-set-state
    }
  }

  componentWillUnmount() {
    this.setState = noop
    this.erd.uninstall(ReactDOM.findDOMNode(this.node))
    window.removeEventListener('resize', this.handleResize)
  }

  handleRefMount = node => {
    if (this.node) {
      this.erd.removeAllListeners(ReactDOM.findDOMNode(this.node))
    }
    this.node = node
    if (this.node) {
      this.erd.listenTo(ReactDOM.findDOMNode(this.node), this.handleResize)
    }
    this.setState(this.updateState)
  }

  updateState = (prevState, props) => {
    if (!this.node || prevState.isStable) {
      return {}
    }
    if (props.isDone(this.node)) {
      return {
        isStable: true,
      }
    }
    if (prevState.fallbackIndex + 1 < props.fallbacks.length) {
      return {
        fallbackIndex: prevState.fallbackIndex + 1,
      }
    }
    return {
      isStable: true,
    }
  }

  initialState() {
    return {
      fallbackIndex: 0,
      isStable: false,
    }
  }

  render() {
    const { component, className, fallbacks, ...rest } = this.props
    const fallback = fallbacks[this.state.fallbackIndex]

    const restProps = omit(rest, ['isDone'])

    return React.createElement(component, {
      ...restProps,
      ...fallback,
      ref: this.handleRefMount,
      className: classnames(className, fallback.className),
    })
  }
}

export default FallbackUntilDone
