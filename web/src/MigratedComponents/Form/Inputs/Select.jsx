import React from 'react'
import PropTypes from 'prop-types'

import FormControl from '@material-ui/core/FormControl'

import AspectDropDown from '../../AspectDropDown'
import { FormikContext } from '../Formik/Context'
import UI_CONSTS from '../../../globals/consts/UI'

const AspectSelect = props => {
  const {
    className,
    classNames,
    controlType: { options = [] },
    id,
    label,
  } = props

  return (
    <FormikContext.Consumer>
      {({ formik }) => (
        <FormControl className={className}>
          <div className={classNames.controlLabel}>{label}</div>
          <AspectDropDown
            props={{
              classNames,
              identifier: id,
              data: {
                [id]: options,
              },
              state: id,
              isClearable: false,
              keyMapping: {
                idKey: 'value',
                nameKey: 'label',
              },
              defaultSelectedOption: options.findIndex(
                it => it.value === formik.values[id]
              ),
            }}
            action={({ identifier, selectedOption }) => {
              const value = selectedOption
                ? selectedOption.value // selected value
                : formik.initialValues[id] // reset to initial value
              formik.setFieldValue(identifier, value)
            }}
            theme={UI_CONSTS.themeName.mui}
          />
        </FormControl>
      )}
    </FormikContext.Consumer>
  )
}

AspectSelect.defaultProps = {
  className: '',
  classNames: {},
  label: '',
}

AspectSelect.propTypes = {
  className: PropTypes.string,
  classNames: PropTypes.objectOf(PropTypes.shape),
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  controlType: PropTypes.objectOf(PropTypes.shape).isRequired,
}
export default AspectSelect
