import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = identity

const formatTags = tagsStr => {
  if (!tagsStr) return ''
  let tags = tagsStr.split(';')
  if (tags.length > 2) {
    const tagsToShow = tags.slice(0, 2)
    const tagsToHide = tags.slice(2)
    tags = tagsToShow.map(tag => (
      <span key={tag} className={cssClasses('TableCell__tag')}>
        {tag}
      </span>
    ))
    tags.push(
      <span key="..." title={tagsToHide.join(', ')}>
        ...
      </span>
    )
    return tags
  }
  return tags.map((tag, index) => (
    <span key={tag} className={cssClasses('TableCell__tag')}>
      {tag}
      {tags.length > 1 && index < tags.length - 1 ? ',' : ''}
    </span>
  ))
}

const PersonTableRow = ({ person, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{person.get('name')}</TableCell>
    <TableCell>{person.get('level')}</TableCell>
    <TableCell>{person.get('state')}</TableCell>
    <TableCell>{person.get('lga')}</TableCell>
    <TableCell>{formatTags(person.get('tags'))}</TableCell>
  </TableRow>
)

export default enhance(PersonTableRow)
