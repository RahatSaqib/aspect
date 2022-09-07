import React from 'react'
import IconButton from '@mui/material/IconButton'
import classnames from 'classnames/bind'
import { func, number } from 'prop-types'
import useI18n from '../../../../hooks/useI18n'
import IconProvider from '../../../IconProvider'
import styles from '../../Table.css'
import messages from '../messages'

const cssClasses = classnames.bind(styles)

const TableColumnOrderButtons = ({ headerIndex, headersLength, handleChangeColumnOrder }) => {
  const { formatMessage } = useI18n()
  return (
    <div className={cssClasses('tableheader__orderbuttons')}>
      <IconButton
        disabled={headerIndex <= 0}
        onClick={e => handleChangeColumnOrder(e, 'left', headerIndex)}
        className={cssClasses('tableheader__orderbutton')}
        data-testid={`order_left_${headerIndex}`}
        title={formatMessage(messages.moveColumnLeft)}
      >
        <IconProvider icon="MdChevronLeft" className="tableheader__orderbutton" />
      </IconButton>
      <IconButton
        disabled={headerIndex + 1 >= headersLength}
        onClick={e => handleChangeColumnOrder(e, 'right', headerIndex)}
        className={cssClasses('tableheader__orderbutton')}
        data-testid={`order_right_${headerIndex}`}
        title={formatMessage(messages.moveColumnRight)}
      >
        <IconProvider icon="MdChevronRight" className="tableheader__orderbutton" />
      </IconButton>
    </div>
  )
}

TableColumnOrderButtons.propTypes = {
  /**
    Index for the header within the group
  */
  headerIndex: number.isRequired,
  /**
    Number of headers for the table
  */
  headersLength: number.isRequired,
  /**
    Function to handle column order
  */
  handleChangeColumnOrder: func.isRequired,
}

export default TableColumnOrderButtons
