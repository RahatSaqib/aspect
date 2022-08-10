import React from 'react'
import { array, oneOfType, string } from 'prop-types'
import classnames from 'classnames/bind'
import isString from 'lodash/isString'

import messages from '../messages'

import styles from '../../Table.css'
import useI18n from '../../../../hooks/i18n/useI18n'

const cssClasses = classnames.bind(styles)

const CONTACTS = {
  MAX_VISIBLE_COUNT: 5,
}

/**
 * Component to render a contact cell
 */

const ContactsCell = ({ value }) => {
  const { formatMessage } = useI18n()
  const valToArray = isString(value) ? value.split(',') : []
  if (valToArray.length > CONTACTS.MAX_VISIBLE_COUNT) {
    const tempContacts = [...valToArray]
    tempContacts.length = CONTACTS.MAX_VISIBLE_COUNT
    return (
      <div>
        {tempContacts.join(', ')}
        <span className={cssClasses('contactsrow__more')}>
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
  return <div className={cssClasses('message--not-configured')}>{formatMessage(messages.notConfigured)}</div>
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
