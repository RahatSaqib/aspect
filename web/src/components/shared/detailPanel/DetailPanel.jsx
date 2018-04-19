import React from 'react'
import _ from 'lodash'
import classnames from 'classnames/bind'
import { Card } from 'react-toolbox/lib/card'
import MdAssignment from 'react-icons/lib/md/assignment'
import CardTitle from '../../../components/shared/CardTitle'
import ReadOnlyFields from '../../../components/shared/ReadOnlyFields'
import {
  ExpansionPanel,
  ExpansionPanelHeader,
  ExpansionPanelDetail,
} from '../../../components/shared/expansionPanel'

const cssClasses = classnames.bind(require('./DetailPanel.css'))

const enhance = _.identity

const format = (type, intl) =>
  type === 'number'
    ? intl.formatNumber
    : type === 'date'
      ? intl.formatDate
      : type === 'time'
        ? v => `${intl.formatDate(v)} ${intl.formatTime(v)}`
        : null

const makeLink = (template, data) => {
  try {
    return _.template(template)(data.toJSON())
  } catch (err) {
    return ''
  }
}

const DetailGroup = ({ intl, key, data, rawData, groupSchema }) => (
  <ExpansionPanel expanded={false} key={key}>
    <ExpansionPanelHeader
      label={groupSchema.getIn(['summary', 'title'])}
      expandedLabel={groupSchema.getIn(['detail', 'title'])}
      collapsedChildren={
        <ReadOnlyFields
          className={cssClasses('Field__Container')}
          hideLabel
          fields={groupSchema
            .getIn(['summary', 'rows'])
            .entrySeq()
            .map(([key, value]) => ({
              key,
              label: value.get('title'),
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
          .getIn(['detail', 'rows'])
          .filter(it => it.get('row') === 0)
          .entrySeq()
          .map(([key, value]) => ({
            key,
            label: value.get('title'),
            value: (data && data.get(key)) || rawData.get(key) || '',
            format: format(value.get('type'), intl),
            to: value.get('link') && makeLink(value.get('link'), rawData),
          }))
          .toJSON()}
      />
    </ExpansionPanelHeader>
    {groupSchema.getIn(['detail', 'rows']).filter(it => it.get('row') > 0)
      .size > 0 && (
      <ExpansionPanelDetail>
        {groupSchema
          .getIn(['detail', 'rows'])
          .filter(it => it.get('row') > 0)
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
)

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
