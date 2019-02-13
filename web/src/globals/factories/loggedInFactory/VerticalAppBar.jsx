import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'

import ConfluenceIcon from './ConfluenceIcon'
import { toggleDrawer } from '../../../auth/AuthRedux'

const cssClasses = classnames.bind(require('./index.css'))

const enhance = compose(
  withHandlers({
    navigateRoot: ({ history }) => () => history.push('/'),
  }),
  connect(
    null,
    bindActionCreators.bind(null, {
      toggleDrawer,
    })
  )
)

const VerticalAppBar = ({ toggleDrawer, navigateRoot }) => (
  <AppBar className={cssClasses('AppBar__appBar', 'AppBar__appBar--xs')}>
    <Toolbar className={cssClasses('VerticalAppBar')}>
      <IconButton
        className={cssClasses('AppBar__leftIcon')}
        aria-label="Menu"
        onClick={toggleDrawer}
      >
        <MenuIcon fontSize="large" />
      </IconButton>
      <IconButton aria-label="Logo" onClick={navigateRoot}>
        <ConfluenceIcon />
      </IconButton>
    </Toolbar>
  </AppBar>
)

export default enhance(VerticalAppBar)
