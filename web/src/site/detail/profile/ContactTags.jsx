import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import _fp from 'lodash/fp'
import Immutable from 'immutable'
import { connect } from 'react-redux'

import TagInput from '../../../components/shared/TagInput'
import {
  fetchAvailablePersons,
  fetchUpdateSiteContacts,
} from '../../../person/PersonRedux'

const ContactsTag = ({
  siteId,
  contacts,
  value,
  onTagChange,
  fetchAvailablePersons,
  fetchUpdateSiteContacts,
  ...restProps
}) => {
  useEffect(() => {
    fetchAvailablePersons('person') // fetching contacts
  }, [])

  const contactsList = contacts
    .getIn(['person', 'items'], Immutable.List())
    .toJS()

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

ContactsTag.defaultProps = {
  identifier: 'title',
}

ContactsTag.propTypes = {
  fetchAvailablePersons: PropTypes.func.isRequired,
  siteId: PropTypes.string.isRequired,
  // value: PropTypes.arrayOf(PropTypes.string).isRequired,
  // contacts: array of contacts
  onTagChange: PropTypes.func.isRequired,
  identifier: PropTypes.string,
}
export default connect(mapStateToProps, {
  fetchAvailablePersons,
  fetchUpdateSiteContacts,
})(ContactsTag)
