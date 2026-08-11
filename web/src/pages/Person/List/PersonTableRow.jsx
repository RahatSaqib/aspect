import React from 'react'
import isString from 'lodash/isString'
import styles from '../../../components/shared/DataTableRow.module.css'
import { DataTableCell as TableCell, DataTableRow as TableRow } from '../../../components/shared/tableBody'
import { formatDateTime } from '../../../utils/utils/dateFormat'
import AccountEnableDisable from './AccountEnableDisable'

const formatTags = tagsStr => {
  if (!tagsStr) return ''
  let tags = isString(tagsStr) ? tagsStr.split(';') : tagsStr.map(e => (isString(e) ? e : e.title))
  if (tags.length > 2) {
    const tagsToShow = tags.slice(0, 2)
    const tagsToHide = tags.slice(2)
    tags = tagsToShow.map(tag => (
      <span key={tag} className={styles.TableCell__tag}>
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
    <span key={tag} className={styles.TableCell__tag}>
      {tag}
      {tags.length > 1 && index < tags.length - 1 ? ',' : ''}
    </span>
  ))
}
const PersonTableRow = ({ person, personEditPermission, onUpdateRecord, ...restProps }) => {
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
      className={styles[restProps.className]}
    >
      <TableCell>{person.name}</TableCell>
      <TableCell>{person.assignments}</TableCell>
      <TableCell>{person.state}</TableCell>
      <TableCell>{person.lga}</TableCell>
      <TableCell>{formatTags(person.tags)}</TableCell>
      <TableCell>{person.email}</TableCell>
      <TableCell>{person.cell}</TableCell>
      <TableCell>{person.phone}</TableCell>
      <TableCell>{formatDateTime(person.lastLogin)}</TableCell>
      {personEditPermission ? (
        <AccountEnableDisable type="icon" person={person} onSuccess={onUpdateRecord} />
      ) : (
        <TableCell>
          <div style={{ height: '38px' }} />
        </TableCell>
      )}
    </TableRow>
  )
}

export default PersonTableRow
