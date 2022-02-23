import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import { defineMessages } from 'react-intl'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import { PersonAdd, PersonRemove } from '@material-ui/icons'
import { i18nWrapper } from '../../Providers/I18nProvider/index'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import styles from '../../components/shared/DataTableRow.css'
import { formatDate } from '../../shared/utils/dateFormat'

const cssClasses = classnames.bind(styles)

const enhance = identity

const { formatMessage } = i18nWrapper()
const messages = {
  ...defineMessages({
    disabledOn: {
      id: 'pages.PersonList.disabled.title',
      defaultMessage: 'This person was disabled on',
    },
  }),
}

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
const PersonTableRow = ({
  person,
  personEditPermission,
  onClickEnableDisable,
  ...restProps
}) => {
  const rowClickHandler = (evt, onClick) => {
    const tagName = evt.target.tagName.toLowerCase()
    if (
      (tagName === 'td' && evt.target.classList.contains('ActionsContainer')) ||
      tagName === 'path' ||
      tagName === 'svg' ||
      tagName === 'button'
    )
      evt.preventDefault()
    else {
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
      {personEditPermission && (
        <TableCell className="ActionsContainer" onClick={onClickEnableDisable}>
          {person.get('disabled') === 1 ? (
            <Tooltip
              title={`${formatMessage(messages.disabledOn)} ${formatDate(
                person.get('disabledAt')
              )}`}
            >
              <IconButton
                variant="contained"
                className={cssClasses('DisableButton')}
              >
                <PersonAdd style={{ fontSize: '1.25rem' }} />
              </IconButton>
            </Tooltip>
          ) : (
            <IconButton
              variant="contained"
              className={cssClasses('EnableButton')}
            >
              <PersonRemove style={{ fontSize: '1.25rem' }} />
            </IconButton>
          )}
        </TableCell>
      )}
    </TableRow>
  )
}

export default enhance(PersonTableRow)
