import React from 'react'
import _ from 'lodash'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import { compose, mapProps } from 'recompose'
import { Card } from 'react-toolbox/lib/card'
import MdAssignment from 'react-icons/lib/md/assignment'
import { formatDate, formatTime } from '../../../shared/utils/dateFormat'
import CardTitle from '../../../components/shared/CardTitle'
import ReadOnlyFields from '../../../components/shared/ReadOnlyFields'
import {
  ExpansionPanel,
  ExpansionPanelHeader,
  ExpansionPanelDetail,
} from '../../../components/shared/expansionPanel'

const cssClasses = classnames.bind(require('./DetailPanel.css'))

const EMPTY_MAP = Immutable.Map()

const enhance = _.identity

const format = (type, intl) =>
  type === 'number'
    ? intl.formatNumber
    : type === 'date'
      ? intl.formatDate
      : type === 'time' ? v => `${formatDate(v)} ${formatTime(v)}` : null

const makeLink = (template, data) => {
  try {
    return _.template(template)(data.toJSON())
  } catch (err) {
    return ''
  }
}

export const DetailGroup = compose(
  mapProps(({ data, rawData, groupSchema, ...restProps }) => {
    const dataSchemaPath = groupSchema.getIn(['detail', 'dataSchema'])
    if (dataSchemaPath) {
      const dataSchema =
        rawData.getIn(_.split(dataSchemaPath, '.')) || EMPTY_MAP
      const defaultRow = groupSchema.hasIn(['detail', 'rows']) ? 1 : 0
      const schema = dataSchema
        .filter(value => value && value.get('type') !== 'object')
        .sortBy(value => value.get('order'))
        .map(row =>
          row
            .set('row', defaultRow + (Math.floor(row.get('order') / 3) || 0))
            .set('order', row.get('order') || 0)
        )
      groupSchema = groupSchema.mergeDeepIn(['detail', 'rows'], schema)
    }
    return {
      data,
      rawData,
      groupSchema,
      ...restProps,
    }
  })
)(({ intl, key, data, rawData, groupSchema }) => (
  <ExpansionPanel expanded={false} key={key}>
    <ExpansionPanelHeader
      label={groupSchema.getIn(['summary', 'title'])}
      expandedLabel={groupSchema.getIn(['detail', 'title'])}
      collapsedChildren={
        <ReadOnlyFields
          className={cssClasses('Field__Container')}
          hideLabel
          fields={groupSchema
            .getIn(['summary', 'rows'], EMPTY_MAP)
            .sortBy(value => value.get('order'))
            .entrySeq()
            .map(([key, value]) => ({
              key,
              label: value.get('titleAssayDefinition')
                ? rawData.getIn(['assay', value.get('titleAssayDefinition')])
                : value.get('title'),
              value: (data && data.get(key)) || rawData.get(key) || '',
              format: format(value.get('type'), intl),
              to: value.get('link') && makeLink(value.get('link'), rawData),
            }))
            .toJSON()}
        />
      }
    >
      <ReadOnlyFields
        className={cssClasses('Field__Container')}
        fields={groupSchema
          .getIn(['detail', 'rows'], EMPTY_MAP)
          .filter(it => it.get('row') === 0)
          .sortBy(value => value.get('order'))
          .entrySeq()
          .map(([key, value]) => ({
            key,
            label: value.get('titleAssayDefinition')
              ? rawData.getIn(['assay', value.get('titleAssayDefinition')])
              : value.get('title'),
            value: (data && data.get(key)) || rawData.get(key) || '',
            format: format(value.get('type'), intl),
            to: value.get('link') && makeLink(value.get('link'), rawData),
          }))
          .toJSON()}
      />
    </ExpansionPanelHeader>
    {groupSchema
      .getIn(['detail', 'rows'], EMPTY_MAP)
      .filter(it => it.get('row') > 0).size > 0 && (
      <ExpansionPanelDetail>
        {groupSchema
          .getIn(['detail', 'rows'], EMPTY_MAP)
          .filter(it => it.get('row') > 0)
          .sortBy(value => value.get('order'))
          .groupBy(x => x.get('row'))
          .valueSeq()
          .map(row =>
            row.entrySeq().map(([key, value]) => ({
              key,
              label: value.get('title'),
              value: (data && data.get(key)) || rawData.get(key) || '',
              format: format(value.get('type'), intl),
              to: value.get('link') && makeLink(value.get('link'), rawData),
            }))
          )
          .map(fields => (
            <ReadOnlyFields
              className={cssClasses('Field__Container')}
              fields={fields}
            />
          ))
          .toJSON()}
      </ExpansionPanelDetail>
    )}
  </ExpansionPanel>
))

export const DetailPanel = ({ intl, data, schema, ...restProps }) => (
  <Card {...restProps}>
    <CardTitle
      title={schema.get('title')}
      icon={<MdAssignment className={cssClasses('Title__Icon')} />}
      className={cssClasses('Title')}
    />
    {schema
      .get('groups')
      .sortBy(value => value.get('order'))
      .entrySeq()
      .map(([key, groupSchema]) => (
        <DetailGroup
          intl={intl}
          key={key}
          groupSchema={groupSchema}
          rawData={data}
          data={data.get(key)}
        />
      ))}
    {restProps.children}
  </Card>
)

export default enhance(DetailPanel)
