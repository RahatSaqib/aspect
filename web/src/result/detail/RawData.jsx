import identity from 'lodash/identity'
import React from 'react'
import Accordion from '@material-ui/core/Accordion'
import AccordionDetails from '@material-ui/core/AccordionDetails'
import AccordionSummary from '@material-ui/core/AccordionSummary'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import Typography from '@material-ui/core/Typography'
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
