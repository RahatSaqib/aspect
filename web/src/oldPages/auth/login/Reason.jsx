import React from 'react'
import get from 'lodash/get'
import identity from 'lodash/identity'
import { injectIntl } from 'react-intl'
import { typeToMessage } from '../loggedOutReasons'

const enhance = identity(injectIntl)

const Reason = ({ intl, location, ...restProps }) =>
  typeToMessage(get(location, 'state.reason')) ? (
    <div {...restProps}>{intl.formatMessage(typeToMessage(get(location, 'state.reason')))}</div>
  ) : null

export default enhance(Reason)
