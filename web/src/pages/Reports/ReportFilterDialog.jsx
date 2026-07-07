import React, { useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import PropTypes from 'prop-types'
import { FaDownload } from 'react-icons/fa'
import { FiRefreshCw } from 'react-icons/fi'
import { useIntl } from 'react-intl'
import ReportParameterForm, { getReportParameters } from '../../components/ReportParameterForm'
import FilterMessages from '../../messages/FilterMessages'
import messages from '../../messages/report'

// Pure controlled dialog: no fetching, no FilterProvider access. ReportIndex owns
// prefill (initialValues), persistence and submission.
const ReportFilterDialog = ({ open, report, fileExtension, requestType, initialValues, onClose, onSubmit }) => {
  const { formatMessage } = useIntl()
  const [values, setValues] = useState(initialValues || {})

  useEffect(() => {
    if (open) setValues(initialValues || {})
  }, [open, initialValues])

  if (!report) return null

  // Same localized name resolution as ReportCard.jsx
  const reportName = messages[report.i18nKey] ? formatMessage(messages[report.i18nKey]) : report.name
  const fileLabel = fileExtension === 'xlsx' ? 'Excel' : 'CSV'

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{reportName}</DialogTitle>
      <DialogContent>
        <ReportParameterForm parameters={getReportParameters(report)} values={values} onChange={setValues} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{formatMessage(FilterMessages.cancel)}</Button>
        <Button color="primary" variant="contained" onClick={() => onSubmit(values)}>
          {requestType === 'generate' ? (
            <>
              <FiRefreshCw style={{ marginRight: 4 }} /> Generate {fileLabel}
            </>
          ) : (
            <>
              <FaDownload style={{ marginRight: 4 }} /> Download {fileLabel}
            </>
          )}
        </Button>
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
  }),
  fileExtension: PropTypes.oneOf(['xlsx', 'csv']),
  requestType: PropTypes.oneOf(['generate', 'download']),
  initialValues: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

ReportFilterDialog.defaultProps = {
  report: null,
  fileExtension: 'xlsx',
  requestType: undefined,
  initialValues: null,
}

export default ReportFilterDialog
