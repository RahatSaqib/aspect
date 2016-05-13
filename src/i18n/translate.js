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
        let strings = languages[this.context.currentLanguage][key]
        return <Component {...this.props } {...this.state } strings={strings} />
      }
    }

    TranslationComponent.contextTypes = {
      currentLanguage: React.PropTypes.string.isRequired
    }

    return TranslationComponent
  }
}
