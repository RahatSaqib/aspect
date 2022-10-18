import { compose, lifecycle } from 'recompose'

const enhance = compose(
  lifecycle({
    componentDidMount() {
      if (!this.props.isLoggedOut) {
        this.props.idleStart()
      }
    },

    UNSAFE_componentWillReceiveProps(nextProps) {
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

/**
 *
 * template for IdleDetection functional component
 *
 */
// export default props => {
//   const prevProps = useRef(props)

//   useEffect(() => {
//     if (!props.isLoggedOut) {
//       props.idleStart()
//     }

//     return () => {
//       if (!props.isLoggedOut) {
//         props.idleStop()
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   useEffect(() => {
//     // Will start the idle monitoring when the user logs in, and stop it if the user is signed out.
//     if (!prevProps.current.isLoggedOut && props.isLoggedOut) {
//       props.idleStop()
//     } else if (prevProps.current.isLoggedOut && !props.isLoggedOut) {
//       props.idleStart()
//     }
//     prevProps.current = props
//   }, [props])

//   return false
// }
