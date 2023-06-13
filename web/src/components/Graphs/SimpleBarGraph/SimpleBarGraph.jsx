import React from 'react'
import { useTheme } from '@mui/material'
import { ResponsiveBar } from '@nivo/bar'
import classnames from 'classnames/bind'
import styles from '../LineGraph/AspectResponsiveLine.css'
import { legend, margin } from './constants'

const cssClasses = classnames.bind(styles)

const SimpleBarGraph = props => {
  const { palette } = useTheme()
  const { color = palette.primary.main, ...rest } = props
  return (
    <div className={cssClasses('aspect-responsive-line__container')}>
      <div className={cssClasses('aspect-responsive-line__chart__container')}>
        <ResponsiveBar
          margin={margin}
          legends={[legend]}
          enableGridX
          enableGridY
          labelTextColor={palette.common.white}
          padding={0.6}
          colors={color}
          {...rest}
        />
      </div>
    </div>
  )
}

export default SimpleBarGraph
