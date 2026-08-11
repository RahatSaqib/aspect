const config = {
  aspectApi: __APP_ENV__.aspectApi,
  sentry: {
    dsn: __APP_ENV__['sentry.dsn'],
    tracingOrigins: JSON.parse(__APP_ENV__['sentry.tracingOrigins']),
    tracesSampleRate: __APP_ENV__['sentry.tracesSampleRate'],
  },
  userInactiveMinutes: parseInt(__APP_ENV__.userInactiveMinutes, 10),
  supportEmail: __APP_ENV__.supportEmail,
  defaultCulture: __APP_ENV__.defaultCulture,
  googleAnalyticsMeasurementId: __APP_ENV__.googleAnalyticsMeasurementId,
}

export default config
