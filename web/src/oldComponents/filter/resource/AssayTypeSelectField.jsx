import React from 'react'
import { MenuItem } from '@mui/material'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { compose, setPropTypes, lifecycle, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import useI18n from '../../../hooks/useI18n'
import { assay as messages } from '../../../messages'
import { fetchAssayTypes } from '../../../store/AssayTypeRedux'
import SelectField from '../../shared/SelectField'

const enhance = compose(
  pure,
  setPropTypes({
    allItemText: PropTypes.string,
    onAssayTypeIdChange: PropTypes.func.isRequired,
    diseaseId: PropTypes.string,
    value: PropTypes.string,
  }),
  connect(
    state => ({
      assayTypes: state.assayType.assayTypes,
    }),
    bindActionCreators.bind(null, {
      fetchAssayTypes,
    })
  ),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.setState({
        onChange: ({ target: { value } }) => {
          this.props.onAssayTypeIdChange(value === 'all' ? undefined : value)
        },
      })
    },

    componentDidMount() {
      this.props.fetchAssayTypes()
    },
  })
)

const textForAssayTypeItem = (assayTypeItem, formatMessage) => {
  return (
    (messages[assayTypeItem.get('i18nKey')]
      ? formatMessage(messages[assayTypeItem.get('i18nKey')])
      : assayTypeItem.get('name')) || assayTypeItem.get('name')
  )
}

export const AssayTypeSelectField = ({
  allItemText,
  assayTypes,
  onChange,
  diseaseId,
  // to remove from restProps
  onAssayTypeIdChange,
  fetchAssayTypes,
  ...restProps
}) => {
  const { formatMessage } = useI18n()
  return (
    <SelectField
      {...restProps}
      onChange={onChange}
      disabled={restProps.disabled || assayTypes.loading || assayTypes.items.isEmpty()}
    >
      {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
      {assayTypes.items
        .filter(at => !diseaseId || !at.get('diseaseId') || at.get('diseaseId').toString() === diseaseId.toString())
        .map(at => (
          <MenuItem key={at.get('id')} value={at.get('id')}>
            {textForAssayTypeItem(at, formatMessage)}
          </MenuItem>
        ))}
    </SelectField>
  )
}

export default enhance(AssayTypeSelectField)
