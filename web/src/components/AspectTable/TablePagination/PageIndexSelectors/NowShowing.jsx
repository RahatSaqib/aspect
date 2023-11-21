import React from 'react'
import { number, string } from 'prop-types'
import { useIntl } from 'react-intl'
import { getFirstAndLastVisibleRowNumbers } from '../../Helpers'
import styles from '../../Table.module.css'
import messages from '../messages'

/**
 * Component to render page counts and navigation
 */

const NowShowing = ({ dataLength, pageIndex, pageSize, name, namePlural }) => {
  const { formatMessage } = useIntl()
  const boundaries = getFirstAndLastVisibleRowNumbers(dataLength, pageIndex, pageSize)
  const countName = boundaries
    ? formatMessage(messages.nowShowing, {
        firstItemIndex: boundaries[0],
        lastItemIndex: boundaries[1],
        itemCount: dataLength,
        name,
        namePlural,
      })
    : null
  return (
    <div className={styles.nowShowing__container} data-testid="now-showing">
      {countName}
    </div>
  )
}

NowShowing.propTypes = {
  /**
    Length of data to be rendered, needed for calcs
  */
  dataLength: number.isRequired,
  /**
    Current int for page selected (starts at zero)
  */
  pageIndex: number.isRequired,
  /**
    Number of rows to be shown per page
  */
  pageSize: number.isRequired,
  /**
    Name of type of records
  */
  name: string.isRequired,
  /**
    Plural of the name
  */
  namePlural: string.isRequired,
}

export default NowShowing
