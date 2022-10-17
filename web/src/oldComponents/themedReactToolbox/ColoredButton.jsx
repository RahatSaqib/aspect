import React from 'react'
import classnames from 'classnames/bind'
import identity from 'lodash/identity'
import AspectButton from '../shared/AspectButton'
import styles from './ColoredButton.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

const ColoredButton = ({
  neutral = true,
  raised = true,
  shipCove = false,
  shakespeare = false,
  mountain = false,
  brink = false,
  label,
  ...restProps
}) => (
  <AspectButton
    {...restProps}
    variant={raised ? 'contained' : 'text'}
    className={cssClasses(restProps.className, {
      'ColoredButton--ship-cove': shipCove,
      'ColoredButton--shakespeare': shakespeare,
      'ColoredButton--mountain': mountain,
      'ColoredButton--brink': brink,
      'ColoredButton--neutral': neutral,
      'ColoredButton--raised': raised,
    })}
  >
    {label}
  </AspectButton>
)

export default enhance(ColoredButton)
