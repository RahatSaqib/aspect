import React from 'react'
import { defineMessages, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import { useFormikState } from './Formik/Context'
import { buildLabel } from './Formik/Helpers'
import AspectInput from './Inputs'

const cssClasses = classnames.bind(require('./Form.css'))

const messages = {
  ...defineMessages({
    siteName: {
      id: 'forms.formItem.siteName',
      defaultMessage: 'Site Name',
    },
    city: {
      id: 'forms.formItem.city',
      defaultMessage: 'City',
    },
    state: {
      id: 'forms.formItem.state',
      defaultMessage: 'State',
    },
    country: {
      id: 'forms.formItem.country',
      defaultMessage: 'Country',
    },
    deviceName: {
      id: 'forms.formItem.deviceName',
      defaultMessage: 'Device Name',
    },
    deviceType: {
      id: 'forms.formItem.deviceType',
      defaultMessage: 'Device Type',
    },
    deviceSerial: {
      id: 'forms.formItem.deviceSerial',
      defaultMessage: 'Device Serial',
    },
    assay: {
      id: 'forms.formItem.assay',
      defaultMessage: 'Assay',
    },
    resultText: {
      id: 'forms.formItem.resultText',
      defaultMessage: 'Result Text',
    },
    errorCode: {
      id: 'forms.formItem.errorCode',
      defaultMessage: 'Error Code',
    },
    notes: {
      id: 'forms.formItem.notes',
      defaultMessage: 'Notes',
    },
    startDate: {
      id: 'forms.formItem.startDate',
      defaultMessage: 'Start Date',
    },
    endDate: {
      id: 'forms.formItem.endDate',
      defaultMessage: 'End Date',
    },
    sampleId: {
      id: 'forms.formItem.sampleId',
      defaultMessage: 'Sample ID',
    },
    sampleType: {
      id: 'forms.formItem.sampleType',
      defaultMessage: 'Sample Type',
    },
    collectedOn: {
      id: 'forms.formItem.collectedOn',
      defaultMessage: 'Collected On',
    },
    sampleCollectionSite: {
      id: 'forms.formItem.sampleCollectionSite',
      defaultMessage: 'Sample Collection Site',
    },
    collectedBy: {
      id: 'forms.formItem.collectedBy',
      defaultMessage: 'Collected By',
    },
    reportableSite: {
      id: 'forms.formItem.reportableSite',
      defaultMessage: 'Reportable Site',
    },
    patient: {
      id: 'forms.formItem.patient',
      defaultMessage: 'Patient',
    },
    patientId: {
      id: 'forms.formItem.patientId',
      defaultMessage: 'Patient ID',
    },
    caseId: {
      id: 'forms.formItem.caseId',
      defaultMessage: 'Case ID',
    },
    technicalDetails: {
      id: 'forms.formItem.technicalDetails',
      defaultMessage: 'Technical Details',
    },
    instrumentSerial: {
      id: 'forms.formItem.instrumentSerial',
      defaultMessage: 'Instrument Serial',
    },
    moduleName: {
      id: 'forms.formItem.moduleName',
      defaultMessage: 'Module Name',
    },
    moduleSerial: {
      id: 'forms.formItem.moduleSerial',
      defaultMessage: 'Module Serial',
    },
    consumableExpirationDate: {
      id: 'forms.formItem.consumableExpirationDate',
      defaultMessage: 'Expiration Date',
    },
    consumableLot: {
      id: 'forms.formItem.consumableLot',
      defaultMessage: 'Lot',
    },
    consumableSerial: {
      id: 'forms.formItem.consumableSerial',
      defaultMessage: 'Consumable Serial',
    },
    senderOperator: {
      id: 'forms.formItem.senderOperator',
      defaultMessage: 'Sender Operator',
    },
  }),
}

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
  const intl = useIntl()
  const { formik, toggleEdit } = useFormikState()
  const { getFieldProps } = formik

  return !hideIfNull || initialValue ? (
    <Grid
      item
      xs={12}
      md={6}
      lg={4}
      className={cssClasses('form__sectionItemContainer', {
        [classNames.sectionItemContainer]: !!classNames.sectionItemContainer,
      })}
    >
      <AspectInput
        {...getFieldProps(id)}
        id={id}
        input={type}
        controlType={controlType}
        label={buildLabel(
          labelI18nKey ? intl.formatMessage(messages[labelI18nKey]) : label,
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
