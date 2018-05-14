import React from 'react'
import PropTypes from 'prop-types'
import _fp from 'lodash/fp'
import Immutable from 'immutable'
import {
  compose,
  lifecycle,
  mapProps,
  pure,
  setPropTypes,
  withHandlers,
} from 'recompose'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import TagInput from '../components/shared/TagInput'
import { fetchPossibleTags } from '../tag/TagRedux'

const enhance = compose(
  pure,
  setPropTypes({
    qryId: PropTypes.string.isRequired,
    qryType: PropTypes.oneOf(['result', 'device', 'site', 'person']).isRequired,
    onTagChange: PropTypes.func.isRequired,
  }),
  connect(
    state => ({
      tags: state.tag.possibleTags,
    }),
    bindActionCreators.bind(null, {
      fetchPossibleTags,
    })
  ),
  lifecycle({
    componentDidMount() {
      const { qryType } = this.props
      this.props.fetchPossibleTags(qryType)
    },
  }),
  withHandlers({
    onTagChange: ({ qryId, qryType, onTagChange }) => value => {
      onTagChange(qryId, qryType, value)
    },
  }),
  mapProps(props => ({
    ..._fp.omit(['fetchTags'], props),
    possibleTags: _fp.map(
      'title',
      props.tags.getIn([props.qryType, 'items'], Immutable.List()).toJS()
    ),
    value: _fp.map('title', props.value),
  }))
)

const ConnectedTagInput = ({
  possibleTags,
  value,
  onTagChange,
  ...restProps
}) => (
  <TagInput
    allowCreate
    keepFocusOnChange
    source={possibleTags}
    value={value}
    onTagChange={onTagChange}
    {...restProps}
  />
)

export default enhance(ConnectedTagInput)
