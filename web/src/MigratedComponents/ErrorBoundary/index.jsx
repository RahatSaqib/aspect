import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error(error)
  }

  render() {
    const { hasError, error } = this.state
    if (hasError) {
      return null
    }

    return this.props.children
  }
}

export default ErrorBoundary
