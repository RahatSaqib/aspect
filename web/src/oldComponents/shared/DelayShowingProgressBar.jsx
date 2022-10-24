import { CircularProgress, LinearProgress } from '@mui/material'
import isEqual from 'lodash/isEqual'
import { compose, lifecycle } from 'recompose'

const DELAY = 500

const enhance = compose(
  lifecycle({
    UNSAFE_componentWillMount() {
      this.setState({
        disabled: this.props.disabled,
      })
    },

    componentDidMount() {
      this.onFutureShow = this.onFutureShow.bind(this)
      if (!this.props.disabled) {
        this.scheduleFutureShowing()
      }
    },

    UNSAFE_componentWillReceiveProps(nextProps) {
      if (nextProps.disabled) {
        this.clearFutureShowing()
        this.setState({
          disabled: true,
        })
      } else if (this.state.disabled) {
        this.scheduleFutureShowing()
      }
    },

    shouldComponentUpdate(nextProps, nextState) {
      return !isEqual(this.props, nextProps) || !isEqual(this.state, nextState)
    },

    componentWillUnmount() {
      this.clearFutureShowing()
    },

    clearFutureShowing() {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
        this.timeoutId = undefined
      }
    },

    scheduleFutureShowing() {
      if (this.timeoutId) {
        return
      }
      this.timeoutId = setTimeout(this.onFutureShow, DELAY)
    },

    onFutureShow() {
      if (this.state.disabled) {
        this.setState({ disabled: false })
      }
      this.timeoutId = undefined
    },
  })
)

export default enhance(LinearProgress)

const DelayShowingProgressCircular = enhance(CircularProgress)
export { DelayShowingProgressCircular }
