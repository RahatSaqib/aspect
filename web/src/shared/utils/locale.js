import _ from 'lodash'
import enUs from 'date-fns/locale/en-US/'

// FIXME: date-fns-alpha.8 has not supported yet
// import fr from 'date-fns/locale/fr/'

const locales = {
  enUs,
  // fr,
}

export default function getLocale(locale = 'en-US') {
  return _.get(locales, [_.camelCase(locale)]) || locales.enUs
}
