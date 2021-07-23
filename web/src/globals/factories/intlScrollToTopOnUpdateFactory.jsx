import PropTypes from 'prop-types'
import React, { useEffect, useMemo, useRef } from 'react'
import { createIntl } from 'react-intl'
import { useLocation } from 'react-router-dom'

// export class ScrollToTopOnUpdate extends React.PureComponent {
//   static propTypes = {
//     render: PropTypes.func.isRequired,
//     delegate: PropTypes.object.isRequired, // eslint-disable-line
//   }

//   componentDidUpdate({ delegate: { location: prevLocation } }) {
//     const { location } = this.props.delegate
//     if (location.pathname !== prevLocation.pathname) {
//       window.scrollTo(0, 0)
//     }
//   }

//   render() {
//     return this.props.render({
//       ...this.props.delegate,
//       intl: createIntl({ locale: 'en' }),
//     })
//   }
// }

export const ScrollToTopOnUpdate = ({ delegate, render }) => {
  const location = useLocation()
  // const refPathname = useRef(delegate.location.pathname)
  const refPathname = useRef(location.pathname)

  const intl = useMemo(() => {
    return createIntl({ locale: 'en' })
  }, [])

  useEffect(() => {
    if (refPathname.current !== location.pathname) {
      refPathname.current = location.pathname
      window.scrollTo(0, 0)
    }
    // }, [delegate.location.pathname])
  }, [location.pathname])

  return render({
    ...delegate,
    intl,
  })
}

ScrollToTopOnUpdate.propTypes = {
  render: PropTypes.func.isRequired,
  delegate: PropTypes.object.isRequired, // eslint-disable-line
}

export const intlScrollToTopOnUpdateFactory = render => delegate =>
  <ScrollToTopOnUpdate delegate={delegate} render={render} />

export default intlScrollToTopOnUpdateFactory
