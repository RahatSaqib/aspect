import React from 'react'
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import { MdKeyboardArrowLeft } from 'react-icons/md'
import { useNavigate } from 'react-router'
import styles from './styles.module.css'

// `responsive` opts into the mobile-friendly layout (smaller title, actions wrap
// to a second row, no horizontal overflow). Off by default so list pages that
// share this header keep their original appearance.
const DetailHeader = ({ name, children, back, disableBack = false, responsive = false }) => {
  const navigate = useNavigate()

  return (
    <AppBar
      position="relative"
      color="white"
      elevation={0}
      className={styles.AppBar}
      component="nav"
      sx={responsive ? { overflowX: 'hidden' } : undefined}
    >
      <Toolbar
        sx={
          responsive
            ? {
                padding: { xs: '4px 8px', sm: '0 16px' },
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                alignItems: 'center',
                minHeight: { xs: 'unset', sm: undefined },
              }
            : { padding: '0 16px' }
        }
      >
        {!disableBack ? (
          <Button
            onClick={() => navigate(back || -1)}
            color="primary"
            sx={
              responsive
                ? { minWidth: { xs: 0, sm: 64 }, px: 1, flexShrink: 0, fontSize: { xs: 32, sm: 48 } }
                : undefined
            }
          >
            <MdKeyboardArrowLeft size={responsive ? '1em' : 48} />
          </Button>
        ) : null}
        {/* Responsive row 1: back + title. On mobile, actions drop to row 2 (full width, right-aligned). */}
        <Typography
          variant="h5"
          color="primary"
          component="div"
          className={styles.Name}
          sx={
            responsive
              ? {
                  flex: '1 1 auto',
                  minWidth: 0,
                  wordBreak: 'break-word',
                  fontSize: { xs: '0.95rem', sm: '1.5rem' },
                  lineHeight: { xs: 1.3, sm: 1.334 },
                }
              : undefined
          }
        >
          {name}
        </Typography>
        <Box
          className={styles.Content}
          sx={responsive ? { flex: { xs: '0 0 100%', sm: '1 1 auto' }, pb: { xs: 1, sm: 0 } } : undefined}
        >
          {children}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default DetailHeader
