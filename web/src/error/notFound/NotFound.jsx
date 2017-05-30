import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { Link } from 'react-router-dom'
import {
  FormattedMessage
} from 'react-intl'
import Helmet from 'react-helmet'

// Material-UI
import IconButton from 'material-ui/IconButton'
import ActionHome from 'material-ui/svg-icons/action/home'
import ActionBack from 'material-ui/svg-icons/hardware/keyboard-arrow-left'

// Our own imports
import styles from './NotFound.css'

export class NotFound extends PureComponent {

  static defaultProps = {
    history: PropTypes.object.isRequired, // eslint-disable-line
  }

  render() {
    return (
      <div className={styles.Content}>
        <Helmet title="Not Found" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <h1 className={styles.Content__Title}>
          <FormattedMessage
            id="pages.NotFound.title"
            defaultMessage="Not Found"
          />
        </h1>
        <h2 className={styles.Content__HelpBlock}>
          <FormattedMessage
            id="pages.NotFound.help"
            defaultMessage="The page you're looking for doesn't exist."
          />
        </h2>
        <IconButton
          className={styles.Content__Button}
          onTouchTap={this.props.history.goBack}
        >
          <ActionBack />
        </IconButton>
        <Link to="/" ><IconButton className={styles.Content__Button}><ActionHome /></IconButton></Link>
      </div>
    )
  }
}

export default NotFound
