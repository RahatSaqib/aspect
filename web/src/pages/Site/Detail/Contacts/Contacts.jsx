import React, { Fragment, useState } from 'react'
import { Button } from '@mui/material'
import PropTypes from 'prop-types'
import { FaExternalLinkAlt as FaExternalLink } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { ContactTagInput } from '../../../../components'
import { ReadOnlyField } from '../../../../components/shared/ReadOnlyFields'
import styles from '../../../../components/Summary.module.css'
import useContactBySite from '../../../../hooks/person/useContactBySite'
import messages from '../messages'

const Contacts = ({ id, title, formatMessage, disabled }) => {
  const [edit, setEdit] = useState(false)
  const { data: contacts } = useContactBySite(id)

  return (
    <div className={styles.Summary}>
      <div className={styles.Summary__Title}>{title}</div>
      {edit ? (
        <div className={styles.Summary__Tags__Wrap}>
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
        <div className={styles.Summary__Description}>
          {contacts?.length ? (
            contacts?.map(contact => (
              <Fragment key={contact.id}>
                {contact.name}
                <Link to={`/browse/person/${contact.id}`} className={styles.Summary__Description__Link}>
                  <FaExternalLink />
                </Link>
              </Fragment>
            ))
          ) : (
            <i>{formatMessage(messages.fieldNoContact)}</i>
          )}
          <span className={styles.Summary__Description__Action}>
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
  id: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  formatMessage: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}

export default Contacts
