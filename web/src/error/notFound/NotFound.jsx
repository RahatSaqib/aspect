import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { Link } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'
import Helmet from 'react-helmet'

// Material-UI
import IconButton from 'material-ui/IconButton'
import ActionHome from 'material-ui/svg-icons/action/home'
import ActionBack from 'material-ui/svg-icons/hardware/keyboard-arrow-left'

const cssClasses = classnames.bind(require('./NotFound.css'))

export class NotFound extends PureComponent {
  static defaultProps = {
    history: PropTypes.object.isRequired, // eslint-disable-line
  }

  render() {
    return (
      <div className={cssClasses('Container')}>
        <Helmet title="Not Found" />
        <h1 className={cssClasses('Container__Title')}>
          <FormattedMessage
            id="pages.NotFound.title"
            defaultMessage="Not Found"
          />
        </h1>
        <h2 className={cssClasses('Container__HelpBlock')}>
          <FormattedMessage
            id="pages.NotFound.help"
            defaultMessage="The page you're looking for doesn't exist."
          />
        </h2>
        <IconButton
          className={cssClasses('Container__Button')}
          onClick={this.props.history.goBack}
        >
          <ActionBack />
        </IconButton>
        <Link to="/">
          <IconButton className={cssClasses('Container__Button')}>
            <ActionHome />
          </IconButton>
        </Link>
      </div>
    )
  }
}

export default NotFound
