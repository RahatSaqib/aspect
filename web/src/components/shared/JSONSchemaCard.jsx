import PropTypes from 'prop-types'
// Imports from packages
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'

// Our own imports
import { Unit } from '../pureGrids'
import {
  ExpansionPanel,
  ExpansionPanelHeader,
  ExpansionPanelDetail,
} from './expansionPanel'

export const PropertiesSchemaCard = compose(
  pure,
  setPropTypes({
    initiallyExpanded: PropTypes.bool,
    title: PropTypes.string.isRequired,
    renderField: PropTypes.func.isRequired,
    dataSchema: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
  })
)(({ initiallyExpanded, title, renderField, dataSchema, data }) => (
  <ExpansionPanel expanded={initiallyExpanded}>
    <ExpansionPanelHeader label={title} />
    <ExpansionPanelDetail>
      {dataSchema
        .keySeq()
        .map(key => ({
          key,
          label: dataSchema.getIn([key, 'title']) /* Todo: i18n */,
          type: dataSchema.getIn([key, 'type']),
          value: data.get(key),
        }))
        .sortBy(({ label }) => label)
        .map(field => (
          <Unit key={field.key} xs="1-2" sm="1-3">
            {renderField(field)}
          </Unit>
        ))}
    </ExpansionPanelDetail>
  </ExpansionPanel>
))

const enhance = compose(
  pure,
  setPropTypes({
    initiallyExpanded: PropTypes.bool,
    renderField: PropTypes.func.isRequired,
    dataSchema: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
  })
)

export const JSONSchemaCard = ({
  initiallyExpanded,
  renderField,
  dataSchema,
  data,
}) => (
  <div>
    {dataSchema
      .keySeq()
      .map(key => ({
        key,
        label: dataSchema.getIn([key, 'title']) /* Todo: i18n */,
        type: dataSchema.getIn([key, 'type']),
        value: data.get(key),
      }))
      .map(field => {
        if (field.type === 'object') {
          return (
            <PropertiesSchemaCard
              key={field.key}
              initiallyExpanded={initiallyExpanded}
              title={field.label}
              renderField={renderField}
              dataSchema={dataSchema.getIn([field.key, 'properties'])}
              data={field.value}
            />
          )
        }
        return (
          <Unit key={field.key} xs="1-2" sm="1-3">
            {renderField(field)}
          </Unit>
        )
      })}
  </div>
)

export default enhance(JSONSchemaCard)
