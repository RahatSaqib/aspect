import React, { Fragment } from 'react'
import * as Sentry from '@sentry/react'
import PropTypes from 'prop-types'
import IconProvider from '../IconProvider'

const ErrorIcon = () => <IconProvider icon="FaExclamationCircle" className="errorBoundary__error" />

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.props = props
    this.state = {
      hasError: false,
      FallBackComponent: this.props.fallbackComponent,
      isDevelopment: process.env.NODE_ENV !== 'production',
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    if (this.state.isDevelopment) {
      console.error(error, errorInfo.componentStack)
    }
  }

  render() {
    const { children } = this.props
    const { hasError, isDevelopment, FallBackComponent } = this.state

    if (hasError && isDevelopment) {
      return (
        <Fragment>
          {isDevelopment && !FallBackComponent && <ErrorIcon />}
          {FallBackComponent && <FallBackComponent />}
          {null}
        </Fragment>
      )
    }
    if (!isDevelopment) {
      return <Sentry.ErrorBoundary fallback={FallBackComponent}>{children}</Sentry.ErrorBoundary>
    }
    return children
  }
}
ErrorBoundary.defaultProps = {
  fallbackComponent: false,
}

ErrorBoundary.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
  fallbackComponent: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
}

export default ErrorBoundary
