import libphonenumber from 'google-libphonenumber'

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance()
const PNF = libphonenumber.PhoneNumberFormat

export function normalizePhoneNumber(phoneNumber, countryAbbreviation) {
  try {
    const phone = phoneUtil.parseAndKeepRawInput(phoneNumber, countryAbbreviation)
    return phoneUtil.format(phone, PNF.E164)
  } catch (e) {
    return null
  }
}
