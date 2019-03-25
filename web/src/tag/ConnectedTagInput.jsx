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
  tags,
  maxTags,
  value,
  onTagChange,
  fetchPossibleTags,
  ...restProps
}) => {
  useEffect(() => {
    fetchPossibleTags(qryType)
  }, [])
  const possibleTags = tags.getIn([qryType, 'items'], Immutable.List()).toJS()

  const onChange = value => {
    const tags = _fp.map('title', value)
    onTagChange(qryId, qryType, tags)
  }

  const onDelete = (item, selectedItem) => {
    const newSelectedItem = [...selectedItem]
    newSelectedItem.splice(newSelectedItem.indexOf(item), 1)
    onChange(newSelectedItem)
  }

  const onAdd = (item, selectedItem) => {
    const newTag = _fp.isObject(item) ? item.title : item

    if (newTag && newTag.trim() === '') {
      return
    }
    if (maxTags > 0 && selectedItem.length >= maxTags) {
      return
    }

    const isExist = Array.from(selectedItem).some(
      val => val.title.toLowerCase() === newTag.toLowerCase()
    )

    const newSelectedItem = !isExist
      ? [...selectedItem, { title: newTag }]
      : [...selectedItem]

    onChange(newSelectedItem)
  }

  return (
    <TagInput
      allowCreate
      keepFocusOnChange
      source={possibleTags}
      value={value}
      tagName="title"
      onAdd={onAdd}
      onDelete={onDelete}
      onTagChange={onChange}
      {...restProps}
    />
  )
}

const mapStateToProps = state => ({
  tags: state.tag.possibleTags,
})

ConnectedTagInput.defaultProps = {
  maxTags: 10,
}

ConnectedTagInput.propTypes = {
  fetchPossibleTags: PropTypes.func.isRequired,
  qryId: PropTypes.string.isRequired,
  qryType: PropTypes.oneOf(['result', 'device', 'site', 'person']).isRequired,
  value: PropTypes.arrayOf(PropTypes.string).isRequired,
  onTagChange: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  maxTags: PropTypes.number,
}

export default connect(mapStateToProps, { fetchPossibleTags })(
  ConnectedTagInput
)
