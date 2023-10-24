import React, { Fragment, useState } from 'react'
import { Button } from '@mui/material'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import { FaExternalLinkAlt as FaExternalLink } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { ContactTagInput } from '../../../../cleanComponents'
import useContactBySite from '../../../../hooks/person/useContactBySite'
import { ReadOnlyField } from '../../../../oldComponents/shared/ReadOnlyFields'
import styles from '../../../../oldComponents/Summary.css'
import messages from '../messages'

const cssClasses = classnames.bind(styles)

const Contacts = ({ id, title, formatMessage, disabled }) => {
  const [edit, setEdit] = useState(false)
  const { data: contacts } = useContactBySite(id)

  return (
    <div className={cssClasses('Summary')}>
      <div className={cssClasses('Summary__Title')}>{title}</div>
      {edit ? (
        <div className={cssClasses('Summary__Tags__Wrap')}>
          <ReadOnlyField
            label="read"
            hideLabel
            value={contacts}
            format={v => <ContactTagInput siteId={id} value={v} />}
          />
          <Button variant="contained" onClick={() => setEdit(false)}>
            {formatMessage(messages.actionSave)}
          </Button>
        </div>
      ) : (
        <div className={cssClasses('Summary__Description')}>
          {contacts?.length ? (
            contacts?.map(contact => (
              <Fragment key={contact.id}>
                {contact.name}
                <Link to={`/browse/person/${contact.id}`} className={cssClasses('Summary__Description__Link')}>
                  <FaExternalLink />
                </Link>
              </Fragment>
            ))
          ) : (
            <i>{formatMessage(messages.fieldNoContact)}</i>
          )}
          <span className={cssClasses('Summary__Description__Action')}>
            <Button variant="contained" onClick={() => setEdit(true)} disabled={disabled}>
              {contacts?.length ? formatMessage(messages.actionUpdate) : formatMessage(messages.actionAdd)}
            </Button>
          </span>
        </div>
      )}
    </div>
  )
}
Contacts.defaultProps = {
  disabled: false,
}
Contacts.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  formatMessage: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}

export default Contacts
