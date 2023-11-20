import React from 'react'
import isString from 'lodash/isString'
import { array, oneOfType, string } from 'prop-types'
import { useIntl } from 'react-intl'
import styles from '../../Table.module.css'
import messages from '../messages'

const CONTACTS = {
  MAX_VISIBLE_COUNT: 5,
}

/**
 * Component to render a contact cell
 */

const ContactsCell = ({ value }) => {
  const { formatMessage } = useIntl()
  const valToArray = isString(value) ? value.split(',') : []
  if (valToArray.length > CONTACTS.MAX_VISIBLE_COUNT) {
    const tempContacts = [...valToArray]
    tempContacts.length = CONTACTS.MAX_VISIBLE_COUNT
    return (
      <div>
        {tempContacts.join(', ')}
        <span className={styles.contactsrow__more}>
          {formatMessage(messages.moreContacts, {
            contacts: valToArray.length - CONTACTS.MAX_VISIBLE_COUNT,
            name: 'contact',
          })}
        </span>
      </div>
    )
  }
  if (valToArray.length > 0 && valToArray.length <= CONTACTS.MAX_VISIBLE_COUNT) {
    return <div>{valToArray.join(', ')}</div>
  }
  return <div className={styles.message__not_configured}>{formatMessage(messages.notConfigured)}</div>
}

ContactsCell.defaultProps = {
  value: [],
}

ContactsCell.propTypes = {
  /**
    Data for the cell to render
  */
  value: oneOfType([array, string]),
}

export default ContactsCell
