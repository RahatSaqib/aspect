import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import _fp from 'lodash/fp'
import Immutable from 'immutable'
import { connect } from 'react-redux'

import TagInput from '../components/shared/TagInput'
import { fetchPossibleTags } from './TagRedux'

const ConnectedTagInput = ({
  qryId,
  qryType,
  possibleTags,
  maxTags,
  value,
  onTagChange,
  fetchPossibleTags,
  ...restProps
}) => {
  useEffect(() => {
    fetchPossibleTags(qryType)
  }, [])
  const onChange = value => {
    onTagChange(qryId, qryType, value)
  }

  const onDelete = (item, selectedItem) => {
    const newSelectedItem = [...selectedItem]
    newSelectedItem.splice(newSelectedItem.indexOf(item), 1)
    onChange(newSelectedItem)
  }

  const onAdd = (item, selectedItem) => {
    if (item && item.trim() === '') {
      return
    }
    if (maxTags > 0 && selectedItem.length >= maxTags) {
      return
    }

    const isExist = Array.from(selectedItem).some(
      val => val.toLowerCase() === item.toLowerCase()
    )
    const newSelectedItem = !isExist
      ? [...selectedItem, item]
      : [...selectedItem]
    onChange(newSelectedItem)
  }

  return (
    <TagInput
      allowCreate
      keepFocusOnChange
      source={possibleTags}
      value={value}
      onAdd={onAdd}
      onDelete={onDelete}
      onTagChange={onChange}
      {...restProps}
    />
  )
}

const mapStateToProps = (state, ownProps) => {
  const tags = state.tag.possibleTags
  return {
    tags,
    ..._fp.omit(['fetchTags'], ownProps),
    possibleTags: _fp.map(
      'title',
      tags.getIn([ownProps.qryType, 'items'], Immutable.List()).toJS()
    ),
    value: _fp.map('title', ownProps.value),
  }
}
ConnectedTagInput.defaultProps = {
  maxTags: 10,
}

ConnectedTagInput.propTypes = {
  fetchPossibleTags: PropTypes.func.isRequired,
  qryId: PropTypes.string.isRequired,
  qryType: PropTypes.oneOf(['result', 'device', 'site', 'person']).isRequired,
  possibleTags: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.arrayOf(PropTypes.string).isRequired,
  onTagChange: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  maxTags: PropTypes.number,
}

export default connect(mapStateToProps, { fetchPossibleTags })(
  ConnectedTagInput
)
