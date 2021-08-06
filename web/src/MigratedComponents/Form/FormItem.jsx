import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'
import isNil from 'lodash/isNil'
import isEmpty from 'lodash/isEmpty'

import useI18n from '../../Hooks/i18n/useI18n'
import { useFormikState } from './Formik/Context'
import { getFormattedString, getLabel } from './Formik/Helpers'
import AspectInput from './Inputs'
import AspectTextField from './Inputs/TextField'

import styles from './Form.css'

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
}) => {
  const { formatMessage } = useI18n()
  const { formik, toggleEdit } = useFormikState()
  const { getFieldProps, values } = formik
  const value = values[id]
  let isVisible = !(hideIfNull && isEmpty(value))
  if (isVisible && visibleIf) {
    isVisible = visibleIf(formik.values)
  }

  const i18nTools = { messages, formatMessage, formik }

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
        controlType={controlType}
        label={getLabel({
          ...i18nTools,
          labelI18nKey,
          label,
        })}
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
          disabled: !toggleEdit || type === 'readOnly',
          disableUnderline: !toggleEdit || type === 'readOnly',
        }}
        InputLabelProps={{
          shrink: true,
        }}
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
}

FormItem.propTypes = {
  classNames: PropTypes.objectOf(PropTypes.shape),
  controlType: PropTypes.objectOf(PropTypes.shape),
  fullWidth: PropTypes.bool,
  hideIfNull: PropTypes.bool,
  id: PropTypes.string.isRequired,
  initialValue: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  labelI18nKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  link: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  messages: PropTypes.oneOfType([PropTypes.object]).isRequired,
  placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  type: PropTypes.string,
  validate: PropTypes.oneOfType([PropTypes.func]),
  visibleIf: PropTypes.oneOfType([PropTypes.func]),
}

export default FormItem
