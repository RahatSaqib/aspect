import React from 'react'
import get from 'lodash/get'
import { useIntl } from 'react-intl'
import { typeToMessage } from '../loggedOutReasons'

const Reason = ({ location, ...restProps }) => {
  const intl = useIntl()
  return typeToMessage(get(location, 'state.reason')) ? (
    <div {...restProps}>{intl.formatMessage(typeToMessage(get(location, 'state.reason')))}</div>
  ) : null
}

export default Reason
