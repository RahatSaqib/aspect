import React from 'react'
import { Link } from 'react-router'
import PureRenderMixin from 'react-addons-pure-render-mixin'

// Material-UI
import IconButton from 'material-ui/IconButton'
import ActionHome from 'material-ui/svg-icons/action/home'
import ActionBack from 'material-ui/svg-icons/hardware/keyboard-arrow-left'

import translate from '../../../i18n/translate'

export class NotFound extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
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

NotFound.defaultProps = {
  strings: {
    title: 'Not Found'
  }
}

NotFound.contextTypes = {
  router: React.PropTypes.object.isRequired
}

export const NotFoundContainer = translate('NotFound')(NotFound)
