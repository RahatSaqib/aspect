import CloudDownloadIcon from '@material-ui/icons/CloudDownload'
import Popover from '@material-ui/core/Popover'
import IconButton from '@material-ui/core/IconButton'
import React from 'react'
import { compose, withState, withHandlers } from 'recompose'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./ExportListButton.css'))

export const exportFormatTypes = {
  EXCEL: 'xlsx',
  CSV: 'csv',
}

const enhance = compose(
  withState('anchorEl', 'setAnchorEl', false),
  withHandlers({
    onPopoverClick: ({ setAnchorEl }) => event => {
      setAnchorEl(event.currentTarget)
    },
    onPopoverClose: ({ setAnchorEl }) => () => {
      setAnchorEl(null)
    },
  })
)

const ExportListButton = ({
  onExcelClick,
  onCsvClick,
  // --- injected by recompose ---
  onPopoverClick,
  onPopoverClose,
  anchorEl,
}) => (
  <div>
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
      className={cssClasses('Popover')}
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
            onClick={onExcelClick}
            id="xlsx"
          >
            Excel
          </button>
        </li>
        <button
          className={cssClasses('Reports_Button')}
          inverse
          onClick={onCsvClick}
          id="csv"
        >
          CSV
        </button>
      </ol>
    </Popover>
  </div>
)

export default enhance(ExportListButton)
