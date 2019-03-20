import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import _fp from 'lodash/fp'
import Immutable from 'immutable'
import { connect } from 'react-redux'

import TagInput from '../../../components/shared/TagInput'
import { fetchAvailablePersons } from '../../../person/PersonRedux'

const ContactsTag = ({
  qryId,
  qryType,
  contacts,
  availableContacts,
  value,
  onTagChange,
  fetchAvailablePersons,
  ...restProps
}) => {
  useEffect(() => {
    fetchAvailablePersons(qryType) // fetching contacts
  }, [])
  const onChange = value => {
    // remove (sets siteid in jobcontext to null) or add (sets site id to curr id)contact =
    debugger
    contacts.find(val => val.name === value).id = qryId
    // onTagChange(qryId, qryType, value)
  }
  const removeContact = value => {
    alert(`removing ${value}`)
  }
  const addContact = value => {
    alert(`adding ${value}`)
  }
  return (
    <TagInput
      allowCreate
      keepFocusOnChange
      source={availableContacts}
      value={value}
      onTagChange={onChange}
      onDelete={removeContact}
      addContact={addContact}
      {...restProps}
    />
  )
}

const mapStateToProps = (state, ownProps) => {
  const { contacts } = state.person
  return {
    contacts,
    ..._fp.omit(['fetchContacts'], ownProps),
    availableContacts: _fp.map(
      ownProps.identifier,
      contacts.getIn(['person', 'items'], Immutable.List()).toJS()
    ),
    value: _fp.map(ownProps.identifier, ownProps.value),
  }
}

ContactsTag.defaultProps = {
  identifier: 'title',
}

ContactsTag.propTypes = {
  fetchAvailablePersons: PropTypes.func.isRequired,
  qryId: PropTypes.string.isRequired,
  qryType: PropTypes.oneOf(['result', 'device', 'site', 'person']).isRequired,
  availableContacts: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.arrayOf(PropTypes.string).isRequired,
  onTagChange: PropTypes.func.isRequired,
  identifier: PropTypes.string,
}
export default connect(mapStateToProps, { fetchAvailablePersons })(ContactsTag)
// export default ContactsTag
