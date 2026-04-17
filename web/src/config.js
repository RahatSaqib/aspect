const config = {
  aspectApi: process.env.aspectApi,
  sentry: {
    dsn: process.env['sentry.dsn'],
    tracingOrigins: JSON.parse(process.env['sentry.tracingOrigins']),
    tracesSampleRate: process.env['sentry.tracesSampleRate'],
  },
  userInactiveMinutes: parseInt(process.env.userInactiveMinutes, 10),
  supportEmail: process.env.supportEmail,
  defaultCulture: process.env.defaultCulture,
  showFormsMenu: process.env.showFormsMenu === 'true',
}

export default config
