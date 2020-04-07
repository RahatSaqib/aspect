import PropTypes from 'prop-types'
import { defineMessages } from 'react-intl'
import React from 'react'
import { compose, setPropTypes, lifecycle, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchAssayTypes } from '../../assay/AssayTypeRedux'

const messages = defineMessages({
  assayTypeMtbRif: {
    id: 'filter.AssayTypeSelectField.assayTypeMtbRif',
    defaultMessage: 'MTB/Rif',
  },
  assayTypeEbola: {
    id: 'filter.AssayTypeSelectField.assayTypeEbola',
    defaultMessage: 'Ebola',
  },
  assayTypeHivVl: {
    id: 'filter.AssayTypeSelectField.assayTypeHivVl',
    defaultMessage: 'HIV VL',
  },
  assayTypeHbvVl: {
    id: 'filter.AssayTypeSelectField.assayTypeHbvVl',
    defaultMessage: 'HBV VL',
  },
  assayTypeHivQual: {
    id: 'filter.AssayTypeSelectField.assayTypeHivQual',
    defaultMessage: 'HIV Qual',
  },
  assayTypeCD4: {
    id: 'filter.AssayTypeSelectField.assayTypeCD4',
    defaultMessage: 'CD4 Count',
  },
  assayTypeEid: {
    id: 'filter.AssayTypeSelectField.assayTypeEid',
    defaultMessage: 'EID',
  },
  assayTypeHcv: {
    id: 'filter.AssayTypeSelectField.assayTypeHcv',
    defaultMessage: 'HCV',
  },
  assayTypeLipidPanel: {
    id: 'filter.AssayTypeSelectField.assayTypeLipidPanel',
    defaultMessage: 'Lipid Panel',
  },
  assayTypeZika: {
    id: 'filter.AssayTypeSelectField.assayTypeZika',
    defaultMessage: 'Zika',
  },
  assayTypeDengue: {
    id: 'filter.AssayTypeSelectField.assayTypeDengue',
    defaultMessage: 'Dengue',
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
  genericRDT: {
    id: 'filter.AssayTypeSelectField.genericRDT',
    defaultMessage: 'Generic RDT',
  },
  genoTypeTestStrip: {
    id: 'filter.AssayTypeSelectField.genoTypeTestStrip',
    defaultMessage: 'GenoType Test Strip',
  },
  covid19: {
    id: 'filter.AssayTypeSelectField.covid19',
    defaultMessage: 'COVID-19 Test',
  },
})

const enhance = compose(
  pure,
  setPropTypes({
    allItemText: PropTypes.string,
    intl: PropTypes.object.isRequired,
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
    componentWillMount() {
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

export const AssayTypeSelectField = ({
  allItemText,
  intl,
  fetchAssayTypes,
  assayTypes,
  onChange,
  diseaseId,
  ...restProps
}) => (
  <SelectField
    {...restProps}
    onChange={onChange}
    disabled={
      restProps.disabled || assayTypes.loading || assayTypes.items.isEmpty()
    }
  >
    {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
    {assayTypes.items
      .filter(
        at =>
          !diseaseId ||
          !at.get('diseaseId') ||
          at.get('diseaseId').toString() === diseaseId.toString()
      )
      .map(at => (
        <MenuItem key={at.get('id')} value={at.get('id')}>
          {messages[at.get('i18nKey')]
            ? intl.formatMessage(messages[at.get('i18nKey')])
            : at.get('name')}
        </MenuItem>
      ))}
  </SelectField>
)

export default enhance(AssayTypeSelectField)
