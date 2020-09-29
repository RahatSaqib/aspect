import CloudDownloadIcon from '@material-ui/icons/CloudDownload'
import Popover from '@material-ui/core/Popover'
import IconButton from '@material-ui/core/IconButton'
import React, { useState } from 'react'
import classnames from 'classnames/bind'
import LinearProgress from '@material-ui/core/LinearProgress'

const cssClasses = classnames.bind(require('./AspectExportListButton.css'))

export const AspectExportListButton = ({
  onExcelClick,
  onCsvClick,
  visible = false
}) => {
  const [downloadStarted, setDownloadStarted] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)

  const onMyExport = e => {
    e.preventDefault()
    setAnchorEl(null)
    setDownloadStarted(true)

    let onExport = e.currentTarget.id === 'csv' ? onCsvClick(e.currentTarget) : onExcelClick(e.currentTarget)
    
    onExport
      .then(() => setDownloadStarted(false))
      .catch(() => setDownloadStarted(false))
    
    return true
  }

  if (visible) {
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
                onClick={onMyExport}
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
                onClick={onMyExport}
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

  return null
}

export default AspectExportListButton
