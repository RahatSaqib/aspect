import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'

import messages from '../messages'
import { getCurrentVisibleRows } from '../../Helpers'

const cssClasses = classnames.bind(require('../../Table.css'))

const NowShowing = ({ dataLength, page, name }) => {
  const intl = useIntl()
  const boundaries = getCurrentVisibleRows(page)
  const countName = intl.formatMessage(messages.nowShowing, {
    firstItemIndex: boundaries[0],
    lastItemIndex: boundaries[1],
    itemCount: dataLength,
    name,
  })
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
  page: PropTypes.oneOfType([PropTypes.array]).isRequired,
  name: PropTypes.string.isRequired,
}

export default NowShowing
