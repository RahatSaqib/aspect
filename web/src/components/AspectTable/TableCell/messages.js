import { defineMessages } from 'react-intl'

const messages = defineMessages({
  notConfigured: {
    id: 'pages.TableCell.notConfigured',
    defaultMessage: 'Not Configured',
  },
  expandRow: {
    id: 'pages.TableCell.expandRow',
    defaultMessage: 'Expand Row',
  },
  timeClassification: {
    id: 'pages.TableCell.timeClassification',
    defaultMessage: `{elapsed} elapsed, {upcoming} upcoming`,
  },
  moreContacts: {
    id: 'pages.TableCell.moreContacts',
    defaultMessage: ` ...{contacts, plural,
      one {# more {name}}
      other {# more {name}s}
    }`,
  },
})

export default messages
