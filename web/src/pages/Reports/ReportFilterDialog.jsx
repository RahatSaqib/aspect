import React, { useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { FaDownload } from 'react-icons/fa'
import { FiRefreshCw } from 'react-icons/fi'
import { useIntl } from 'react-intl'
import ReportParameterForm, { getReportParameters } from '../../components/ReportParameterForm'
import FilterMessages from '../../messages/FilterMessages'
import messages from '../../messages/report'
import pageMessages from './messages'

const FORMAT_LABELS = { xlsx: 'Excel', csv: 'CSV' }

// Output formats offered inside the dialog. When a caller fixes `fileExtension`
// (async generate, where the format was chosen on the status button) we honor it;
// otherwise the user picks the output here, from the formats the report supports.
const availableFormats = (report, fileExtension) => {
  if (fileExtension) return [fileExtension]
  const formats = []
  if (report.exportExcel === 1) formats.push('xlsx')
  if (report.exportCsv === 1) formats.push('csv')
  return formats.length ? formats : ['xlsx']
}

// Pure controlled dialog: no fetching, no FilterProvider access. ReportIndex owns
// prefill (initialValues), persistence and submission.
const ReportFilterDialog = ({ open, report, fileExtension, requestType, initialValues, onClose, onSubmit }) => {
  const { formatMessage } = useIntl()
  const [values, setValues] = useState(initialValues || {})
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    if (open) setValues(initialValues || {})
  }, [open, initialValues])

  if (!report) return null

  // Same localized name resolution as ReportCard.jsx
  const reportName = messages[report.i18nKey] ? formatMessage(messages[report.i18nKey]) : report.name
  const formats = availableFormats(report, fileExtension)
  const isGenerate = requestType === 'generate'
  const ActionIcon = isGenerate ? FiRefreshCw : FaDownload
  const actionMessage = isGenerate ? pageMessages.generateFormat : pageMessages.downloadFormat

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{reportName}</DialogTitle>
      <DialogContent>
        <ReportParameterForm
          parameters={getReportParameters(report)}
          values={values}
          onChange={setValues}
          onValidityChange={setIsValid}
        />
      </DialogContent>
      <DialogActions>
        {!isValid && (
          <Typography variant="caption" color="textSecondary" sx={{ marginRight: 'auto' }}>
            {formatMessage(pageMessages.requiredHint)}
          </Typography>
        )}
        <Button onClick={onClose}>{formatMessage(FilterMessages.cancel)}</Button>
        {formats.map((ext, index) => (
          <Button
            key={ext}
            color="primary"
            variant={index === 0 ? 'contained' : 'outlined'}
            disabled={!isValid}
            onClick={() => onSubmit(values, ext)}
          >
            <ActionIcon style={{ marginRight: 4 }} /> {formatMessage(actionMessage, { format: FORMAT_LABELS[ext] })}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  )
}

ReportFilterDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  report: PropTypes.shape({
    externalId: PropTypes.string,
    name: PropTypes.string,
    i18nKey: PropTypes.string,
    parameters: PropTypes.array,
    exportExcel: PropTypes.number,
    exportCsv: PropTypes.number,
  }),
  // When set, the dialog offers only this format (async generate). Otherwise the
  // user chooses among the formats the report supports.
  fileExtension: PropTypes.oneOf(['xlsx', 'csv']),
  requestType: PropTypes.oneOf(['generate', 'download']),
  initialValues: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

ReportFilterDialog.defaultProps = {
  report: null,
  fileExtension: null,
  requestType: undefined,
  initialValues: null,
}

export default ReportFilterDialog
