import React from 'react'
import omit from 'lodash/omit'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Input from '@mui/material/Input'
import { withStyles } from '@mui/styles'
import useI18n from '../../Hooks/i18n/useI18n'

const styles = theme => ({
  root: {
    color: 'black',
    minWidth: 180,
  },
  icon: {
    color: theme.customPropertiesVariables['--aspect-color-white'],
  },
  select: {
    outlineStyle: 'none',
    border: 'none',
    padding: '8px 12px',
    lineHeight: '20px',
    fontSize: theme.customPropertiesVariables['--aspect-font-size-sm'],
    fontWeight: theme.typography.fontWeightBold,
    color: theme.customPropertiesVariables['--aspect-color-white'],
    backgroundColor: theme.customPropertiesVariables['--aspect-color-chill-blue-1'],
    borderRadius: theme.customPropertiesVariables['--aspect-button-border-radius'],

    '&:focus': {
      backgroundColor: theme.customPropertiesVariables['--aspect-color-chill-blue-1'],
      borderRadius: theme.customPropertiesVariables['--aspect-button-border-radius'],
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

export const Dropdown = ({ classes, source, ...props }) => {
  const { messages } = props
  const { formatMessage } = useI18n()
  return (
    <Select
      input={<Input disableUnderline />}
      classes={{ ...omit(classes, 'menu') }}
      MenuProps={{ classes: { paper: classes.menu } }}
      variant="standard"
      {...props}
    >
      {source &&
        source.map(item => (
          <MenuItem key={item.value} value={item.value}>
            {messages && messages[item.i18nKey] ? formatMessage(messages[item.i18nKey]) : item.label}
          </MenuItem>
        ))}
    </Select>
  )
}
export default withStyles(styles)(Dropdown)
