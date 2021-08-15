import React from 'react'
import classnames from 'classnames/bind'

import MenuItem from '@material-ui/core/MenuItem'

import IconProvider from '../IconProvider'
import messages from './messages'
import styles from './Placeholders.css'

const cssClasses = classnames.bind(styles)

export const groupedOptions = ({ formatMessage }) => [
  {
    label: formatMessage(messages.placeholderSite),
    options: [
      {
        id: 'site.id',
        name: formatMessage(messages.placeholderId),
      },
      {
        id: 'site.name',
        name: formatMessage(messages.placeholderName),
      },
      {
        id: 'site.shortName',
        name: formatMessage(messages.placeholderNameShort),
      },
    ],
  },
  {
    label: formatMessage(messages.placeholderDevice),
    options: [
      {
        id: 'device.name',
        name: formatMessage(messages.placeholderName),
      },
    ],
  },
  {
    label: formatMessage(messages.placeholderResult),
    options: [
      {
        id: 'result.data.resultText',
        name: formatMessage(messages.placeholderResultText),
      },
      {
        id: 'result.patient.id',
        name: formatMessage(messages.placeholderResultPatientId),
      },
      {
        id: 'result.startedOn',
        name: formatMessage(messages.placeholderResultStartedOn),
      },
      {
        id: 'result.endedOn',
        name: formatMessage(messages.placeholderResultEndedOn),
      },
      {
        id: 'result.notes',
        name: formatMessage(messages.placeholderResultNotes),
      },
      {
        id: 'result.moduleName',
        name: formatMessage(messages.placeholderResultModuleName),
      },
      {
        id: 'result.moduleSerial',
        name: formatMessage(messages.placeholderResultModuleSerial),
      },
      {
        id: 'result.errorCode',
        name: formatMessage(messages.placeholderResultErrorCode),
      },
      {
        id: 'result.assay.id',
        name: formatMessage(messages.placeholderResultAssay),
      },
      {
        id: 'result.sample.id',
        name: formatMessage(messages.placeholderResultSampleId),
      },
      {
        id: 'result.sample.originSite.id',
        name: formatMessage(messages.placeholderResultSampleOriginSite),
      },
      {
        id: 'result.sample.collectedOn',
        name: formatMessage(messages.placeholderResultSampleCollectedDate),
      },

      {
        id: 'result.category1.id',
        name: formatMessage(messages.placeholderResult1),
      },
      {
        id: 'result.category2.id',
        name: formatMessage(messages.placeholderResult2),
      },
    ],
  },
]

export const getMenuItems = ({ formatMessage }, onSelect) => {
  return [
    <div key="placeholders-header" className={cssClasses('menu-header')}>
      {formatMessage(messages.placeholdersInsertPlaceholderFor)}
    </div>,
    groupedOptions({ formatMessage }).map(({ label, options }) => (
      <div key={label}>
        <MenuItem
          classes={{ root: cssClasses('menu-section-header') }}
          dense
          disabled
        >
          {label}
        </MenuItem>
        {options.map(({ id, name }) => {
          const title = `Insert placeholder {{${id}}}`
          return (
            <MenuItem
              key={`${label}-${id}`}
              classes={{
                root: cssClasses('menu-item'),
              }}
              dense
              onClick={() => onSelect(id)}
              title={title}
            >
              <IconProvider
                icon="BsBraces"
                title={title}
                className={cssClasses('menu-item-icon')}
              />
              {name}
            </MenuItem>
          )
        })}
      </div>
    )),
  ]
}

export default groupedOptions
