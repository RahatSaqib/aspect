import PropTypes from 'prop-types'
import React, { useState, Fragment } from 'react'
import classnames from 'classnames/bind'
import { Link } from 'react-router-dom'
import Button from '@material-ui/core/Button'
import FaExternalLink from 'react-icons/lib/fa/external-link'

// Our own imports
import ContactsTag from './ContactTags'
import messages from '../messages'
import { Unit } from '../../../components/pureGrids'
import { ReadOnlyField } from '../../../components/shared/ReadOnlyFields'

const cssClasses = classnames.bind(
  require('../../../globals/components/Summary.css')
)

const Contacts = ({ id, title, contacts, formatMessage }) => {
  const [edit, setEdit] = useState(false)
  const saveContacts = () => {
    setEdit(true)
  }
  const editContacts = () => {
    setEdit(false)
  }
  return (
    <Unit sm="1-1" className={cssClasses('Summary')}>
      <div className={cssClasses('Summary__Title')}>{title}</div>
      {edit ? (
        <div className={cssClasses('Summary__Tags__Wrap')}>
          <ReadOnlyField
            label="read"
            value={contacts}
            hideLabel
            format={v => (
              <ContactsTag
                siteId={id}
                allowCreate
                value={v}
                identifier="name"
                noMatch={formatMessage(messages.fieldNoMatch)}
              />
            )}
          />
          <Button variant="contained" onClick={editContacts}>
            Update
          </Button>
        </div>
      ) : (
        <div className={cssClasses('Summary__Description')}>
          {contacts.length ? (
            contacts.map(contact => (
              <Fragment>
                {contact.name}
                <Link
                  to={`/browse/person/${contact.id}`}
                  className={cssClasses('Summary__Description__Link')}
                >
                  <FaExternalLink />
                </Link>
              </Fragment>
            ))
          ) : (
            <i>{formatMessage(messages.fieldNoContact)}</i>
          )}
          <span className={cssClasses('Summary__Description__Action')}>
            <Button variant="contained" onClick={saveContacts}>
              {contacts.length ? 'Update' : 'Add'}
            </Button>
          </span>
        </div>
      )}
    </Unit>
  )
}

Contacts.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  contacts: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  formatMessage: PropTypes.func.isRequired,
}

export default Contacts
