import React, { Fragment } from 'react'
import useI18n from '../../hooks/useI18n'
import messages from './messages'

const CustomClearText = () => {
  const { formatMessage } = useI18n()
  return <Fragment>{formatMessage(messages.selectAll)}</Fragment>
}
const ClearIndicator = props => {
  const {
    children = <CustomClearText />,
    getStyles,
    innerProps: { ref, ...restInnerProps },
  } = props
  return (
    <div {...restInnerProps} ref={ref} style={getStyles('clearIndicator', props)}>
      <div style={{ padding: '0px 5px' }}>{children}</div>
    </div>
  )
}

export default ClearIndicator
