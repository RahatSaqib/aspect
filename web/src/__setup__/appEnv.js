// Vite inlines __APP_ENV__ at build time; under Jest the values come from .env.test via dotenv/config.
// eslint-disable-next-line no-underscore-dangle
global.__APP_ENV__ = process.env
