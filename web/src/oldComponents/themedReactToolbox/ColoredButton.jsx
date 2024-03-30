import React from 'react'
import AspectButton from '../shared/AspectButton'
import styles from './ColoredButton.module.css'

const ColoredButton = ({
  neutral = true,
  raised = true,
  shipCove = false,
  shakespeare = false,
  mountain = false,
  brink = false,
  label,
  ...restProps
}) => {
  const classes = `${styles[restProps.className]} 
    ${shipCove ? 'ColoredButton__ship-cove' : ''} 
    ${shakespeare ? 'ColoredButton__shakespeare' : ''} ${mountain ? 'ColoredButton__mountain' : ''} 
    ${brink ? 'ColoredButton__brink' : ''} ${neutral ? 'ColoredButton__neutral' : ''} ${
    raised ? 'ColoredButton__raised' : ''
  }}`
  return (
    <AspectButton {...restProps} variant={raised ? 'contained' : 'text'} className={classes}>
      {label}
    </AspectButton>
  )
}

export default ColoredButton
