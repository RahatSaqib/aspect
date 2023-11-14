import React from 'react'
import { IconButton } from '@mui/material'
import { func, number } from 'prop-types'
import { useIntl } from 'react-intl'
import IconProvider from '../../../IconProvider'
import styles from '../../Table.module.css'
import messages from '../messages'

const TableColumnOrderButtons = ({ headerIndex, headersLength, handleChangeColumnOrder }) => {
  const { formatMessage } = useIntl()
  return (
    <div className={styles.tableheader__orderbuttons}>
      <IconButton
        disabled={headerIndex <= 0}
        onClick={e => handleChangeColumnOrder(e, 'left', headerIndex)}
        className={styles.tableheader__orderbutton}
        data-testid={`order_left_${headerIndex}`}
        title={formatMessage(messages.moveColumnLeft)}
      >
        <IconProvider icon="MdChevronLeft" className={styles.tableheader__orderbuttons} />
      </IconButton>
      <IconButton
        disabled={headerIndex + 1 >= headersLength}
        onClick={e => handleChangeColumnOrder(e, 'right', headerIndex)}
        className={styles.tableheader__orderbutton}
        data-testid={`order_right_${headerIndex}`}
        title={formatMessage(messages.moveColumnRight)}
      >
        <IconProvider icon="MdChevronRight" className={styles.tableheader__orderbuttons} />
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
