import CloudDownloadIcon from '@material-ui/icons/CloudDownload'
import IconButton from '@material-ui/core/IconButton'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import React, { useState } from 'react'
import classnames from 'classnames/bind'
import LinearProgress from '@material-ui/core/LinearProgress'
import PropTypes from 'prop-types'

import { downloadFile } from '../../shared/utils/files'

import styles from './AspectExportListButton.css'

const cssClasses = classnames.bind(styles)

export const AspectExportListButtonWithProps = ({
  onExport,
  visible = false,
  downloadStarted,
  setDownloadStarted,
  anchorEl,
  setAnchorEl,
  disableCSV,
  disableExcel,
}) => {
  const onExportTo = format => event => {
    event.preventDefault()
    setAnchorEl(null)
    setDownloadStarted(true)

    const getExport = onExport(format)

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
  }

  if (!visible) return null

  return (
    <div className={cssClasses('export-button-wrapper')}>
      {downloadStarted && <LinearProgress />}
      <IconButton
        variant="contained"
        onClick={event => setAnchorEl(event.currentTarget)}
        className={cssClasses('export-icon-button')}
      >
        <CloudDownloadIcon style={{ fontSize: '1.25rem' }} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        classes={{
          root: cssClasses('export-menu-root'),
        }}
      >
        <MenuItem disabled={disableExcel} onClick={onExportTo('xlsx')}>
          Excel
        </MenuItem>
        <MenuItem disabled={disableCSV} onClick={onExportTo('csv')}>
          CSV
        </MenuItem>
      </Menu>
    </div>
  )
}

const AspectExportListButton = ({ onExport, visible, disableCSV, disableExcel }) => {
  const [downloadStarted, setDownloadStarted] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)

  const props = {
    onExport,
    visible,
    downloadStarted,
    setDownloadStarted,
    anchorEl,
    setAnchorEl,
    disableCSV,
    disableExcel,
  }

  return <AspectExportListButtonWithProps {...props} />
}

AspectExportListButton.defaultProps = {
  visible: true,
  disableCSV: false,
  disableExcel: false,
}

AspectExportListButton.propTypes = {
  onExport: PropTypes.func.isRequired,
  visible: PropTypes.bool,
  disableCSV: PropTypes.bool,
  disableExcel: PropTypes.bool,
}

export default AspectExportListButton
