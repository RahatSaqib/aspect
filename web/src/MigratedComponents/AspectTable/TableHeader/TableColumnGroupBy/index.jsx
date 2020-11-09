import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import IconButton from '@material-ui/core/IconButton'
import classnames from 'classnames/bind'

import messages from '../messages'
import IconProvider from '../../../IconProvider'

const cssClasses = classnames.bind(require('../../Table.css'))

const TableColumnGroupBy = ({
  headerIndex,
  handleGroupByColumnToggle,
  isGrouped,
}) => {
  const { formatMessage } = useIntl()
  return isGrouped ? (
    <IconButton
      onClick={e => handleGroupByColumnToggle(e, headerIndex)}
      className={cssClasses('tableheader__groupbybutton')}
      data-testid={`ungroup_${headerIndex}`}
      title={formatMessage(messages.unGroupByColumn)}
    >
      <IconProvider icon="FaCheckSquare" />
    </IconButton>
  ) : (
    <IconButton
      onClick={e => handleGroupByColumnToggle(e, headerIndex)}
      className={cssClasses('tableheader__groupbybutton')}
      data-testid={`group_${headerIndex}`}
      title={formatMessage(messages.groupByColumn)}
    >
      <IconProvider icon="FaRegCheckSquare" />
    </IconButton>
  )
}

TableColumnGroupBy.defaultProps = {
  headerIndex: PropTypes.number.isRequired,
  handleGroupByColumnToggle: PropTypes.func.isRequired,
  isGrouped: PropTypes.bool.isRequired,
}

export default TableColumnGroupBy
