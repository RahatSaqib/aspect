import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import Popover from '@mui/material/Popover'
import IconButton from '@mui/material/IconButton'
import React from 'react'
import { compose, withState, withHandlers } from 'recompose'
import { connect } from 'react-redux'
import classnames from 'classnames/bind'
import LinearProgress from '@mui/material/LinearProgress'
import { onStartDownloading } from '../store/GlobalsRedux'

import styles from './ExportListButton.css'

const cssClasses = classnames.bind(styles)

const mapStateToProps = state => ({ downloadStarted: state.getIn(['globals', 'downloadStarted']) })
const mapDispatchToProps = dispatch => ({ startDownloading: () => dispatch(onStartDownloading()) })

const enhance = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('anchorEl', 'setAnchorEl', null),
  withHandlers({
    onPopoverClick:
      ({ setAnchorEl }) =>
      event => {
        setAnchorEl(event.currentTarget)
      },
    onPopoverClose:
      ({ setAnchorEl }) =>
      () => {
        setAnchorEl(null)
      },
    onMyExport:
      ({ setAnchorEl, onExcelClick, onCsvClick, startDownloading }) =>
      e => {
        e.preventDefault()
        setAnchorEl(null)
        startDownloading()
        if (e.currentTarget.id === 'csv') onCsvClick(e.currentTarget)
        else onExcelClick(e.currentTarget)

        return true
      },
  })
)

export const ExportListButton = ({
  onMyExport,
  visible = false,

  // --- injected by recompose ---
  onPopoverClick,
  onPopoverClose,
  anchorEl,
  downloadStarted,
}) =>
  visible ? (
    <div>
      {downloadStarted && <LinearProgress />}
      <IconButton variant="contained" onClick={onPopoverClick} className={cssClasses('DownloadButton')}>
        <CloudDownloadIcon style={{ fontSize: '1.25rem' }} />
      </IconButton>

      <Popover
        id="simple-popover"
        open={Boolean(anchorEl)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        anchorEl={anchorEl}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClose={onPopoverClose}
      >
        <ol style={{ listStyleType: 'none', padding: '5px', margin: '5px 30px 5px 30px' }}>
          <li>
            <button type="button" className={cssClasses('Reports_Button')} onClick={onMyExport} id="xlsx">
              Excel
            </button>
          </li>
          <li>
            <button type="button" className={cssClasses('Reports_Button')} onClick={onMyExport} id="csv">
              CSV
            </button>
          </li>
        </ol>
      </Popover>
    </div>
  ) : null

export default enhance(ExportListButton)
