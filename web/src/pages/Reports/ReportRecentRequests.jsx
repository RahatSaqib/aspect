import React from 'react'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import { MdExpandMore } from 'react-icons/md'

export function ReportRecentRequests() {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<MdExpandMore />} aria-controls="panel1-content" id="panel1-header">
        Accordion 1
      </AccordionSummary>
      <AccordionDetails>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex, sit amet blandit leo
        lobortis eget.
      </AccordionDetails>
    </Accordion>
  )
}
