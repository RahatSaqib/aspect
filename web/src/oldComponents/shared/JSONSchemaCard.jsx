import React from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { compose, setPropTypes, pure } from 'recompose'
import { Unit } from '../pureGrids'

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
  <Accordion expanded={initiallyExpanded}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant="subtitle1">{title}</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Typography variant="body2">
        {dataSchema
          .keySeq()
          .map(key => ({
            key,
            label: dataSchema.getIn([key, 'title']) /* Todo: i18n */,
            type: dataSchema.getIn([key, 'type']),
            order: dataSchema.getIn([key, 'order'], 0),
            value: data && data.get(key),
          }))
          .sortBy(({ label }) => label)
          .sortBy(({ order }) => order)
          .map(field => (
            <Unit key={field.key} xs="1-2" sm="1-3">
              {renderField(field)}
            </Unit>
          ))}
      </Typography>
    </AccordionDetails>
  </Accordion>
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

export const JSONSchemaCard = ({ initiallyExpanded, renderField, dataSchema, data }) => (
  <div>
    {dataSchema
      .keySeq()
      .map(key => ({
        key,
        label: dataSchema.getIn([key, 'title']) /* Todo: i18n */,
        type: dataSchema.getIn([key, 'type']),
        order: dataSchema.getIn([key, 'order'], 0),
        value: data.get(key),
      }))
      .sortBy(property => property.order)
      .map(field => {
        if (field.type === 'object' && field.value) {
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
          field.value && (
            <Unit key={field.key} xs="1-2" sm="1-3">
              {renderField(field)}
            </Unit>
          )
        )
      })}
  </div>
)

export default enhance(JSONSchemaCard)
