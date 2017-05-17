import PropTypes from 'prop-types'
import { PureComponent, Children } from 'react'

export class ScrollToTopOnUpdate extends PureComponent {

  static propTypes = {
    children: PropTypes.node.isRequired,
    location: PropTypes.instanceOf(Object).isRequired
  }

  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      window.scrollTo(0, 0)
    }
  }

  render() {
    return Children.only(this.props.children)
  }
}

export default ScrollToTopOnUpdate

