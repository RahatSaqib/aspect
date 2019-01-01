import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { defineMessages } from 'react-intl'
import { compose, withProps, withHandlers, pure } from 'recompose'
import Button from '@material-ui/core/Button'
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
  first: {
    id: 'pages.TablePaginator.first',
    defaultMessage: 'First',
  },
  previous: {
    id: 'pages.TablePaginator.previous',
    defaultMessage: 'Previous',
  },
  newer: {
    id: 'pages.TablePaginator.newer',
    defaultMessage: 'Newer',
  },
  older: {
    id: 'pages.TablePaginator.older',
    defaultMessage: 'Older',
  },
  next: {
    id: 'pages.TablePaginator.next',
    defaultMessage: 'Next',
  },
  last: {
    id: 'pages.TablePaginator.last',
    defaultMessage: 'Last',
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
      const lastPage =
        total % pageSize === 0 ? total / pageSize - 1 : total / pageSize
      onPageChange(Math.floor(lastPage))
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
  timedMessageUsed = false,
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
        color="primary"
        variant="outlined"
        onClick={onFirstClick}
      >
        <FaAngleDoubleLeft />
        {intl.formatMessage(messages.first)}
      </Button>
      <Button
        className={cssClasses('Left__Button')}
        disabled={!hasPreviousPage}
        color="primary"
        variant="outlined"
        onClick={onPreviousClick}
      >
        <FaAngleLeft />
        {intl.formatMessage(
          timedMessageUsed ? messages.newer : messages.previous
        )}
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
        color="primary"
        variant="outlined"
        onClick={onNextClick}
      >
        {intl.formatMessage(timedMessageUsed ? messages.older : messages.next)}
        <FaAngleRight />
      </Button>
      <Button
        className={cssClasses('Left__Button', 'Left__Button--next')}
        disabled={!hasLastPage}
        color="primary"
        variant="outlined"
        onClick={onLastClick}
      >
        {intl.formatMessage(messages.last)}
        <FaAngleDoubleRight />
      </Button>
    </div>
    <div className={cssClasses('Right')}>
      {pageSizeButtonKeys.map(key => (
        <Button
          key={key}
          className={cssClasses('Right__Button', {
            selected:
              (key !== ALL_KEY && key === pageSize) || pageSize === total,
          })}
          onClick={restProps[`onPageSizeChange${key}`]}
          variant={
            (key !== ALL_KEY && key === pageSize) || pageSize === total
              ? 'contained'
              : 'text'
          }
          color="primary"
        >
          {key !== ALL_KEY ? `${key}` : intl.formatMessage(messages.all)}
        </Button>
      ))}
    </div>
  </div>
)

export default enhance(TablePaginator)
