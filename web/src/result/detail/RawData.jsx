import identity from 'lodash/identity'
import React from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Typography from '@mui/material/Typography'
import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'

const enhance = identity

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

export default enhance(RawData)
