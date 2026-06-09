import React from 'react'
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import { MdKeyboardArrowLeft } from 'react-icons/md'
import { useNavigate } from 'react-router'
import styles from './styles.module.css'

const DetailHeader = ({ name, children, back, disableBack = false }) => {
  const navigate = useNavigate()

  return (
    <AppBar position="relative" color="white" elevation={0} className={styles.AppBar} component="nav">
      <Toolbar
        sx={{
          padding: { xs: '4px 8px', sm: '0 16px' },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          alignItems: 'center',
          minHeight: { xs: 'unset', sm: undefined },
        }}
      >
        {!disableBack ? (
          <Button onClick={() => navigate(back || -1)} color="primary" sx={{ minWidth: 0, px: 1, flexShrink: 0 }}>
            <MdKeyboardArrowLeft size={32} />
          </Button>
        ) : null}
        {/* Row 1: back + title. On mobile, buttons drop to row 2 (full width, right-aligned). */}
        <Typography
          variant="h5"
          color="primary"
          component="div"
          className={styles.Name}
          sx={{
            flex: '1 1 auto',
            fontSize: { xs: '0.95rem', sm: '1.25rem', md: '1.5rem' },
            lineHeight: 1.3,
          }}
        >
          {name}
        </Typography>
        <Box
          className={styles.Content}
          sx={{ flex: { xs: '0 0 100%', sm: '0 0 auto' }, justifyContent: 'flex-end', pb: { xs: 1, sm: 0 } }}
        >
          {children}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default DetailHeader
