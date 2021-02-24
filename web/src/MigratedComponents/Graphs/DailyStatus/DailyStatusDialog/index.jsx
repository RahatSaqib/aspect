import identity from 'lodash/identity'
import isUndefined from 'lodash/isUndefined'
import classnames from 'classnames/bind'
import React, { useMemo, useState } from 'react'
import { defineMessages, useIntl } from 'react-intl'
import Button from '@material-ui/core/Button'
import { useQuery } from 'react-query'

import AspectDialog from '../../../../components/shared/AspectDialog'
import fetchWrapperForQueries from '../../../QueryFetch'
import { DEVICE_STATUS } from '../../../QueryFetch/Device'
import Loading from '../../../../globals/components/Loading'

import formConfig from './formConfig'
import { FormikProvider } from '../../../Form/Formik/Context'
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
    defaultMessage: 'Device Status',
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

export const DailyStatusDialog = React.memo(
  ({ data = {}, isOpen, onCancel, onSubmit, title }) => {
    const formikRef = React.createRef()
    const [statuses, setStatuses] = useState([])
    const { formatMessage } = useIntl()

    const {
      isLoading: deviceStatussesIsLoading,
      isError: deviceStatussesIsError,
      error: deviceStatussesError,
    } = useQuery(
      DEVICE_STATUS.KEY,
      async () => fetchWrapperForQueries({ endpoint: DEVICE_STATUS.ENDPOINT }),
      {
        onSuccess: ({ data }) => {
          const output = []
          data.map(status => output.push({ ...status, checked: true }))
          setStatuses(output)
        },
      }
    )

    const config = useMemo(() => {
      formConfig.formContainerClassName = cssClasses('formContainerClassName')
      formConfig.sections.forEach(section => {
        section.sectionItemsContainerClassName = cssClasses(
          'sectionItemsContainerClassName'
        )
        section.rows.forEach(({ items }) => {
          setInitialValue(items, 'startedOn', data.startedOn)
          setInitialValue(items, 'endedOn', data.endedOn)
          setInitialValue(
            items,
            'reason',
            data.maintenanceStatusExternalId,
            item => {
              item.controlType.options = statuses.map(
                ({ externalId, name }) => ({
                  text: name,
                  value: externalId,
                })
              )
              item.containerClassName = cssClasses('sectionItemContainer')
              item.itemClassName = cssClasses('sectionItem')
            }
          )
          setInitialValue(items, 'note', '', item => {
            item.containerClassName = cssClasses('sectionItemContainer')
            item.itemClassName = cssClasses('sectionItem')
          })
        })
      })

      return formConfig
    }, [statuses, data])

    if (deviceStatussesIsError) {
      throw new Error(deviceStatussesError)
    }

    return (
      <AspectDialog
        actions={[
          <Button color="primary" onClick={onCancel}>
            {formatMessage(messages.cancel)}
          </Button>,
          <Button
            color="primary"
            variant="contained"
            onClick={() => {
              const { values } = formikRef.current
              onSubmit({
                values,
                day: data.day,
                deviceId: data.deviceId,
              })
            }}
          >
            {formatMessage(messages.submit)}
          </Button>,
        ]}
        classes={{
          paper: cssClasses('reset-overflow'),
        }}
        maxWidth="xs"
        open={isOpen}
        onEscapeKeyDown={onCancel}
        onClose={onCancel}
        title={title || formatMessage(messages.title)}
      >
        <div className={cssClasses('Form__Content')}>
          {deviceStatussesIsLoading ? (
            <Loading className={cssClasses('dailystatus__spinner')} />
          ) : (
            <div className={cssClasses('Form__Controls')}>
              <FormikProvider config={config} ref={formikRef}>
                <AspectForm config={config} />
              </FormikProvider>
            </div>
          )}
        </div>
      </AspectDialog>
    )
  }
)

export default DailyStatusDialog
