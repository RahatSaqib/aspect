import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { defineMessages } from 'react-intl'
import { compose, withProps, withHandlers, pure } from 'recompose'
import { Button } from 'react-toolbox/lib/button'
import KeyboardArrowLeft from 'react-icons/lib/md/keyboard-arrow-left'
import KeyboardArrowRight from 'react-icons/lib/md/keyboard-arrow-right'

const cssClasses = classnames.bind(require('./TablePaginator.css'))

const messages = defineMessages({
  all: {
    id: 'pages.TablePaginator.all',
    defaultMessage: 'All',
  },
})

const enhance = compose(
  withProps(({ page, pageSize, total }) => ({
    hasPreviousPage: page > 0,
    firstItemIndex: 1 + pageSize * page,
    lastItemIndex: _.min([total, pageSize * (1 + page)]),
    hasNextPage: total > pageSize * (1 + page),
  })),
  withHandlers({
    onPreviousClick: ({ page, onPageChange }) => () => {
      onPageChange(page - 1)
    },

    onNextClick: ({ page, onPageChange }) => () => {
      onPageChange(page + 1)
    },

    onPageSizeChange25: ({ onPageSizeChange }) => () => {
      onPageSizeChange(25)
    },

    onPageSizeChange50: ({ onPageSizeChange }) => () => {
      onPageSizeChange(50)
    },

    onPageSizeChange75: ({ onPageSizeChange }) => () => {
      onPageSizeChange(75)
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

const ALL_KEY = 'All'

const pageSizeButtonKeys = [25, 50, 75, 100, ALL_KEY]

const TablePaginator = ({
  intl,
  paginatorStatus,
  className,
  onPreviousClick,
  onNextClick,
  hasPreviousPage,
  firstItemIndex,
  lastItemIndex,
  hasNextPage,
  total,
  pageSize,
  ...restProps
}) =>
  <div className={cssClasses(className, 'Container')}>
    <div className={cssClasses('Left')}>
      <Button
        onClick={onPreviousClick}
        disabled={!hasPreviousPage}
        primary
        theme={{
          flat: cssClasses('Button--flat'),
          primary: cssClasses('Button--primary'),
        }}
      >
        <KeyboardArrowLeft />
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
        className={cssClasses('Left__Button--next')}
        disabled={!hasNextPage}
        onClick={onNextClick}
        primary
        theme={{
          flat: cssClasses('Button--flat'),
          primary: cssClasses('Button--primary'),
        }}
      >
        Next
        <KeyboardArrowRight />
      </Button>
    </div>
    <div className={cssClasses('Right')}>
      {pageSizeButtonKeys.map(key =>
        <Button
          key={key}
          className={cssClasses('Right__Button')}
          onClick={restProps[`onPageSizeChange${key}`]}
          label={key !== ALL_KEY ? `${key}` : intl.formatMessage(messages.all)}
          raised
          primary={key !== ALL_KEY ? key === pageSize : pageSize === total}
          theme={{
            raised: cssClasses('Button--raised'),
            neutral: cssClasses('Button--neutral'),
            primary: cssClasses('Button--primary'),
          }}
        />
      )}
    </div>
  </div>

export default enhance(TablePaginator)
