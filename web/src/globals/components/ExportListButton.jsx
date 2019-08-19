import CloudDownloadIcon from '@material-ui/icons/CloudDownload'
import Popover from '@material-ui/core/Popover'
import IconButton from '@material-ui/core/IconButton'
import React from 'react'
import { compose, withState, withHandlers } from 'recompose'
import classnames from 'classnames/bind'
import LinearProgress from '@material-ui/core/LinearProgress'

const cssClasses = classnames.bind(require('./ExportListButton.css'))

const enhance = compose(
  withState('anchorEl', 'setAnchorEl', null),
  withState('loading', 'setLoading', null),
  withHandlers({
    onPopoverClick: ({ setAnchorEl }) => event => {
      setAnchorEl(event.currentTarget)
    },
    onPopoverClose: ({ setAnchorEl }) => () => {
      setAnchorEl(null)
    },
    onMyExport: prop => e => {
      e.preventDefault()
      prop.setAnchorEl(null)
      prop.setLoading(true)
      if (e.currentTarget.id === 'csv') prop.onCsvClick(e.currentTarget)
      else prop.onExcelClick(e.currentTarget)
      // prop.setLoading(false)
      return true
    },
  })
)

const ExportListButton = ({
  onMyExport,

  // --- injected by recompose ---
  onPopoverClick,
  onPopoverClose,
  anchorEl,
  loading,
}) => (
  <div>
    {loading && <LinearProgress />}
    <IconButton
      variant="contained"
      onClick={onPopoverClick}
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
      onClose={onPopoverClose}
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

export default enhance(ExportListButton)
