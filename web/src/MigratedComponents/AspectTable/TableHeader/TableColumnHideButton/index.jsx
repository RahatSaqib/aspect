import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import IconButton from '@material-ui/core/IconButton'
import classnames from 'classnames/bind'

import messages from '../messages'
import IconProvider from '../../../IconProvider'

const cssClasses = classnames.bind(require('../../Table.css'))

const TableColumnHideButton = ({ headerIndex, handleHideColumnToggle }) => {
  const { formatMessage } = useIntl()
  return (
    <IconButton
      onClick={e => handleHideColumnToggle(e, headerIndex)}
      className={cssClasses('tableheader__hidebutton')}
      data-testid={`hide_column_${headerIndex}`}
      title={formatMessage(messages.hideColumn)}
    >
      <IconProvider icon="MdVisibilityOff" />
    </IconButton>
  )
}

TableColumnHideButton.propTypes = {
  headerIndex: PropTypes.string.isRequired,
  handleHideColumnToggle: PropTypes.func.isRequired,
}

export default TableColumnHideButton
