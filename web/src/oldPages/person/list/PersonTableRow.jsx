import React from 'react'
import classnames from 'classnames/bind'
import identity from 'lodash/identity'
import isString from 'lodash/isString'
import AccountEnableDisable from '../../../components/Account/AccountEnableDisable'
import styles from '../../../oldComponents/shared/DataTableRow.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'

const cssClasses = classnames.bind(styles)
const enhance = identity

const formatTags = tagsStr => {
  if (!tagsStr) return ''
  let tags = isString(tagsStr) ? tagsStr.split(';') : tagsStr.toJS().map(e => (isString(e) ? e : e.title))
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
const PersonTableRow = ({ person, personEditPermission, ...restProps }) => {
  const rowClickHandler = (evt, onClick) => {
    const tagName = evt.target.tagName.toLowerCase()
    if (['svg', 'button', 'path'].includes(tagName)) {
      evt.preventDefault()
    } else {
      onClick(evt)
    }
  }
  return (
    <TableRow
      {...restProps}
      onClick={evt => rowClickHandler(evt, restProps.onClick)}
      className={cssClasses(restProps.className)}
    >
      <TableCell>{person.get('name')}</TableCell>
      <TableCell>{person.get('level')}</TableCell>
      <TableCell>{person.get('state')}</TableCell>
      <TableCell>{person.get('lga')}</TableCell>
      <TableCell>{formatTags(person.get('tags'))}</TableCell>
      {personEditPermission ? (
        <AccountEnableDisable type="icon" person={person} />
      ) : (
        <TableCell>
          <div style={{ height: '38px' }} />
        </TableCell>
      )}
    </TableRow>
  )
}

export default enhance(PersonTableRow)
