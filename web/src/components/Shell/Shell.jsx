import React from 'react'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import styles from './Shell.css'

const cssClasses = classnames.bind(styles)

const CasesShell = ({ children }) => {
  return (
    <Grid container spacing={24}>
      <Grid item xs={12}>
        <Card className={cssClasses('shell__container')}>{children}</Card>
      </Grid>
    </Grid>
  )
}

CasesShell.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
}

export default CasesShell
