// Imports from packages
import _ from 'lodash'
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Our own imports
import { FormContainer } from './Form'
import Display from './Display'
import { injectEditable } from '../../../hoc'
import { updateSingleDevice } from '../../../../action_creators/device_creators'

export class EditableFields extends React.PureComponent {
  static propTypes = {
    updateSingleDevice: React.PropTypes.func.isRequired,
    editable: React.PropTypes.bool.isRequired,
    device: React.PropTypes.object.isRequired
  }

  handleSubmit = data => {
    const { device } = this.props

    this.props.updateSingleDevice(device.get('id'), {
      // Map form fields to API fields
      name: data.get('name'),
      shortname: data.get('shortName'),
      siteId: data.get('site')
    })
  }

  renderFormContainer(device) {
    const initialValues = {
      // Map API fields to form fields
      name: device.get('name'),
      shortName: device.get('shortname'),
      site: device.get('siteId')
    }
    return (
      <FormContainer
        enableReinitialize
        initialValues={initialValues}
        onSubmit={this.handleSubmit}
      />
    )
  }

  renderDisplay(device) {
    const fields = [
      {
        label: 'Name',
        value: device.get('name')
      },
      {
        label: 'Shortname',
        value: device.get('shortname')
      },
      {
        label: 'Site (ddl)',
        value: device.get('siteId')
      }
    ]
    return (
      <Display fields={fields} />
    )
  }

  render() {
    const { editable, device } = this.props

    return (
      editable ?
      this.renderFormContainer(device) :
      this.renderDisplay(device)
    )
  }
}

function mapStateToProps() {
  return {
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    updateSingleDevice
  }, dispatch)
}

export const EditableFieldsContainer = _.flowRight(
  connect(mapStateToProps, mapDispatchToProps),
  injectEditable
)(EditableFields)
