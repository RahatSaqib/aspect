import deLocale from 'date-fns/locale/de'
import usLocale from 'date-fns/locale/en-US'
import esLocale from 'date-fns/locale/es'
import frLocale from 'date-fns/locale/fr'
import ptLocale from 'date-fns/locale/pt'
import ruLocale from 'date-fns/locale/ru'
import ukLocale from 'date-fns/locale/uk'

const dateFNSLocales = {
  de: deLocale,
  'de-DE': deLocale,
  en: usLocale,
  'en-US': usLocale,
  fr: frLocale,
  'fr-FR': frLocale,
  pt: ptLocale,
  'pt-PT': ptLocale,
  ru: ruLocale,
  'ru-RU': ruLocale,
  uk: ukLocale,
  'uk-UA': ukLocale,
  es: esLocale,
  'es-ES': esLocale,
}

export default dateFNSLocales
