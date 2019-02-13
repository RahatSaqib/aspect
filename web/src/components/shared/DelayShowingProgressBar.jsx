import _ from 'lodash'
import { compose, lifecycle } from 'recompose'
import CircularProgress from '@material-ui/core/CircularProgress'
import LinearProgress from '@material-ui/core/LinearProgress'

const DELAY = 500

const enhance = compose(
  lifecycle({
    componentWillMount() {
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

    componentWillReceiveProps(nextProps) {
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
      return (
        !_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)
      )
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
