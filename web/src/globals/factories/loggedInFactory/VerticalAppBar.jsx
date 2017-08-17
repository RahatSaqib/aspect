import classnames from 'classnames/bind'
import React from 'react'
import { compose } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import AppBar from 'react-toolbox/lib/app_bar'
import MdMenuIcon from 'react-icons/lib/md/menu'

import ConfluenceIcon from './ConfluenceIcon'
import { toggleDrawer, navigateRoot } from '../../../auth/AuthRedux'

const cssClasses = classnames.bind(require('./index.css'))

const enhance = compose(
  connect(
    null,
    bindActionCreators.bind(null, {
      toggleDrawer,
      navigateRoot,
    })
  )
)

const VerticalAppBar = ({ toggleDrawer, navigateRoot }) =>
  <AppBar
    leftIcon={<MdMenuIcon />}
    onLeftIconClick={toggleDrawer}
    rightIcon={<ConfluenceIcon />}
    onRightIconClick={navigateRoot}
    theme={{
      appBar: cssClasses('AppBar__appBar', 'AppBar__appBar--xs'),
      leftIcon: cssClasses('AppBar__leftIcon'),
    }}
  />

export default enhance(VerticalAppBar)
