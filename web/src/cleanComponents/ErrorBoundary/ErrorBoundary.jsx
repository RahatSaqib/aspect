import React from 'react'
import * as Sentry from '@sentry/react'
import { ErrorBoundary } from 'react-error-boundary'
import { useIntl } from 'react-intl'
import messages from '../../messages/allMessages'

const errorStyle = {
  color: 'red',
  margin: 10,
  padding: 10,
  backgroundColor: '#CCC',
  border: '1px solid black',
  height: 'calc(100% - 20px)',
  width: 'calc(100% - 20px)',
  wordWrap: 'break-word',
  whiteSpace: 'pre-wrap',
}

function ErrorFallback({ error }) {
  return <pre style={errorStyle}>{error.stack}</pre>
}

function ErrorFallbackProd({ error }) {
  const { formatMessage } = useIntl()
  return (
    <pre style={errorStyle}>
      <p>{formatMessage(messages.errorBoundaryMessage)}</p>
      <div>{error.toString()}</div>
    </pre>
  )
}

const ErrorComponent = ({ fallbackComponent: FallBack, children }) => {
  let Component

  const isProd = process.env.NODE_ENV === 'production'
  if (isProd) {
    Component = FallBack || ErrorFallbackProd
  } else Component = ErrorFallback

  return isProd ? (
    <Sentry.ErrorBoundary fallback={({ error }) => <Component error={error} />}>{children}</Sentry.ErrorBoundary>
  ) : (
    <ErrorBoundary FallbackComponent={Component}>{children}</ErrorBoundary>
  )
}

export default ErrorComponent
