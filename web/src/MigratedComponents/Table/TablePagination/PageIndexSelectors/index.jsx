import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import Button from '@material-ui/core/Button'
import classnames from 'classnames/bind'

import messages from '../messages'
import IconProvider from '../../../IconProvider'

const cssClasses = classnames.bind(require('../../Table.css'))

const IndexButton = ({ modifier, disabled, action, icon, label }) => {
  return (
    <Button
      className={cssClasses([
        'pageindex__button',
        `pageindex__button--${modifier}`,
      ])}
      disabled={disabled}
      onClick={action}
    >
      <IconProvider icon={icon} />
      {label}
    </Button>
  )
}

IndexButton.propTypes = {
  modifier: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
  action: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
}

const PageIndexSelectors = ({
  canNextPage,
  canPreviousPage,
  dataLength,
  gotoPage,
  nextPage,
  pageCount,
  pageIndex,
  previousPage,
}) => {
  const intl = useIntl()
  return (
    <div className={cssClasses('pageindex__container')}>
      <IndexButton
        modifier="left"
        disabled={!canPreviousPage}
        action={() => gotoPage(0)}
        icon="FaAngleDoubleLeft"
        label={intl.formatMessage(messages.first)}
      />
      <IndexButton
        modifier="left"
        disabled={!canPreviousPage}
        action={() => previousPage()}
        icon="FaAngleLeft"
        label={intl.formatMessage(messages.previous)}
      />
      <div>{`showing page ${pageIndex} of ${pageCount}`}</div>
      <IndexButton
        modifier="right"
        disabled={!canNextPage}
        action={() => nextPage()}
        icon="FaAngleRight"
        label={intl.formatMessage(messages.previous)}
      />
      <IndexButton
        modifier="right"
        disabled={!canNextPage}
        action={() => gotoPage(pageCount - 1)}
        icon="FaAngleDoubleRight"
        label={intl.formatMessage(messages.last)}
      />
    </div>
  )
}

PageIndexSelectors.propTypes = {
  canNextPage: PropTypes.bool.isRequired,
  canPreviousPage: PropTypes.bool.isRequired,
  gotoPage: PropTypes.func.isRequired,
  nextPage: PropTypes.func.isRequired,
  pageCount: PropTypes.number.isRequired,
  previousPage: PropTypes.func.isRequired,
}

export default PageIndexSelectors
