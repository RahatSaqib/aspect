import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'

import messages from '../messages'
import { getFirstAndLastVisibleRowNumbers } from '../../Helpers'

const cssClasses = classnames.bind(require('../../Table.css'))

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
  dataLength: PropTypes.number.isRequired,
  pageIndex: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
}

export default NowShowing
