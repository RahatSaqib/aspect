import identity from 'lodash/identity'
import isUndefined from 'lodash/isUndefined'
import classnames from 'classnames/bind'
import React, { useEffect, useState } from 'react'
import { defineMessages, useIntl } from 'react-intl'
import Button from '@material-ui/core/Button'

import AspectDialog from '../../../../components/shared/AspectDialog'
import formConfig from './formConfig'
import { FormikContext, FormikProvider } from '../../../Form/Formik/Context'
import AspectForm from '../../../Form'

const cssClasses = classnames.bind(require('./DailyStatusDialog.css'))

export const sharedMessages = defineMessages({
  notes: {
    id: 'pages.BaseDialog.notes',
    defaultMessage: 'Notes',
  },
})

export const SHARED_DEFAULT_VALUES = {
  contextDate: undefined,
  notes: '',
}

export const sharedFields = {
  contextDate: {
    fieldName: 'contextDate',
    valueFromChangeEvent: identity,
  },
  notes: {
    fieldName: 'notes',
    valueFromChangeEvent: it => it.target.value,
  },
}

export const messages = defineMessages({
  title: {
    id: 'pages.DailyStatusDialog.title',
    defaultMessage: 'Set Maintenance Status',
  },
  deviceLabel: {
    id: 'pages.DailyStatusDialog.deviceLabel',
    defaultMessage: 'Device',
  },
  dateRange: {
    id: 'pages.DailyStatusDialog.dateRange',
    defaultMessage: 'Date Range',
  },
  reason: {
    id: 'pages.DailyStatusDialog.reason',
    defaultMessage: 'Reason',
  },
  selectReason: {
    id: 'pages.DailyStatusDialog.selectReason',
    defaultMessage: 'Select Reason',
  },
  note: {
    id: 'pages.DailyStatusDialog.note',
    defaultMessage: 'Note',
  },
  submit: {
    id: 'pages.DailyStatusDialog.submit',
    defaultMessage: 'Submit',
  },
  cancel: {
    id: 'pages.DailyStatusDialog.cancel',
    defaultMessage: 'Cancel',
  },
})

const setInitialValue = (items, id, initialValue, callback) => {
  const item = items.find(x => x.id === id)
  if (item) {
    if (!isUndefined(initialValue)) {
      item.initialValue = initialValue
    }

    if (callback) {
      callback(item)
    }
  }
  return item
}

const getFormConfig = (formConfig, statuses, data) => {
  formConfig.classNames = {
    container: cssClasses('form-container'),
  }
  formConfig.sections.forEach(section => {
    section.classNames = {
      container: cssClasses('section-items-container'),
    }
    section.rows.forEach(({ items }) => {
      setInitialValue(items, 'startedOn', data.startedOn)
      setInitialValue(items, 'endedOn', data.endedOn)
      setInitialValue(
        items,
        'reason',
        data.maintenanceStatusExternalId,
        item => {
          item.controlType.options = statuses.map(({ externalId, name }) => ({
            label: name,
            value: externalId,
          }))
          item.classNames = {
            sectionItemContainer: cssClasses('section-item-container'),
            item: cssClasses('section-item'),
            controlContainer: cssClasses('control-container'),
            controlLabel: cssClasses('control-label'),
          }
        }
      )
      setInitialValue(items, 'note', '', item => {
        item.classNames = {
          sectionItemContainer: cssClasses('section-item-container'),
          item: cssClasses('section-item'),
        }
      })
    })
  })

  return formConfig
}

const MODE = {
  EDITING: 'EDITING',
  SAVING: 'SAVING',
}
export const DailyStatusDialog = ({
  data = {},
  isOpen,
  onCancel,
  onSubmit,
  statuses,
  title,
  deviceName,
}) => {
  const [mode, setMode] = useState(MODE.EDITING)
  const { formatMessage } = useIntl()

  useEffect(() => {
    if (isOpen) {
      setMode(MODE.EDITING)
    }
  }, [isOpen])

  const onSaveChanges = (deviceId, values) => {
    setMode(MODE.SAVING)
    onSubmit({ deviceId, values })
  }

  const config = getFormConfig(formConfig, statuses, data)

  return (
    <FormikProvider config={config}>
      <AspectDialog
        actions={[
          <Button
            disabled={mode === MODE.SAVING}
            color="primary"
            onClick={onCancel}
          >
            {formatMessage(messages.cancel)}
          </Button>,
          <FormikContext.Consumer>
            {({ formik }) => (
              <Button
                color="primary"
                disabled={mode === MODE.SAVING || !formik.isValid}
                onClick={() => onSaveChanges(data.deviceId, formik.values)}
                variant="contained"
              >
                {formatMessage(messages.submit)}
              </Button>
            )}
          </FormikContext.Consumer>,
        ]}
        classes={{
          paper: cssClasses('reset-overflow'),
        }}
        dialogContentClasses={{
          root: cssClasses('reset-overflow'),
        }}
        maxWidth="xs"
        open={isOpen}
        onEscapeKeyDown={onCancel}
        onClose={onCancel}
        title={title || formatMessage(messages.title)}
      >
        <div className={cssClasses('Form__content')}>
          <div className={cssClasses('Form__device-name')}>
            {formatMessage(messages.deviceLabel)}: {deviceName}
          </div>
          <div className={cssClasses('Form__controls')}>
            <AspectForm config={config} />
          </div>
        </div>
      </AspectDialog>
    </FormikProvider>
  )
}

export default DailyStatusDialog
