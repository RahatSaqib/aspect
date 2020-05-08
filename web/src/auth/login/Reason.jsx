import _ from 'lodash'
import React from 'react'
import { injectIntl } from 'react-intl'
import { typeToMessage } from '../loggedOutReasons'

const enhance = _.identity(injectIntl)

const Reason = ({ intl, location, ...restProps }) =>
  typeToMessage(_.get(location, 'state.reason')) ? (
    <div {...restProps}>
      {intl.formatMessage(typeToMessage(_.get(location, 'state.reason')))}
    </div>
  ) : null

export default enhance(Reason)
