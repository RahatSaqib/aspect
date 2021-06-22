// Imports from packages
import omit from 'lodash/omit'
import flowRight from 'lodash/flowRight'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Immutable from 'immutable'
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchAssays } from '../../assay/AssayRedux'

import messages from '../../shared/messages/assay'

export class AssaySelectField extends PureComponent {
  static propTypes = {
    // eslint-disable-next-line react/require-default-props
    intl: PropTypes.shape({
      formatMessage: PropTypes.func,
    }),
    allItemText: PropTypes.string,
    fetchAssays: PropTypes.func.isRequired,
    assayItems: PropTypes.instanceOf(Immutable.List).isRequired,
    assayItemsLoading: PropTypes.bool,
    onAssayChange: PropTypes.func.isRequired,
    diseaseId: PropTypes.string,
    assayTypeId: PropTypes.string,
    deviceTypeId: PropTypes.string,
    value: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    assayItemsLoading: false,
    diseaseId: '',
    assayTypeId: '',
    deviceTypeId: '',
    value: '',
  }

  constructor(props) {
    super()
    props.fetchAssays(false)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onAssayChange(value === 'all' ? undefined : value)
  }

  render() {
    const {
      allItemText,
      assayItems,
      assayItemsLoading,
      assayTypeId,
      deviceTypeId,
      diseaseId,
      intl: { formatMessage },
      onAssayChange,
      value,
      ...rest
    } = this.props

    const validAssays = assayItems.filter(a => a.get('hasResults'))
    const isSingleAssay = validAssays.size === 1
    const restProps = omit(rest, ['fetchAssays'])

    if (
      assayItemsLoading === false &&
      isSingleAssay &&
      value !== validAssays.first().get('id')
    ) {
      onAssayChange(validAssays.first().get('id'))
    } else if (assayItemsLoading === false && validAssays.size === 0 && value)
      onAssayChange()

    const validFilteredAssays = assayItems =>
      assayItems.filter(
        a =>
          (!diseaseId ||
            !a.get('diseaseId') ||
            a.get('diseaseId').toString() === diseaseId.toString()) &&
          (!assayTypeId ||
            !a.get('assayTypeId') ||
            a.get('assayTypeId').toString() === assayTypeId.toString()) &&
          (!deviceTypeId ||
            !a.get('deviceTypeId') ||
            a.get('deviceTypeId').toString() === deviceTypeId.toString())
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
      >
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
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

export default flowRight(connect(mapStateToProps, mapDispatchToProps))(
  AssaySelectField
)
