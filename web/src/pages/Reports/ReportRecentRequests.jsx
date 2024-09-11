import React, { Fragment } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  Skeleton,
  Typography,
} from '@mui/material'
import { parseISO } from 'date-fns'
import { format } from 'date-fns-tz'
import { MdExpandMore } from 'react-icons/md'
import { getAspectDisplayPreferences } from '../../oldComponents/LocalStorage'

const { dateFormat } = getAspectDisplayPreferences().toJS()

const listItemTextWithOrder = [
  { key: 'reportSiteName', label: 'Site' },
  { key: 'reportConsumableName', label: 'Consumable' },
  { key: 'reportStateName', label: 'State' },
  { key: 'reportCountryName', label: 'Country' },
  { key: 'reportFormat', label: 'Format' },
]

function buildDateRangeString(reportFromDate, reportToDate) {
  if (reportFromDate && reportToDate) {
    return `${format(parseISO(reportFromDate), dateFormat)} - ${format(parseISO(reportToDate), dateFormat)}`
  }
  if (reportFromDate) {
    return `From ${format(parseISO(reportFromDate), dateFormat)}`
  }
  if (reportToDate) {
    return `To ${format(parseISO(reportToDate), dateFormat)}`
  }
  return 'No date range'
}

export function ReportRecentRequests(props) {
  const { reportRequests, report, reportId, isLoading } = props
  const count = reportRequests?.length ?? 0
  const [open, setOpen] = React.useState(false)

  const handleClick = () => {
    setOpen(!open)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const actionDisabled = isLoading || count === 0

  return (
    <Box sx={{ width: '100%', boxShadow: 'none', marginTop: 2, paddingX: 1 }}>
      <Divider />
      <Button
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          width: '100%',
        }}
        disabled={actionDisabled}
        onClick={handleClick}
      >
        {isLoading ? <Skeleton width={200} /> : <>Recent requests ({count})</>}
        {count > 0 && <MdExpandMore />}
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{report.name}</DialogTitle>
        <Divider />
        <DialogContent>
          <List sx={{ width: '100%' }}>
            {reportRequests?.map((request, index) => (
              <ListItem
                sx={{ alignItems: 'flex-start', minWidth: '100%', padding: 2 }}
                key={request.requestId}
                divider={count - 1 !== index}
              >
                <Box as="span" sx={{ width: '100%', display: 'flex', gap: 4, justifyContent: 'space-between' }}>
                  <Box as="span">
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {buildDateRangeString(request.reportFromDate, request.reportToDate)}
                    </Typography>
                    {listItemTextWithOrder.map(({ key, label }) => (
                      <Fragment key={key}>
                        {request[key] ? (
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{ color: 'text.primary', display: 'block', fontSize: 12 }}
                          >
                            {label} - {request[key]}
                          </Typography>
                        ) : null}
                      </Fragment>
                    ))}
                  </Box>
                  <Typography
                    variant="link"
                    sx={{
                      color: 'primary.main',
                      fontSize: 12,
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {request.status}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
