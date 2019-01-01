import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import AspectButton from '../../components/shared/AspectButton'

const cssClasses = classnames.bind(require('./ColoredButton.css'))

const enhance = _.identity

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
