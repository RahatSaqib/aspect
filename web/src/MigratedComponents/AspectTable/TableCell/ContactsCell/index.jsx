import React from 'react'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'

const cssClasses = classnames.bind(require('../../Table.css'))

const ContactsCell = ({ value }) => {
  if (value.length > 5) {
    const tempContacts = [...value]
    tempContacts.length = 5
    return (
      <div>
        {tempContacts.join(', ')}...
        <span className={cssClasses('contactsrow__more')}>
          {value.length - 5} more contacts
        </span>
      </div>
    )
  }
  if (value.length > 0 && value.length <= 5) {
    return <div>{value.join(', ')}</div>
  }
  return <div>Not Configured</div>
}

ContactsCell.defaultProps = {
  value: [],
}

ContactsCell.propTypes = {
  value: PropTypes.oneOf([PropTypes.array]),
}

export default ContactsCell
