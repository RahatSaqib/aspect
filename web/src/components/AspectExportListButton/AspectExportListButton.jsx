import React, { useState } from 'react'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import { Button, LinearProgress, Menu, MenuItem } from '@mui/material'
import PropTypes from 'prop-types'
import { downloadFile } from '../../utils/utils/files'
import styles from './styles.module.css'

const AspectExportListButton = ({ onExport, visible, disableCSV, disableExcel }) => {
  const [downloadStarted, setDownloadStarted] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)

  const onExportTo = format => event => {
    event.preventDefault()
    setAnchorEl(null)
    setDownloadStarted(true)

    const getExport = onExport(format)

    getExport
      ?.then(async ({ elem, fileFormat, reportName }) => {
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
    <div className={styles.export_button_wrapper}>
      {downloadStarted && <LinearProgress />}
      <Button
        variant="outlined"
        onClick={event => setAnchorEl(event.currentTarget)}
        className={styles.export_icon_button}
      >
        <CloudDownloadIcon style={{ fontSize: '1.25rem' }} />
      </Button>

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
        classes={{ root: styles.export_menu_root }}
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
