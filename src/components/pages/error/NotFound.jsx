// Imports from packages
import React from 'react'
import {
  withRouter,
  Link
} from 'react-router'
import {
  FormattedMessage
} from 'react-intl'

// Material-UI
import IconButton from 'material-ui/IconButton'
import ActionHome from 'material-ui/svg-icons/action/home'
import ActionBack from 'material-ui/svg-icons/hardware/keyboard-arrow-left'

export class NotFound extends React.PureComponent {

  static defaultProps = {
    router: React.PropTypes.object.isRequired
  }

  render() {
    return (
      <div className="error-page">
        <h1>
          <FormattedMessage
            id="pages.NotFound.title"
            defaultMessage="Not Found"
          />
        </h1>
        <h2>
          <FormattedMessage
            id="pages.NotFound.help"
            defaultMessage="The page you're looking for doesn't exist."
          />
        </h2>
        <IconButton onTouchTap={ this.props.router.goBack } ><ActionBack /></IconButton>
        <Link to="/" ><IconButton ><ActionHome /></IconButton></Link>
      </div>
    )
  }
}

export const NotFoundContainer = withRouter(NotFound)
