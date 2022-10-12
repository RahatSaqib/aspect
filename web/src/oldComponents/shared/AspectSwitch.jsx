import React from 'react'
import { FormControlLabel, Switch, Typography } from '@mui/material'
import { withStyles } from '@mui/styles'

const styles = theme => ({
  colorBar: {},
  colorChecked: {},
  iOSSwitchBase: {
    '&$iOSChecked': {
      color: theme.palette.common.white,
      '& + $iOSBar': {
        backgroundColor: '#7cb342',
      },
    },
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
      easing: theme.transitions.easing.sharp,
    }),
  },
  iOSChecked: {
    transform: 'translateX(15px)',
    '& + $iOSBar': {
      opacity: 1,
      border: 'none',
    },
  },
  iOSBar: {
    borderRadius: 13,
    width: 42,
    height: 26,
    marginTop: -13,
    marginLeft: -21,
    border: 'solid 1px',
    borderColor: theme.palette.grey[400],
    backgroundColor: theme.palette.grey[50],
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border']),
  },
  iOSIcon: {
    width: 24,
    height: 24,
  },
  iOSIconChecked: {
    boxShadow: theme.shadows[1],
  },
  switchLabel: {
    fontSize: '1em',
    color: 'rgb(0,0,0,0.49)',
    textTransform: 'uppercase',
    fontWeight: '400',
    margin: '2em 0 1em',
  },
})

const AspectSwitch = ({ labelText, classes, ...restProps }) => (
  <FormControlLabel
    label={
      <Typography
        className={classes.switchLabel}
        style={{
          marginTop: '0px',
          marginBottom: '0px',
        }}
      >
        {labelText}
      </Typography>
    }
    control={
      <Switch
        color="secondary"
        {...restProps}
        classes={{
          switchBase: classes.iOSSwitchBase,
          bar: classes.iOSBar,
          icon: classes.iOSIcon,
          iconChecked: classes.iOSIconChecked,
          checked: classes.iOSChecked,
        }}
      />
    }
  />
)
export default withStyles(styles)(AspectSwitch)
