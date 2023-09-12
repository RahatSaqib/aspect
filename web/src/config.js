const config = {
  aspectApi: process.env.aspectApi,
  sentry: {
    dsn: process.env['sentry.dsn'],
    tracingOrigins: JSON.parse(process.env['sentry.tracingOrigins']),
    tracesSampleRate: process.env['sentry.tracesSampleRate'],
  },
  piwik: {
    url: process.env['piwik.url'],
    siteId: process.env['piwik.siteId'],
  },
  userInactiveMinutes: parseInt(process.env.userInactiveMinutes, 10),
  supportEmail: process.env.supportEmail,
}

export default config
