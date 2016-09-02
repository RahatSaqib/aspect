// Imports from packages
import React from 'react'
import { Link } from 'react-router'

// Material-UI
import IconButton from 'material-ui/IconButton'
import ActionHome from 'material-ui/svg-icons/action/home'
import ActionBack from 'material-ui/svg-icons/hardware/keyboard-arrow-left'

// Our own imports
import translate from '../../../i18n/translate'

export class NotFound extends React.PureComponent {

  static defaultProps = {
    strings: {
      title: 'Not Found'
    }
  }

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  render() {
    return (
      <div className="error-page">
        <h1>{ this.props.strings.title }</h1>
        <h2>{ this.props.strings.help }</h2>
        <IconButton onTouchTap={ this.context.router.goBack } ><ActionBack /></IconButton>
        <Link to="/" ><IconButton ><ActionHome /></IconButton></Link>
      </div>
    )
  }
}

export const NotFoundContainer = translate('NotFound')(NotFound)
