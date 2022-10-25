import React from 'react'
import get from 'lodash/get'
import useI18n from '../../../hooks/useI18n'
import { typeToMessage } from '../loggedOutReasons'

const Reason = ({ location, ...restProps }) => {
  const intl = useI18n()
  return typeToMessage(get(location, 'state.reason')) ? (
    <div {...restProps}>{intl.formatMessage(typeToMessage(get(location, 'state.reason')))}</div>
  ) : null
}

export default Reason
