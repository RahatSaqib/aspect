import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import _fp from 'lodash/fp'
import Immutable from 'immutable'
import { connect } from 'react-redux'

import TagInput from '../../../components/shared/TagInput'
import { fetchAvailablePersons } from '../../../person/PersonRedux'
import {fetchAssignPerson} from '../../../site/SiteRedux'

const ContactsTag = ({
  qryId,
  qryType,
  contacts,
  value,
  onTagChange,
  fetchAvailablePersons,
  fetchAssignPerson,
  ...restProps
}) => {
  useEffect(() => {
    fetchAvailablePersons(qryType) // fetching contacts
  }, [])

  const contactsList = contacts
    .getIn(['person', 'items'], Immutable.List())
    .toJS()
  
  const onChange = value => {
    // remove (sets siteid in jobcontext to null) or add (sets site id to curr id)contact =
    debugger
    contacts.find(val => val.name === value).id = qryId
    // onTagChange(qryId, qryType, value)
  }
  const removeContact = value => {
    alert(`removing ${value}`)
  }
  const addContact = ({ id }) => {
    const person = { id }
    console.log(person, fetchAssignPerson())
    fetchAssignPerson(qryId, person)
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
  contacts: state.person.contacts,
})

ContactsTag.defaultProps = {
  identifier: 'title',
}

ContactsTag.propTypes = {
  fetchAvailablePersons: PropTypes.func.isRequired,
  qryId: PropTypes.string.isRequired,
  qryType: PropTypes.oneOf(['result', 'device', 'site', 'person']).isRequired,
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
