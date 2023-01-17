import React from 'react'
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import classnames from 'classnames/bind'
import { MdKeyboardArrowLeft } from 'react-icons/md'
import { useNavigate } from 'react-router'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

const DetailHeader = ({ name, children, back, disableBack = false }) => {
  const navigate = useNavigate()

  return (
    <AppBar position="relative" color="white" elevation={0} className={cssClasses('AppBar')} component="nav">
      <Toolbar style={{ padding: '0 16px' }}>
        {!disableBack ? (
          <Button onClick={() => navigate(back || -1)} color="primary">
            <MdKeyboardArrowLeft size={48} />
          </Button>
        ) : null}
        <Typography variant="h5" color="primary" component="div" className={cssClasses('Name')}>
          {name}
        </Typography>
        <Box className={disableBack ? cssClasses('Content-Detail') : cssClasses('Content')}>{children}</Box>
      </Toolbar>
    </AppBar>
  )
}

export default DetailHeader
