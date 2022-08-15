import classnames from 'classnames/bind'
import React from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import { useNavigate } from 'react-router-dom'

import ConfluenceIcon from './ConfluenceIcon'
import { toggleDrawer } from '../../../store/AuthRedux'

import styles from './index.css'

const cssClasses = classnames.bind(styles)

const enhance = compose(
  connect(null, {
    toggleDrawer,
  })
)

const VerticalAppBar = ({ toggleDrawer }) => {
  const navigate = useNavigate()
  const navigateRoot = () => navigate('/')

  return (
    <AppBar className={cssClasses('AppBar__appBar', 'AppBar__appBar--xs')} color="inherit">
      <Toolbar className={cssClasses('VerticalAppBar')}>
        <IconButton className={cssClasses('AppBar__leftIcon')} aria-label="Menu" onClick={toggleDrawer}>
          <MenuIcon fontSize="large" />
        </IconButton>
        <IconButton aria-label="Logo" onClick={navigateRoot}>
          <ConfluenceIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}

export default enhance(VerticalAppBar)
