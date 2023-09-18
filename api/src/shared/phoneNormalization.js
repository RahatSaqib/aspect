const PNF = require('google-libphonenumber').PhoneNumberFormat
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance()

function normalizePhoneNumber(phoneNumber, countryAbbreviation = 'US') {
  try {
    const phone = phoneUtil.parseAndKeepRawInput(phoneNumber, countryAbbreviation)
    const normalizedPhoneNumber = phoneUtil.format(phone, PNF.E164)
    return normalizedPhoneNumber
  } catch (e) {
    return null
  }
}

module.exports = {
  normalizePhoneNumber,
}
