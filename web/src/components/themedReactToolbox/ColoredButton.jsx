import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { Button } from 'react-toolbox/lib/button'

const cssClasses = classnames.bind(require('./ColoredButton.css'))

const enhance = _.identity

const themes = {
  ColoredButton: {
    neutral: cssClasses('ColoredButton--neutral'),
    raised: cssClasses('ColoredButton--raised'),
  },
}

const ColoredButton = ({
  neutral = true,
  raised = true,
  shipCove = false,
  shakespeare = false,
  mountain = false,
  brink = false,
  ...restProps
}) => (
  <Button
    {...restProps}
    neutral={neutral}
    raised={raised}
    className={cssClasses(restProps.className, {
      'ColoredButton--ship-cove': shipCove,
      'ColoredButton--shakespeare': shakespeare,
      'ColoredButton--mountain': mountain,
      'ColoredButton--brink': brink,
    })}
    theme={themes.ColoredButton}
  />
)

export default enhance(ColoredButton)
