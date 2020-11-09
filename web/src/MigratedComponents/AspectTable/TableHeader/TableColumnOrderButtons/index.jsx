import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import IconButton from '@material-ui/core/IconButton'
import classnames from 'classnames/bind'

import messages from '../messages'
import IconProvider from '../../../IconProvider'

const cssClasses = classnames.bind(require('../../Table.css'))

const TableColumnOrderButtons = ({
  headerIndex,
  headersLength,
  handleChangeColumnOrder,
}) => {
  const { formatMessage } = useIntl()
  return (
    <div className={cssClasses('tableheader__orderbuttons')}>
      <IconButton
        disabled={headerIndex <= 0}
        onClick={e => handleChangeColumnOrder(e, 'left', headerIndex)}
        className={cssClasses('tableheader__orderbutton')}
        data-testid={`order_left_${headerIndex}`}
        title={formatMessage(messages.moveColumnLeft)}
      >
        <IconProvider icon="MdChevronLeft" />
      </IconButton>
      <IconButton
        disabled={headerIndex + 1 >= headersLength}
        onClick={e => handleChangeColumnOrder(e, 'right', headerIndex)}
        className={cssClasses('tableheader__orderbutton')}
        data-testid={`order_right_${headerIndex}`}
        title={formatMessage(messages.moveColumnRight)}
      >
        <IconProvider icon="MdChevronRight" />
      </IconButton>
    </div>
  )
}

TableColumnOrderButtons.propTypes = {
  headerIndex: PropTypes.number.isRequired,
  headersLength: PropTypes.number.isRequired,
  handleChangeColumnOrder: PropTypes.func.isRequired,
}

export default TableColumnOrderButtons
