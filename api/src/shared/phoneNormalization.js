const PNF = require('google-libphonenumber').PhoneNumberFormat
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance()
const Sentry = require('@sentry/node')

function normalizePhoneNumber(phoneNumber, countryAbbreviation = 'US') {
  try {
    const phone = phoneUtil.parseAndKeepRawInput(phoneNumber, countryAbbreviation)
    return phoneUtil.format(phone, PNF.E164)
  } catch (e) {
    Sentry.captureException(e, {
      extra: {
        phone: `${phoneNumber.slice(0, phoneNumber.length - 4)}****`,
      },
    })
    return null
  }
}

module.exports = {
  normalizePhoneNumber,
}
