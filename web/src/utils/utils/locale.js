import enUs from 'date-fns/locale/en-US/'
import camelCase from 'lodash/camelCase'
import get from 'lodash/get'

// FIXME: date-fns-alpha.8 has not supported yet
// import fr from 'date-fns/locale/fr/'

const locales = {
  enUs,
  // fr,
}

export default function getLocale(locale = 'en-US') {
  return get(locales, [camelCase(locale)]) || locales.enUs
}
