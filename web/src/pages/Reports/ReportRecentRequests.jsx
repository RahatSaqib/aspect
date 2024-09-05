import React, { Fragment } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import { parseISO } from 'date-fns'
import { format } from 'date-fns-tz'
import { MdExpandMore } from 'react-icons/md'
import { getAspectDisplayPreferences } from '../../oldComponents/LocalStorage'

const { dateFormat } = getAspectDisplayPreferences().toJS()

const listItemTextWithOrder = [
  { key: 'reportSiteName', label: 'Site Name' },
  { key: 'reportConsumableName', label: 'Consumable Name' },
  { key: 'reportStateName', label: 'State' },
  { key: 'reportCountryName', label: 'Country Name' },
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
  const { reportRequests, reportId } = props
  const count = reportRequests?.length ?? 0
  return (
    <Accordion sx={{ width: '100%', boxShadow: 'none', marginTop: 1 }}>
      <AccordionSummary
        expandIcon={<MdExpandMore />}
        aria-controls={`panel${reportId}-content`}
        id={`panel${reportId}-header`}
      >
        Recent requests ({count})
      </AccordionSummary>
      {count > 0 ? (
        <AccordionDetails>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {reportRequests?.map(request => (
              <Fragment key={request.requestId}>
                <Divider />
                <ListItem
                  sx={{ alignItems: 'flex-start', minWidth: '100%' }}
                  secondaryAction={<Typography>{request.status}</Typography>}
                >
                  <ListItemText
                    primary={buildDateRangeString(request.reportFromDate, request.reportToDate)}
                    secondary={
                      <Box sx={{ flexDirection: 'column' }}>
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
                    }
                  />
                </ListItem>
              </Fragment>
            ))}
          </List>
        </AccordionDetails>
      ) : null}
    </Accordion>
  )
}
