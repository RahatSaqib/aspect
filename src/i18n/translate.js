import { default as React } from 'react'
import en from './en'
import fr from './fr'

const languages = {
  en,
  fr
}

export default function translate(key) {
  return Component => {
    class TranslationComponent extends React.Component {
      render() {
        let lang = this.context.currentLanguage || 'en'
        let culture = this.context.currentCulture || 'en-US'

        let strings = languages[lang][key]
        strings.culture = culture

        return <Component {...this.props } {...this.state } strings={strings} />
      }
    }

    TranslationComponent.contextTypes = {
      currentLanguage: React.PropTypes.string,
      currentCulture: React.PropTypes.string
    }

    return TranslationComponent
  }
}
