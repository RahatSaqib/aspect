import React from 'react'
import * as Sentry from '@sentry/react'
import { ErrorBoundary } from 'react-error-boundary'

const errorStyle = {
  color: 'red',
  margin: 10,
  padding: 10,
  backgroundColor: '#CCC',
  border: '1px solid black',
  height: 'calc(100% - 20px)',
  position: 'absolute',
  width: 'calc(100% - 20px)',
}

function ErrorFallback({ error }) {
  return <pre style={errorStyle}>{error.stack}</pre>
}

const ErrorComponent = ({ fallbackComponent: FallBack, children }) => {
  const Component = process.env.NODE_ENV !== 'production' ? FallBack || ErrorFallback : FallBack
  return process.env.NODE_ENV !== 'production' ? (
    <ErrorBoundary FallbackComponent={Component}>{children}</ErrorBoundary>
  ) : (
    <Sentry.ErrorBoundary fallback={<Component />}>{children}</Sentry.ErrorBoundary>
  )
}

export default ErrorComponent
