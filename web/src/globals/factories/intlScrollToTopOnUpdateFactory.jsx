import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { createIntl } from 'react-intl'

export class ScrollToTopOnUpdate extends PureComponent {
  static propTypes = {
    render: PropTypes.func.isRequired,
    delegate: PropTypes.object.isRequired, // eslint-disable-line
  }

  componentDidUpdate({ delegate: { location: prevLocation } }) {
    const { location } = this.props.delegate
    if (location.pathname !== prevLocation.pathname) {
      window.scrollTo(0, 0)
    }
  }

  render() {
    return this.props.render({
      ...this.props.delegate,
      intl: createIntl({ locale: 'en' }),
    })
  }
}

export const intlScrollToTopOnUpdateFactory = render => delegate =>
  <ScrollToTopOnUpdate delegate={delegate} render={render} />

export default intlScrollToTopOnUpdateFactory
