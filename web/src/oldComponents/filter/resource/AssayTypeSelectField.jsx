import React from 'react'
import { MenuItem } from '@mui/material'
import PropTypes from 'prop-types'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'
import { compose, setPropTypes, lifecycle, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import useI18n from '../../../hooks/useI18n'
import { fetchAssayTypes } from '../../../store/AssayTypeRedux'
import SelectField from '../../shared/SelectField'

const messages = defineMessages({
  assayTypeCD4: {
    id: 'filter.AssayTypeSelectField.assayTypeCD4',
    defaultMessage: 'CD4 Count',
  },
  covid19: {
    id: 'filter.AssayTypeSelectField.covid19',
    defaultMessage: 'COVID-19 Test',
  },
  assayTypeDengue: {
    id: 'filter.AssayTypeSelectField.assayTypeDengue',
    defaultMessage: 'Dengue',
  },
  assayTypeEbola: {
    id: 'filter.AssayTypeSelectField.assayTypeEbola',
    defaultMessage: 'Ebola',
  },
  assayTypeEid: {
    id: 'filter.AssayTypeSelectField.assayTypeEid',
    defaultMessage: 'EID',
  },
  genericRDT: {
    id: 'filter.AssayTypeSelectField.genericRDT',
    defaultMessage: 'Generic RDT',
  },
  genoTypeTestStrip: {
    id: 'filter.AssayTypeSelectField.genoTypeTestStrip',
    defaultMessage: 'GenoType Test Strip',
  },
  assayTypeHbvVl: {
    id: 'filter.AssayTypeSelectField.assayTypeHbvVl',
    defaultMessage: 'HBV VL',
  },
  assayTypeHcv: {
    id: 'filter.AssayTypeSelectField.assayTypeHcv',
    defaultMessage: 'HCV',
  },
  assayTypeHivQual: {
    id: 'filter.AssayTypeSelectField.assayTypeHivQual',
    defaultMessage: 'HIV Qual',
  },
  assayTypeHivVl: {
    id: 'filter.AssayTypeSelectField.assayTypeHivVl',
    defaultMessage: 'HIV VL',
  },
  assayTypeLipidPanel: {
    id: 'filter.AssayTypeSelectField.assayTypeLipidPanel',
    defaultMessage: 'Lipid Panel',
  },
  assayTypeMtbRif: {
    id: 'filter.AssayTypeSelectField.assayTypeMtbRif',
    defaultMessage: 'MTB/Rif',
  },
  assayTypeTbAst: {
    id: 'filter.AssayTypeSelectField.assayTypeTbAst',
    defaultMessage: 'TB AST',
  },
  assayTypeTbGnd: {
    id: 'filter.AssayTypeSelectField.assayTypeTbGnd',
    defaultMessage: 'TB G&D',
  },
  assayTypeUnknown: {
    id: 'filter.AssayTypeSelectField.assayTypeUnknown',
    defaultMessage: 'Unknown',
  },
  assayTypeZika: {
    id: 'filter.AssayTypeSelectField.assayTypeZika',
    defaultMessage: 'Zika',
  },
})

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
