import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { intlShape } from 'react-intl'

export class ScrollToTopOnUpdate extends PureComponent {
  static propTypes = {
    render: PropTypes.func.isRequired,
    delegate: PropTypes.object.isRequired, // eslint-disable-line
  }

  static contextTypes = {
    intl: intlShape,
  }

  componentDidUpdate({ delegate: { location: prevLocation } }) {
    if (this.props.delegate.location !== prevLocation) {
      window.scrollTo(0, 0)
    }
  }

  render() {
    return this.props.render({
      ...this.props.delegate,
      intl: this.context.intl,
    })
  }
}

export const intlScrollToTopOnUpdateFactory = render => delegate => (
  <ScrollToTopOnUpdate render={render} delegate={delegate} />
)

export default intlScrollToTopOnUpdateFactory
