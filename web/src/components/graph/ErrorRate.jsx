import _ from 'lodash'
import React from 'react'
import classnames from 'classnames'
import { Group } from '@vx/group'
import callOrValue from '@vx/shape/build/util/callOrValue'

export const ErrorRate = ({
  className,
  top,
  left,
  count = 1,
  xCount = 1,
  yCount = 1,
  itemWidth,
  itemHeight,
  itemPadding,
  itemFill,
}) => {
  const itemXBoxSize = itemWidth + itemPadding.left + itemPadding.right
  const itemYBoxSize = itemHeight + itemPadding.top + itemPadding.bottom

  return (
    <Group
      className={classnames('vx-error-rate', className)}
      top={top}
      left={left}
    >
      {_.times(yCount, yIndex =>
        _.times(xCount, xIndex => {
          const index = yIndex * xCount + xIndex
          if (index >= count) {
            return false
          }
          const x = xIndex * itemXBoxSize + itemPadding.left
          const y = yIndex * itemYBoxSize + itemPadding.top

          return (
            <rect
              x={x}
              y={y}
              width={itemWidth}
              height={itemHeight}
              fill={callOrValue(itemFill, index)}
            />
          )
        })
      )}
    </Group>
  )
}

export default ErrorRate
