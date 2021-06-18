import React from 'react'
import { number, string } from 'prop-types'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'

import messages from '../messages'
import { getFirstAndLastVisibleRowNumbers } from '../../Helpers'

import styles from '../../Table.css'

const cssClasses = classnames.bind(styles)

/**
 * Component to render page counts and navigation
 */

const NowShowing = ({ dataLength, pageIndex, pageSize, name }) => {
  const intl = useIntl()
  const boundaries = getFirstAndLastVisibleRowNumbers(
    dataLength,
    pageIndex,
    pageSize
  )
  const countName = boundaries
    ? intl.formatMessage(messages.nowShowing, {
        firstItemIndex: boundaries[0],
        lastItemIndex: boundaries[1],
        itemCount: dataLength,
        name,
      })
    : null
  return (
    <div
      className={cssClasses('nowShowing__container')}
      data-testid="now-showing"
    >
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
}

export default NowShowing
