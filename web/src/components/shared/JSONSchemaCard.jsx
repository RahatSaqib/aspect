import PropTypes from 'prop-types'
// Imports from packages
import React from 'react'
import { compose, setPropTypes, withState, withHandlers, pure } from 'recompose'

// Material-UI
import Paper from 'material-ui/Paper'
import { Card, CardHeader, CardExpandable, CardText } from 'material-ui/Card'

// Our own imports
import { Unit } from '../pureGrids'

export const PropertiesSchemaCard = compose(
  pure,
  setPropTypes({
    initiallyExpanded: PropTypes.bool,
    path: PropTypes.arrayOf(PropTypes.string).isRequired,
    title: PropTypes.string.isRequired,
    formatSubtitle: PropTypes.func.isRequired,
    renderField: PropTypes.func.isRequired,
    dataSchema: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
  }),
  withState('isExpanded', 'setIsExpanded', props => !!props.initiallyExpanded),
  withHandlers({
    handleExpanding: props => event => {
      event.preventDefault()
      event.stopPropagation()
      props.setIsExpanded(!props.isExpanded)
    },
  })
)(props => (
  <Paper>
    <CardHeader
      title={props.title}
      subtitle={!props.isExpanded && props.formatSubtitle(props.data)}
      onTouchTap={props.handleExpanding}
    >
      <CardExpandable
        expanded={props.isExpanded}
        onExpanding={props.handleExpanding}
      />
    </CardHeader>
    {props.isExpanded &&
      <CardText>
        {props.dataSchema
          .keySeq()
          .map(key => ({
            key,
            path: [...props.path, key],
            label: props.dataSchema.getIn([key, 'title']) /* Todo: i18n */,
            type: props.dataSchema.getIn([key, 'type']),
            value: props.data.get(key),
          }))
          .sortBy(({ label }) => label)
          .map(field => (
            <Unit key={field.key} sm="1-2" md="1-3" lg="1-3">
              {props.renderField(field)}
            </Unit>
          ))}
      </CardText>}
  </Paper>
))

const enhance = compose(
  pure,
  setPropTypes({
    initiallyExpanded: PropTypes.bool,
    title: PropTypes.string.isRequired,
    renderField: PropTypes.func.isRequired,
    formatNestedSubtitle: PropTypes.func.isRequired,
    dataSchema: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
  })
)

export const JSONSchemaCard = ({
  initiallyExpanded,
  title,
  renderField,
  formatNestedSubtitle,
  dataSchema,
  data,
}) => (
  <Card initiallyExpanded={initiallyExpanded}>
    <CardHeader title={title} actAsExpander showExpandableButton />
    <CardText actAsExpander expandable>
      {dataSchema
        .keySeq()
        .map(key => ({
          key,
          path: [key],
          label: dataSchema.getIn([key, 'title']) /* Todo: i18n */,
          type: dataSchema.getIn([key, 'type']),
          value: data.get(key),
        }))
        .map(field => {
          if (field.type === 'object') {
            return (
              <PropertiesSchemaCard
                key={field.key}
                path={field.path}
                title={field.label}
                formatSubtitle={formatNestedSubtitle}
                renderField={renderField}
                dataSchema={dataSchema.getIn([field.key, 'properties'])}
                data={field.value}
              />
            )
          }
          return (
            <Unit key={field.key} sm="1-2" md="1-3" lg="1-3">
              {renderField(field)}
            </Unit>
          )
        })}
    </CardText>
  </Card>
)

export default enhance(JSONSchemaCard)
