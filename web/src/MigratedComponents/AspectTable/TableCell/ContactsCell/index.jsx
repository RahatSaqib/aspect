import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'

import messages from '../messages'

const cssClasses = classnames.bind(require('../../Table.css'))

const ContactsCell = ({ value }) => {
  const { formatMessage } = useIntl()
  if (value.length > 5) {
    const tempContacts = [...value]
    tempContacts.length = 5
    return (
      <div>
        {tempContacts.join(', ')}
        <span className={cssClasses('contactsrow__more')}>
          {formatMessage(messages.moreContacts, {
            contacts: value.length - 5,
            name: 'contact',
          })}
        </span>
      </div>
    )
  }
  if (value.length > 0 && value.length <= 5) {
    return <div>{value.join(', ')}</div>
  }
  return <div>{formatMessage(messages.notConfigured)}</div>
}

ContactsCell.defaultProps = {
  value: [],
}

ContactsCell.propTypes = {
  value: PropTypes.oneOf([PropTypes.array]),
}

export default ContactsCell
