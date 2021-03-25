import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import useI18n from '../../Hooks/i18n/useI18n'
import { useFormikState } from './Formik/Context'
import { buildLabel } from './Formik/Helpers'
import AspectInput from './Inputs'
import messages from './messages'

const cssClasses = classnames.bind(require('./Form.css'))

const FormItem = ({
  classNames,
  id,
  label,
  labelI18nKey,
  link,
  type,
  controlType,
  hideIfNull,
  initialValue,
}) => {
  const { formatMessage } = useI18n()
  const { formik, toggleEdit } = useFormikState()
  const { getFieldProps } = formik

  return !hideIfNull || initialValue ? (
    <Grid
      item
      xs={12}
      md={6}
      lg={4}
      className={cssClasses('form__sectionItemContainer', {
        [classNames.itemContainer]: !!classNames.itemContainer,
      })}
    >
      <AspectInput
        {...getFieldProps(id)}
        id={id}
        input={type}
        controlType={controlType}
        label={buildLabel(
          labelI18nKey ? formatMessage(messages[labelI18nKey]) : label,
          false
        )}
        link={link}
        placeholder=" - "
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
      />
    </Grid>
  ) : null
}

FormItem.defaultProps = {
  classNames: {},
  hideIfNull: false,
  labelI18nKey: null,
  link: false,
}

FormItem.propTypes = {
  classNames: PropTypes.objectOf(PropTypes.shape),
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  labelI18nKey: PropTypes.string,
  link: PropTypes.oneOf([PropTypes.object, PropTypes.bool]),
  type: PropTypes.string.isRequired,
  controlType: PropTypes.objectOf(PropTypes.shape).isRequired,
  hideIfNull: PropTypes.bool,
  initialValue: PropTypes.string.isRequired,
}

export default FormItem
