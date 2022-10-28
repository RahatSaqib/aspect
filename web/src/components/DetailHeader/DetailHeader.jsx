import React from 'react'
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import classnames from 'classnames/bind'
import { MdKeyboardArrowLeft } from 'react-icons/md'
import { useNavigate } from 'react-router'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

const DetailHeader = ({ name, children }) => {
  const navigate = useNavigate()

  return (
    <AppBar position="relative" color="white" elevation={0} className={cssClasses('AppBar')} component="nav">
      <Toolbar>
        <Button onClick={() => navigate(-1)} color="primary">
          <MdKeyboardArrowLeft size={48} />
        </Button>
        <Typography variant="h5" color="primary" component="div" className={cssClasses('Name')}>
          {name}
        </Typography>
        <Box sx={{ display: 'block' }}>{children}</Box>
      </Toolbar>
    </AppBar>
  )
}

export default DetailHeader
