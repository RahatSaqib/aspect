import React from 'react'
import classnames from 'classnames/bind'
import { number, string } from 'prop-types'
import { i18nWrapper } from '../../../../providers/I18nProvider/index'
import { getFirstAndLastVisibleRowNumbers } from '../../Helpers'
import styles from '../../Table.css'
import messages from '../messages'

const cssClasses = classnames.bind(styles)

/**
 * Component to render page counts and navigation
 */

const NowShowing = ({ dataLength, pageIndex, pageSize, name, namePlural }) => {
  const { formatMessage } = i18nWrapper()
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
    <div className={cssClasses('nowShowing__container')} data-testid="now-showing">
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
