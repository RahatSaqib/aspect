import React, { useMemo } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import { useFormikContext } from 'formik'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import PropTypes from 'prop-types'
import useI18n from '../../hooks/useI18n'
import styles from './Form.css'
import { getFormattedString, getLabel } from './Formik/Helpers'
import AspectInput from './Inputs/AspectInput'
import AspectTextField from './Inputs/TextField'

const cssClasses = classnames.bind(styles)

const INPUT_LABEL_PROPS = { shrink: true }

/**
 * helpers
 */
// -----------------------------
const getValidation = (fields, path, index) => {
  const name = path[index]
  const field = fields[name]
  if (!field) {
    return null
  }
  if (isEmpty(field.fields)) {
    return field
  }
  return getValidation(field.fields, path, index + 1)
}
// -----------------------------
const isFieldRequired = (validationSchema, id) => {
  if (validationSchema) {
    const path = id.split('.')

    const validation = getValidation(validationSchema.fields, path, 0)
    return !!validation?.exclusiveTests.required
  }
  return false
}

/**
 * component
 */
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
  const { formik, toggleEdit, validationSchema } = useFormikContext()
  const { getFieldProps, values } = formik
  const value = values[id]
  let isVisible = !(hideIfNull && isEmpty(value) && !toggleEdit)
  if (isVisible && visibleIf) {
    isVisible = visibleIf(formik.values, toggleEdit, subRowIndex)
  }

  /**
   * getting actual `required` prop from validationSchema
   * FYI: Notice that some fields in validationSchema are
   * defined with conditions and we use `exclusiveTests` in isFieldRequired() for that
   */
  let isRequired = isFieldRequired(validationSchema, id)
  /**
   * in a very rare use case when we directly add error in formik.errors without having
   * 'require' flag in validationSchema - set such field required too and show asterisk
   */
  if (!isRequired && get(formik.errors, id)) {
    isRequired = true
  }

  const i18nTools = { messages, formatMessage, formik }
  const { component } = controlType || {}
  const controlTypeActual = useMemo(
    () => ({ ...controlType, subRowIndex }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlType, subRowIndex, controlType.options]
  )
  const inputProps = useMemo(
    () => ({
      readOnly: !toggleEdit,
      // is used for TextField, TextArea, Select
      disabled:
        !toggleEdit || type === 'readOnly' || (disabledIf && disabledIf(formik.values, toggleEdit, subRowIndex)),
      disableUnderline: !toggleEdit || type === 'readOnly',
    }),
    [disabledIf, formik.values, subRowIndex, toggleEdit, type]
  )

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
        controlType={controlTypeActual}
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
        InputProps={inputProps}
        InputLabelProps={INPUT_LABEL_PROPS}
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
  initialValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
    PropTypes.array,
    PropTypes.object,
    PropTypes.number,
  ]),
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
