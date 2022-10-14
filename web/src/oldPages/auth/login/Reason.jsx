import React from 'react'
import get from 'lodash/get'
import { injectIntl } from 'react-intl'
import { typeToMessage } from '../loggedOutReasons'

const Reason = ({ intl, location, ...restProps }) =>
  typeToMessage(get(location, 'state.reason')) ? (
    <div {...restProps}>{intl.formatMessage(typeToMessage(get(location, 'state.reason')))}</div>
  ) : null

export default injectIntl(Reason)
