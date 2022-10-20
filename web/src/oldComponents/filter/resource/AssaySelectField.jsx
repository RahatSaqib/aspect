import React, { PureComponent } from 'react'
import { MenuItem } from '@mui/material'
import Immutable from 'immutable'
import flowRight from 'lodash/flowRight'
import omit from 'lodash/omit'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { assay as messages } from '../../../messages'
import { I18nContext } from '../../../providers/I18nProvider'
import { fetchAssays } from '../../../store/AssayRedux'
import SelectField from '../../shared/SelectField'

export class AssaySelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchAssays: PropTypes.func.isRequired,
    assayItems: PropTypes.instanceOf(Immutable.List).isRequired,
    assayItemsLoading: PropTypes.bool,
    onAssayChange: PropTypes.func.isRequired,
    diseaseId: PropTypes.string,
    assayTypeId: PropTypes.string,
    deviceTypeId: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    multiple: PropTypes.bool,
  }

  static defaultProps = {
    allItemText: 'All',
    assayItemsLoading: false,
    diseaseId: '',
    assayTypeId: '',
    deviceTypeId: '',
    value: '',
    multiple: true,
  }

  static contextType = I18nContext

  constructor(props) {
    super()
    props.fetchAssays(false)
  }

  handleChange = ({ target: { value } }) => {
    /**
     * Because SelectField goes with prop `multiple` - `value` is array
     * of all selected values. When `All` selected - reset this filter.
     */
    this.props.onAssayChange(value.includes('all') ? undefined : value)
  }

  render() {
    const {
      allItemText,
      assayItems,
      assayItemsLoading,
      assayTypeId,
      deviceTypeId,
      diseaseId,
      onAssayChange,
      value,
      ...rest
    } = this.props

    const validAssays = assayItems.filter(a => a.get('hasResults'))
    const isSingleAssay = validAssays.size === 1
    const restProps = omit(rest, ['fetchAssays'])
    const { formatMessage } = this.context

    if (assayItemsLoading === false && isSingleAssay && value !== validAssays.first().get('id')) {
      onAssayChange(validAssays.first().get('id'))
    } else if (assayItemsLoading === false && validAssays.size === 0 && value) onAssayChange()

    const validFilteredAssays = assayItems =>
      assayItems.filter(
        a =>
          (!diseaseId || !a.get('diseaseId') || a.get('diseaseId').toString() === diseaseId.toString()) &&
          (!assayTypeId || !a.get('assayTypeId') || a.get('assayTypeId').toString() === assayTypeId.toString()) &&
          (!deviceTypeId || !a.get('deviceTypeId') || a.get('deviceTypeId').toString() === deviceTypeId.toString())
      )
    const textForAssayItem = assayItem => {
      return (
        (messages[assayItem.get('i18nKey')]
          ? formatMessage(messages[assayItem.get('i18nKey')])
          : assayItem.get('name')) || assayItem.get('name')
      )
    }

    return (
      <SelectField
        {...restProps}
        value={value}
        onChange={this.handleChange}
        disabled={isSingleAssay || validFilteredAssays(validAssays).size <= 1}
        multiple={rest.multiple}
      >
        {rest.multiple ? <MenuItem value="all">{allItemText}</MenuItem> : null}
        {validFilteredAssays(validAssays).map(a => (
          <MenuItem key={a.get('id')} value={a.get('id')}>
            {textForAssayItem(a)}
          </MenuItem>
        ))}
      </SelectField>
    )
  }
}

function mapStateToProps(state) {
  return {
    assayItems: state.assay.items,
    assayItemsLoading: state.assay.loading,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchAssays,
    },
    dispatch
  )
}

export default flowRight(connect(mapStateToProps, mapDispatchToProps))(AssaySelectField)
