import React from 'react'
import * as Sentry from '@sentry/react'
import { ErrorBoundary } from 'react-error-boundary'
import { defineMessages } from 'react-intl'
import useI18n from '../../hooks/useI18n'

const messages = defineMessages({
  errorBoundaryMessage: {
    id: 'pages.errorBoundary.message',
    defaultMessage:
      "Oops! Something went wrong. Our team has been notified, and we're working to fix the issue. Please try again later. If the problem persists, contact our support team and provide them with the folowing error:",
  },
})

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
  const { formatMessage } = useI18n()
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
    <Sentry.ErrorBoundary fallback={Component}>{children}</Sentry.ErrorBoundary>
  ) : (
    <ErrorBoundary FallbackComponent={Component}>{children}</ErrorBoundary>
  )
}

export default ErrorComponent
