// Imports from packages
import React from 'react'

// Our own imports
import { FormContainer } from './Form'
import Display from './Display'
import { injectEditable } from '../../../hoc'

export class EditableFields extends React.PureComponent {
  static propTypes = {
    editable: React.PropTypes.bool.isRequired,
    device: React.PropTypes.object.isRequired
  }

  renderFormContainer(device, restProps) {
    const initialValues = {
      name: device.get('name'),
      shortName: device.get('shortname'),
      site: device.get('id')
    }
    return (
      <FormContainer initialValues={initialValues} {...restProps} />
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
        value: device.get('id')
      }
    ]
    return (
      <Display fields={fields} />
    )
  }

  render() {
    const { editable, device, ...restProps } = this.props

    return (
      editable ?
      this.renderFormContainer(device, restProps) :
      this.renderDisplay(device)
    )
  }
}

export const EditableFieldsContainer = injectEditable(EditableFields)

