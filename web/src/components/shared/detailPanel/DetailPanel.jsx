import React from 'react'
import identity from 'lodash/identity'
import split from 'lodash/split'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import { compose, mapProps } from 'recompose'
import Card from '@mui/material/Card'
import { MdAssignment } from 'react-icons/md'
import { formatDate, formatDateTime } from '../../../shared/utils/dateFormat'
import CardTitle from '../CardTitle'
import ReadOnlyFields from '../ReadOnlyFields'
import { Accordion, AccordionHeader, AccordionDetail } from '../accordion'

import styles from './DetailPanel.css'

const cssClasses = classnames.bind(styles)

const EMPTY_MAP = Immutable.Map()

const enhance = identity

const format = (type, intl) =>
  type === 'number' ? intl.formatNumber : type === 'date' ? formatDate : type === 'time' ? formatDateTime : null

const makeLink = (template, data) => {
  try {
    return template(template)(data.toJSON())
  } catch (err) {
    return ''
  }
}

const conditionsMet = (schema, data) => {
  const condition = schema.get('condition')
  if (condition) {
    const criteria = condition.get('criteria')
    const value = condition.get('value')
    return criteria && value && data.getIn(criteria.split('.')) === value
  }
  return true
}

export const DetailGroup = compose(
  mapProps(({ data, rawData, groupSchema, ...restProps }) => {
    const dataSchemaPath = groupSchema.getIn(['detail', 'dataSchema'])
    if (dataSchemaPath) {
      const dataSchema = rawData.getIn(split(dataSchemaPath, '.')) || EMPTY_MAP
      const defaultRow = groupSchema.hasIn(['detail', 'rows']) ? 1 : 0
      const schema = dataSchema
        .filter(value => value && value.get('type') !== 'object')
        .sortBy(value => value.get('order'))
        .map(row =>
          row.set('row', defaultRow + (Math.floor(row.get('order') / 3) || 0)).set('order', row.get('order') || 0)
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
  <Accordion expanded={false} key={key}>
    <AccordionHeader
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
              linkButton: value.get('linkButton') && {
                text: value.get('linkButton').toJS().text,
                to: makeLink(value.get('linkButton').toJS().to, rawData),
              },
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
          .filter(it => conditionsMet(it, rawData))
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
            linkButton: value.get('linkButton') && {
              text: value.get('linkButton').toJS().text,
              to: makeLink(value.get('linkButton').toJS().to, rawData),
            },
          }))
          .toJSON()}
      />
    </AccordionHeader>
    {groupSchema.getIn(['detail', 'rows'], EMPTY_MAP).filter(it => it.get('row') > 0).size > 0 && (
      <AccordionDetail>
        {groupSchema
          .getIn(['detail', 'rows'], EMPTY_MAP)
          .filter(it => it.get('row') > 0)
          .filter(it => conditionsMet(it, rawData))
          .delete('id')
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
              linkButton: value.get('linkButton') && {
                text: value.get('linkButton').toJS().text,
                to: makeLink(value.get('linkButton').toJS().to, rawData),
              },
            }))
          )
          .map(fields => <ReadOnlyFields className={cssClasses('Field__Container')} fields={fields} />)
          .toJSON()}
      </AccordionDetail>
    )}
  </Accordion>
))
export const DetailPanel = ({ intl, data, schema, renderRightTitle, titleSection, ...restProps }) => (
  <Card {...restProps}>
    <CardTitle
      title={schema.get('title')}
      icon={<MdAssignment className={cssClasses('Title__Icon')} />}
      className={cssClasses('Title')}
      renderRight={renderRightTitle}
    />

    {titleSection}

    {schema
      .get('groups')
      .sortBy(value => value.get('order'))
      .entrySeq()
      .map(([key, groupSchema]) => (
        <DetailGroup intl={intl} key={key} groupSchema={groupSchema} rawData={data} data={data.get(key)} />
      ))}
    {restProps.children}
  </Card>
)

export default enhance(DetailPanel)
