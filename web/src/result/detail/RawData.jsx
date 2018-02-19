import _ from 'lodash'
import React from 'react'
import { Card, CardHeader, CardText } from 'material-ui/Card'
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
    <Card initiallyExpanded={index === 0}>
      <CardHeader actAsExpander showExpandableButton>
        <ReadOnlyField
          label={formatMessage(createdOnLabel, {
            date: createdOn.toUTCString(),
          })}
          value=" "
        />
      </CardHeader>
      <CardText actAsExpander expandable>
        <ReadOnlyField
          label=""
          value={<pre>{JSON.stringify(rawMessage, null, 1)}</pre>}
        />
      </CardText>
    </Card>
  </div>
)

export default enhance(RawData)
