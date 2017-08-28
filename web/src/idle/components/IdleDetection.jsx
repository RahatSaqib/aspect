import { compose, lifecycle } from 'recompose'

const enhance = compose(
  lifecycle({
    componentDidMount() {
      if (!this.props.isLoggedOut) {
        this.props.idleStart()
      }
    },

    componentWillReceiveProps(nextProps) {
      // Will start the idle monitoring when the user logs in, and stop it if the user is signed out.
      if (!this.props.isLoggedOut && nextProps.isLoggedOut) {
        this.props.idleStop()
      } else if (this.props.isLoggedOut && !nextProps.isLoggedOut) {
        this.props.idleStart()
      }
    },

    componentWillUnmount() {
      if (!this.props.isLoggedOut) {
        this.props.idleStop()
      }
    },
  })
)

export const IdleDetection = () => false

export default enhance(IdleDetection)
