import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { defineMessages } from 'react-intl'
import { compose, withProps, withHandlers, pure } from 'recompose'
import { Button } from 'react-toolbox/lib/button'
import FaAngleDoubleLeft from 'react-icons/lib/fa/angle-double-left'
import FaAngleLeft from 'react-icons/lib/fa/angle-left'
import FaAngleRight from 'react-icons/lib/fa/angle-right'
import FaAngleDoubleRight from 'react-icons/lib/fa/angle-double-right'

const cssClasses = classnames.bind(require('./TablePaginator.css'))

export const ALL_KEY = 'All'

export const PAGE_SIZE_BUTTON_KEYS = [10, 25, 50, 100, ALL_KEY]

const messages = defineMessages({
  all: {
    id: 'pages.TablePaginator.all',
    defaultMessage: 'All',
  },
})

const enhance = compose(
  withProps(({ pageAt, pageSize, total }) => ({
    hasFirstPage: pageAt !== 0,
    hasPreviousPage: pageAt > 0,
    firstItemIndex: 1 + pageSize * pageAt,
    lastItemIndex: _.min([total, pageSize * (1 + pageAt)]),
    hasNextPage: total > pageSize * (1 + pageAt),
    hasLastPage: total > pageSize * (1 + pageAt),
  })),
  withHandlers({
    onFirstClick: ({ onPageChange }) => () => {
      onPageChange(0)
    },

    onPreviousClick: ({ pageAt, onPageChange }) => () => {
      onPageChange(pageAt - 1)
    },

    onNextClick: ({ pageAt, onPageChange }) => () => {
      onPageChange(pageAt + 1)
    },

    onLastClick: ({ total, pageSize, onPageChange }) => () => {
      onPageChange(Math.floor(total / pageSize))
    },

    onPageSizeChange10: ({ onPageSizeChange }) => () => {
      onPageSizeChange(10)
    },

    onPageSizeChange25: ({ onPageSizeChange }) => () => {
      onPageSizeChange(25)
    },

    onPageSizeChange50: ({ onPageSizeChange }) => () => {
      onPageSizeChange(50)
    },

    onPageSizeChange100: ({ onPageSizeChange }) => () => {
      onPageSizeChange(100)
    },

    onPageSizeChangeAll: ({ onPageSizeChange, total }) => () => {
      onPageSizeChange(total)
    },
  }),
  pure
)

const TablePaginator = ({
  intl,
  paginatorStatus,
  className,
  onFirstClick,
  onPreviousClick,
  onNextClick,
  onLastClick,
  hasFirstPage,
  hasPreviousPage,
  firstItemIndex,
  lastItemIndex,
  hasNextPage,
  hasLastPage,
  total,
  pageSize,
  pageSizeButtonKeys = PAGE_SIZE_BUTTON_KEYS,
  ...restProps
}) => (
  <div className={cssClasses(className, 'Container')}>
    <div className={cssClasses('Left')}>
      <Button
        className={cssClasses('Left__Button')}
        disabled={!hasFirstPage}
        primary
        inverse
        onClick={onFirstClick}
      >
        <FaAngleDoubleLeft />
        First
      </Button>
      <Button
        className={cssClasses('Left__Button')}
        disabled={!hasPreviousPage}
        primary
        inverse
        onClick={onPreviousClick}
      >
        <FaAngleLeft />
        Previous
      </Button>
      <div className={cssClasses('Left__Status')}>
        {intl.formatMessage(paginatorStatus, {
          firstItemIndex,
          lastItemIndex,
          itemCount: total,
        })}
      </div>
      <Button
        className={cssClasses('Left__Button', 'Left__Button--next')}
        disabled={!hasNextPage}
        primary
        inverse
        onClick={onNextClick}
      >
        Next
        <FaAngleRight />
      </Button>
      <Button
        className={cssClasses('Left__Button', 'Left__Button--next')}
        disabled={!hasLastPage}
        primary
        inverse
        onClick={onLastClick}
      >
        Last
        <FaAngleDoubleRight />
      </Button>
    </div>
    <div className={cssClasses('Right')}>
      {pageSizeButtonKeys.map(key => (
        <Button
          key={key}
          className={cssClasses('Right__Button')}
          onClick={restProps[`onPageSizeChange${key}`]}
          label={key !== ALL_KEY ? `${key}` : intl.formatMessage(messages.all)}
          primary
          raised={key !== ALL_KEY ? key === pageSize : pageSize === total}
        />
      ))}
    </div>
  </div>
)

export default enhance(TablePaginator)
