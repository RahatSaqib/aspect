import React from 'react'
import { array, oneOfType } from 'prop-types'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'

import messages from '../messages'

const cssClasses = classnames.bind(require('../../Table.css'))

const CONTACTS = {
  MAX_VISIBLE_COUNT: 5,
}

/**
 * Component to render a contact cell
 */

const ContactsCell = ({ value }) => {
  const { formatMessage } = useIntl()
  const valToArray = value ? value.split(',') : []
  if (valToArray.length > CONTACTS.MAX_VISIBLE_COUNT) {
    const tempContacts = [...value]
    tempContacts.length = CONTACTS.MAX_VISIBLE_COUNT
    return (
      <div>
        {tempContacts.join(', ')}
        <span className={cssClasses('contactsrow__more')}>
          {formatMessage(messages.moreContacts, {
            contacts: value.length - CONTACTS.MAX_VISIBLE_COUNT,
            name: 'contact',
          })}
        </span>
      </div>
    )
  }
  if (
    valToArray.length > 0 &&
    valToArray.length <= CONTACTS.MAX_VISIBLE_COUNT
  ) {
    return <div>{valToArray.join(', ')}</div>
  }
  return <div>{formatMessage(messages.notConfigured)}</div>
}

ContactsCell.defaultProps = {
  value: [],
}

ContactsCell.propTypes = {
  /**
    Data for the cell to render
  */
  value: oneOfType([array]),
}

export default ContactsCell
