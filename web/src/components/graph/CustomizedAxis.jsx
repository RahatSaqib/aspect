import _ from 'lodash'
import React from 'react'
import { AxisLeft, AxisBottom } from '@vx/axis'

export const CustomizedAxisLeft = props => (
  <AxisLeft
    {...props}
    tickFormat={value =>
      Math.floor(value) === value ? (props.tickFormat || _.toString)(value) : ''
    }
  />
)

export const CustomizedAxisBottom = props => <AxisBottom {...props} />
