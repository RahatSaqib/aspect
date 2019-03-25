import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import _fp from 'lodash/fp'
import Immutable from 'immutable'
import { connect } from 'react-redux'

import TagInput from '../../../components/shared/TagInput'
import {
  fetchAvailablePersons,
  fetchAssignPerson,
} from '../../../person/PersonRedux'

const ContactsTag = ({
  siteId,
  contacts,
  value,
  onTagChange,
  fetchAvailablePersons,
  fetchAssignPerson,
  ...restProps
}) => {
  useEffect(() => {
    fetchAvailablePersons('person') // fetching contacts
  }, [])

  const contactsList = contacts
    .getIn(['person', 'items'], Immutable.List())
    .toJS()

  const onChange = value => {
    // remove (sets siteid in jobcontext to null) or add (sets site id to curr id)contact =
    debugger
    contacts.find(val => val.name === value).id = siteId
    // onTagChange(siteId, qryType, value)
  }
  const removeContact = value => {
    alert(`removing ${value}`)
  }
  const addContact = ({ id }) => {
    const person = { id }
    fetchAssignPerson(siteId, person)
  }
  return (
    <TagInput
      allowCreate
      keepFocusOnChange
      source={contactsList}
      value={value}
      tagName="name"
      onTagChange={onChange}
      onDelete={removeContact}
      onAdd={addContact}
      {...restProps}
    />
  )
}

const mapStateToProps = state => ({
  contacts: state.person.availableContacts,
})

ContactsTag.defaultProps = {
  identifier: 'title',
}

ContactsTag.propTypes = {
  fetchAvailablePersons: PropTypes.func.isRequired,
  siteId: PropTypes.string.isRequired,
  // qryType: PropTypes.oneOf(['result', 'device', 'site', 'person']).isRequired,
  // value: PropTypes.arrayOf(PropTypes.string).isRequired,
  // contacts: array of contacts
  onTagChange: PropTypes.func.isRequired,
  identifier: PropTypes.string,
}
export default connect(mapStateToProps, {
  fetchAvailablePersons,
  fetchAssignPerson,
})(ContactsTag)
// export default ContactsTag
