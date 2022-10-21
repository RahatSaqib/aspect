import React from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import { useFormikContext } from 'formik'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import PropTypes from 'prop-types'
import useI18n from '../../hooks/useI18n'
import styles from './Form.css'
import { getFormattedString, getLabel } from './Formik/Helpers'
import AspectInput from './Inputs'
import AspectTextField from './Inputs/TextField'

const cssClasses = classnames.bind(styles)

const FormItem = ({
  classNames,
  controlType,
  fullWidth,
  hideIfNull,
  id,
  label,
  labelI18nKey,
  link,
  messages,
  placeholder,
  type,
  validate,
  visibleIf,
  disabledIf,
  subRowIndex,
}) => {
  const { formatMessage } = useI18n()
  const { formik, toggleEdit } = useFormikContext()
  const { getFieldProps, values } = formik
  const value = values[id]
  let isVisible = !(hideIfNull && isEmpty(value) && !toggleEdit)
  if (isVisible && visibleIf) {
    isVisible = visibleIf(formik.values, toggleEdit, subRowIndex)
  }

  /**
   * TODO: change below isRequired and get actual `required` prop from
   * validationSchema - notice that some fields in validationSchema are
   * defined with conditions and/or in deep structure via Yup.array()
   */
  const isRequired = !!get(formik.errors, id) && !get(formik.touched, id)

  const i18nTools = { messages, formatMessage, formik }
  const { component } = controlType || {}

  if (component === 'hidden') {
    return <input type="hidden" name={id} id={id} />
  }

  return isVisible ? (
    <Grid
      item
      xs={12}
      md={fullWidth ? 12 : 6}
      lg={fullWidth ? 12 : 4}
      className={cssClasses('form__sectionItemContainer', {
        [classNames.itemContainer]: !!classNames.itemContainer,
      })}
    >
      <AspectInput
        {...getFieldProps(id)}
        id={id}
        input={type}
        controlType={{ ...controlType, subRowIndex }}
        label={`${getLabel({ ...i18nTools, labelI18nKey, label })}${isRequired ? '*' : ''}`}
        link={link}
        placeholder={getFormattedString(placeholder, i18nTools, ' - ')}
        className={cssClasses('form__sectionItemInput', {
          'form__sectionItemInput--enabled': toggleEdit,
          'form__sectionItemInput--disabled': !toggleEdit,
          [classNames.item]: !!classNames.item,
        })}
        classNames={classNames}
        fullWidth
        InputProps={{
          readOnly: !toggleEdit,
          // is used for TextField, TextArea, Select
          disabled:
            !toggleEdit || type === 'readOnly' || (disabledIf && disabledIf(formik.values, toggleEdit, subRowIndex)),
          disableUnderline: !toggleEdit || type === 'readOnly',
        }}
        InputLabelProps={{ shrink: true }}
        formik={formik}
        validate={validate}
      />
    </Grid>
  ) : null
}

FormItem.defaultProps = {
  controlType: {
    component: AspectTextField,
  },
  classNames: {},
  fullWidth: false,
  hideIfNull: false,
  initialValue: null,
  label: null,
  labelI18nKey: null,
  link: false,
  placeholder: null,
  type: 'text',
  validate: () => '',
  visibleIf: () => true,
  disabledIf: () => false,
  subRowIndex: 0,
}

FormItem.propTypes = {
  classNames: PropTypes.objectOf(PropTypes.shape),
  controlType: PropTypes.objectOf(PropTypes.shape),
  fullWidth: PropTypes.bool,
  hideIfNull: PropTypes.bool,
  id: PropTypes.string.isRequired,
  initialValue: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.array]),
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  labelI18nKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  link: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  messages: PropTypes.oneOfType([PropTypes.object]).isRequired,
  placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  type: PropTypes.string,
  validate: PropTypes.oneOfType([PropTypes.func]),
  visibleIf: PropTypes.oneOfType([PropTypes.func]),
  disabledIf: PropTypes.oneOfType([PropTypes.func]),
  subRowIndex: PropTypes.number,
}

export default FormItem
