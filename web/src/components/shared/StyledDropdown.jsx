import React from 'react'
import _ from 'lodash'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Input from '@material-ui/core/Input'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  root: {
    color: 'black',
    minWidth: 180,
  },
  select: {
    outlineStyle: 'none',
    border: 'none',
    padding: '8px 12px',
    lineHeight: '20px',
    fontSize: theme.customPropertiesVariables['--aspect-font-size-sm'],
    fontWeight: theme.typography.fontWeightBold,
    color: '#fff',
    backgroundColor:
      theme.customPropertiesVariables['--aspect-color-chill-blue-1'],
    borderRadius:
      theme.customPropertiesVariables['--aspect-button-border-radius'],

    '&:focus': {
      backgroundColor:
        theme.customPropertiesVariables['--aspect-color-chill-blue-1'],
      borderRadius:
        theme.customPropertiesVariables['--aspect-button-border-radius'],
    },
  },
  menu: {
    '& *': {
      fontSize: theme.customPropertiesVariables['--aspect-font-size-sm'],
    },
    '&::-webkit-scrollbar': {
      '-webkit-appearance': 'none',
      width: 10,
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-corner': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: 0,
      backgroundColor: theme.customPropertiesVariables['--aspect-color-grey-5'],
      border: 'none',
    },
  },
})

export const Dropdown = ({ classes, source, ...props }) => (
  <Select
    input={<Input disableUnderline />}
    classes={{ ..._.omit(classes, 'menu') }}
    MenuProps={{ classes: { paper: classes.menu } }}
    {...props}
  >
    {source &&
      source.map(item => (
        <MenuItem key={item.value} value={item.value}>
          {item.label}
        </MenuItem>
      ))}
  </Select>
)

export default withStyles(styles)(Dropdown)
