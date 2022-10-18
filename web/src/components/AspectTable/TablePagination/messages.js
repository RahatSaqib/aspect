import { defineMessages } from 'react-intl'

const messages = defineMessages({
  all: {
    id: 'pages.TablePagination.all',
    defaultMessage: 'All',
  },
  first: {
    id: 'pages.TablePagination.first',
    defaultMessage: 'First',
  },
  previous: {
    id: 'pages.TablePagination.previous',
    defaultMessage: 'Previous',
  },
  newer: {
    id: 'pages.TablePagination.newer',
    defaultMessage: 'Newer',
  },
  older: {
    id: 'pages.TablePagination.older',
    defaultMessage: 'Older',
  },
  next: {
    id: 'pages.TablePagination.next',
    defaultMessage: 'Next',
  },
  last: {
    id: 'pages.TablePagination.last',
    defaultMessage: 'Last',
  },
  nowShowing: {
    id: 'pages.TablePagination.nowShowing',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# {name}}
      other {# {namePlural}}
    }`,
  },
})

export default messages
