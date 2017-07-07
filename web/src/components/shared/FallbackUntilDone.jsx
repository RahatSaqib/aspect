/* eslint-disable react/no-find-dom-node */
import elementResizeDetectorMaker from 'element-resize-detector'
import _ from 'lodash'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'

class FallbackUntilDone extends PureComponent {
  static propTypes = {
    component: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
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

  componentDidMount() {
    window.addEventListener('resize', this.handleResize)
  }

  componentDidUpdate() {
    if (!this.state.isStable) {
      this.setState(this.updateState) // eslint-disable-line react/no-did-update-set-state
    }
  }

  componentWillUnmount() {
    this.erd.uninstall(ReactDOM.findDOMNode(this.node))
    window.removeEventListener('resize', this.handleResize)
  }

  initialState() {
    return {
      fallbackIndex: 0,
      isStable: false,
    }
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

  handleResize = _.throttle(() => {
    this.setState(this.initialState)
  }, 1000)

  updateState = (prevState, props) => {
    if (!this.node || prevState.isStable) {
      return {}
    } else if (props.isDone(this.node)) {
      return {
        isStable: true,
      }
    } else if (prevState.fallbackIndex + 1 < props.fallbacks.length) {
      return {
        fallbackIndex: prevState.fallbackIndex + 1,
      }
    }
    return {
      isStable: true,
    }
  }

  render() {
    const { component, className, fallbacks, isDone, ...restProps } = this.props
    const fallback = fallbacks[this.state.fallbackIndex]

    return React.createElement(component, {
      ...restProps,
      ...fallback,
      ref: this.handleRefMount,
      className: classnames(className, fallback.className),
    })
  }
}

export default FallbackUntilDone
