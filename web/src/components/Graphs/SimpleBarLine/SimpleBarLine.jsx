import React from 'react'
import { useTheme } from '@mui/material'
import { ResponsiveLine } from '@nivo/line'
import classnames from 'classnames/bind'
import { legend, margin } from './constants'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

const SimpleBarLine = props => {
  const { data, ...rest } = props
  const { palette } = useTheme()
  return (
    <div className={cssClasses('simple-par-line-container')}>
      <ResponsiveLine
        data={data}
        animate={false}
        margin={margin}
        legends={[legend]}
        enableGridX
        enableGridY
        enableSlices="x"
        yScale={{
          type: 'linear',
          stacked: false,
        }}
        xScale={{
          type: 'point',
        }}
        labelTextColor={palette.common.white}
        padding={0.6}
        {...rest}
      />
    </div>
  )
}

export default SimpleBarLine
