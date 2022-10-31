import React from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import { ReadOnlyField } from '../../../oldComponents/shared/ReadOnlyFields'

const RawData = ({ createdOn, index, formatMessage, createdOnLabel, rawMessage }) => (
  <div style={{ paddingTop: '10px' }}>
    <Accordion defaultExpanded={index === 0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1" component="div">
          <ReadOnlyField
            label={formatMessage(createdOnLabel, {
              date: createdOn.toUTCString(),
            })}
            value=" "
          />
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" component="div">
          <ReadOnlyField label="" value={<pre>{JSON.stringify(rawMessage, null, 1)}</pre>} />
        </Typography>
      </AccordionDetails>
    </Accordion>
  </div>
)

export default RawData
