import React from 'react'
import { bool, func, oneOf, string } from 'prop-types'
import Button from '@mui/material/Button'
import classnames from 'classnames/bind'

import IconProvider from '../../../IconProvider'

import styles from '../../Table.css'

const cssClasses = classnames.bind(styles)

/**
 * Component to render page navigation button
 */

const IndexButton = ({ modifier, disabled, action, icon, label }) => {
  return (
    <Button
      className={cssClasses(['pageindex__button', `pageindex__button--${modifier}`])}
      disabled={disabled}
      onClick={action}
    >
      <IconProvider icon={icon} className="indexButton__icon" />
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
