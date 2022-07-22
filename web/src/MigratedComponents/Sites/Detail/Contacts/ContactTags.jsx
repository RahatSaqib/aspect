import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import Immutable from 'immutable'
import { connect } from 'react-redux'

import TagInput from '../../../../components/shared/TagInput'
import { fetchAvailablePersons, fetchUpdateSiteContacts } from '../../../../person/PersonRedux'

const ContactsTag = ({ siteId, contacts, value, fetchAvailablePersons, fetchUpdateSiteContacts, ...restProps }) => {
  useEffect(() => {
    fetchAvailablePersons('person')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const contactsList = contacts.getIn(['person', 'items'], Immutable.List()).toJS()

  const removeContact = ({ id }) => {
    const person = { id }
    fetchUpdateSiteContacts(siteId, person, 'delete')
  }
  const addContact = ({ id }) => {
    const person = { id }
    fetchUpdateSiteContacts(siteId, person)
  }
  return (
    <TagInput
      allowCreate
      keepFocusOnChange
      source={contactsList}
      value={value}
      tagName="name"
      onDelete={removeContact}
      onAdd={addContact}
      {...restProps}
    />
  )
}

const mapStateToProps = state => ({
  contacts: state.person.availableContacts,
})

ContactsTag.propTypes = {
  contacts: PropTypes.oneOfType([PropTypes.instanceOf(Immutable.List), PropTypes.instanceOf(Immutable.Map)]).isRequired,
  fetchAvailablePersons: PropTypes.func.isRequired,
  fetchUpdateSiteContacts: PropTypes.func.isRequired,
  siteId: PropTypes.string.isRequired,
  value: PropTypes.arrayOf(PropTypes.object).isRequired,
}
export default connect(mapStateToProps, {
  fetchAvailablePersons,
  fetchUpdateSiteContacts,
})(ContactsTag)
