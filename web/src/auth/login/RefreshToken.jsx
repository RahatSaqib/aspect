import { compose, lifecycle } from 'recompose'

const enhance = compose(
  lifecycle({
    handleInterval() {
      this.props.refreshStart()
    },

    componentDidMount() {
      // Refresh the access token every 30 minutes.
      this.intervalId = setInterval(
        this.handleInterval.bind(this),
        30 * 60 * 1000
      )
    },

    componentWillUnmount() {
      if (this.intervalId) {
        clearInterval(this.intervalId)
      }
    },
  })
)

export const RefreshToken = () => false

export default enhance(RefreshToken)
