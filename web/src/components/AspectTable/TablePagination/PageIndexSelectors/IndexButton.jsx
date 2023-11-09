import React from 'react'
import { Button } from '@mui/material'
import { bool, func, oneOf, string } from 'prop-types'
import IconProvider from '../../../IconProvider'
import styles from '../../Table.module.css'

/**
 * Component to render page navigation button
 */

const IndexButton = ({ modifier, disabled, action, icon, label }) => {
  return (
    <Button
      className={`${styles.pageindex__button} ${styles[`pageindex__Button__${modifier}`]}`}
      disabled={disabled}
      onClick={action}
    >
      <IconProvider icon={icon} />
      {label}
    </Button>
  )
}

IndexButton.propTypes = {
  /**
    Enum for direction of the button once clicked
  */
  modifier: oneOf(['left', 'right']).isRequired,
  /**
    Is currently enabled boolean
  */
  disabled: bool.isRequired,
  /**
    Function to perform once clicked (if enabled)
  */
  action: func.isRequired,
  /**
    Which icon to pass to the component
  */
  icon: string.isRequired,
  /**
    Additional text label for the button
  */
  label: string.isRequired,
}

export default IndexButton
