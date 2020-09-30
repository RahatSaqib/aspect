import CloudDownloadIcon from '@material-ui/icons/CloudDownload'
import Popover from '@material-ui/core/Popover'
import IconButton from '@material-ui/core/IconButton'
import React, { useState } from 'react'
import classnames from 'classnames/bind'
import LinearProgress from '@material-ui/core/LinearProgress'
import PropTypes from 'prop-types'

import { downloadFile } from '../../shared/utils/files'

const cssClasses = classnames.bind(require('./AspectExportListButton.css'))

export const AspectExportListButtonWithProps = ({
  onExport,
  visible = false,
  downloadStarted,
  setDownloadStarted,
  anchorEl,
  setAnchorEl,
}) => {
  // >>>>>> Events <<<<<<
  const onReportClicked = e => {
    e.preventDefault()
    setAnchorEl(null)
    setDownloadStarted(true)

    const getExport = onExport(e.currentTarget.id)

    getExport
      .then(async ({ elem, fileFormat, reportName }) => {
        setDownloadStarted(false)
        const file = await elem.blob
        downloadFile(file, reportName, fileFormat)
      })
      .catch(error => {
        setDownloadStarted(false)
        throw error
      })

    return true
  }

  // >>>>>> Components <<<<<<
  if (!visible) return null

  return (
    <div>
      {downloadStarted && <LinearProgress />}
      <IconButton
        variant="contained"
        onClick={event => setAnchorEl(event.currentTarget)}
        className={cssClasses('DownloadButton')}
      >
        <CloudDownloadIcon style={{ fontSize: '1.25rem' }} />
      </IconButton>

      <Popover
        id="simple-popover"
        open={Boolean(anchorEl)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        anchorEl={anchorEl}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={() => setAnchorEl(null)}
      >
        <ol
          style={{
            listStyleType: 'none',
            padding: '5px',
            margin: '5px 30px 5px 30px',
          }}
        >
          <li>
            <button
              type="button"
              className={cssClasses('Reports_Button')}
              inverse
              onClick={onReportClicked}
              id="xlsx"
            >
              Excel
            </button>
          </li>
          <li>
            <button
              type="button"
              className={cssClasses('Reports_Button')}
              inverse
              onClick={onReportClicked}
              id="csv"
            >
              CSV
            </button>
          </li>
        </ol>
      </Popover>
    </div>
  )
}

const AspectExportListButton = ({ onExport, visible }) => {
  const [downloadStarted, setDownloadStarted] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)

  const props = {
    onExport,
    visible,
    downloadStarted,
    setDownloadStarted,
    anchorEl,
    setAnchorEl,
  }

  return <AspectExportListButtonWithProps {...props} />
}

AspectExportListButton.defaultProps = {
  visible: true,
}

AspectExportListButton.propTypes = {
  onExport: PropTypes.func.isRequired,
  visible: PropTypes.bool,
}

export default AspectExportListButton
