import _ from 'lodash'
import React from 'react'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import Typography from '@material-ui/core/Typography'
import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'

const enhance = _.identity

const RawData = ({
  createdOn,
  index,
  formatMessage,
  createdOnLabel,
  rawMessage,
}) => (
  <div style={{ paddingTop: '10px' }}>
    <ExpansionPanel defaultExpanded={index === 0}>
      <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1" component="div">
          <ReadOnlyField
            label={formatMessage(createdOnLabel, {
              date: createdOn.toUTCString(),
            })}
            value=" "
          />
        </Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <Typography variant="body2" component="div">
          <ReadOnlyField
            label=""
            value={<pre>{JSON.stringify(rawMessage, null, 1)}</pre>}
          />
        </Typography>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  </div>
)

export default enhance(RawData)
