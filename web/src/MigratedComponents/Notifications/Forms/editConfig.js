import classnames from 'classnames/bind'
import capitalize from 'lodash/capitalize'
import sortBy from 'lodash/sortBy'
import reduce from 'lodash/reduce'
import values from 'lodash/values'
import union from 'lodash/union'

import messages from '../Detail/messages'
import ASSAY_LIST from '../../QueryFetch/Assay'
import PERSON_LIST from '../../QueryFetch/Person'
import { SITE_ALL } from '../../QueryFetch/Site'
import { getBaseData, validationBase } from '../../Form/Formik/Helpers'

const cssClasses = classnames.bind(require('../Detail/Detail.css'))

const checkboxClassNames = {
  itemContainer: cssClasses('checkbox-item-container'),
  controlContainer: cssClasses('checkbox-container'),
}

const getSectionsBase = formatMessage => [
  {
    id: 'section_notificationType',
    label: 'Notification Type',
    labelI18nKey: 'notificationType',
    rows: [
      {
        id: 0,
        items: [
          {
            id: 'notificationType',
            visibleIf: () => false,
          },
          {
            id: 'notificationTypeName',
            controlType: {
              component: 'textField',
            },
            fullWidth: true,
            labelI18nKey: 'notificationType',
            type: 'readOnly',
          },
        ],
      },
      {
        id: 0,
        items: [
          {
            id: 'name',
            controlType: {
              component: 'textField',
            },
            fullWidth: true,
            labelI18nKey: 'notificationTitle',
            validate: validationBase.required,
          },
        ],
      },
    ],
  },
  {
    id: 'whenResultIs',
    label: 'whenResultIs',
    labelI18nKey: 'whenResultIs',
    rows: [
      {
        id: 0,
        items: [
          {
            id: 'assayId',
            controlType: {
              component: 'select',
              endpoint: ASSAY_LIST.ENDPOINT,
              hideIfNoOptions: false,
              queryKey: ASSAY_LIST.KEY,
              normalizeLoadedData: response => {
                const { ok, data } = response
                const options =
                  ok === true ? getBaseData(data, formatMessage, messages) : []
                return options
              },
              placeholder: formatMessage(messages.assayPlaceholder),
            },
            labelI18nKey: 'assayTitle',
            validate: validationBase.required,
          },
          {
            id: 'resultCategoryId',
            controlType: {
              component: 'select',
              endpoint: ASSAY_LIST.ENDPOINT,
              hideIfNoOptions: false,
              queryKey: ASSAY_LIST.KEY,
              normalizeLoadedData: (response, formik) => {
                let options = []
                const { assayId: selectedAssayId } = formik.values
                if (selectedAssayId) {
                  const { ok, data } = response
                  if (ok === true) {
                    const selectedAssay = data.find(
                      ({ externalId }) => externalId === selectedAssayId
                    )
                    const { resultCategories = [] } = selectedAssay || {}
                    options = getBaseData(
                      resultCategories,
                      formatMessage,
                      messages
                    )
                  }
                }
                return options
              },
              dependencies: ['assayId'],
              placeholder: formatMessage(messages.resultPlaceholder),
            },
            labelI18nKey: 'resultTitle',
            validate: validationBase.required,
          },
        ],
      },
    ],
  },
  {
    id: 'fromThisDevice',
    label: 'fromThisDevice',
    labelI18nKey: 'fromThisDevice',
    rows: [
      {
        id: 0,
        items: [
          {
            id: 'deviceLevelId',
            controlType: {
              component: 'select',
              hideIfNoOptions: false,
              options: [
                {
                  label: formatMessage(messages.AreaNational),
                  value: 'national',
                },
                { label: formatMessage(messages.AreaState), value: 'state' },
                { label: formatMessage(messages.AreaLGA), value: 'lga' },
                { label: formatMessage(messages.AreaLaboratory), value: 'lab' },
              ],
              placeholder: formatMessage(messages.SelectAreaPlaceholder),
            },
            label: formatMessage(messages.SelectAreaTitle),
            validate: validationBase.required,
          },
          {
            id: 'areaItems',
            controlType: {
              component: 'select',
              endpoint: SITE_ALL.ENDPOINT,
              hideIfNoOptions: false,
              queryKey: SITE_ALL.KEY,
              normalizeLoadedData: (response, formik) => {
                let options = []
                const { deviceLevelId } = formik.values
                if (deviceLevelId && deviceLevelId !== 'national') {
                  const { ok, data } = response
                  if (ok === true) {
                    if (deviceLevelId === 'state') {
                      const byStateId = reduce(
                        data,
                        (acc, item) => {
                          const { stateId, stateName } = item
                          const state = { label: stateName, value: stateId }
                          acc[stateId] = acc[stateId] || state
                          return acc
                        },
                        {}
                      )
                      options = sortBy(values(byStateId), ['label'])
                    } else if (deviceLevelId === 'lga') {
                      const byStateId = reduce(
                        data,
                        (acc, item) => {
                          const { stateId, stateName, lgaId, lgaName } = item
                          const state = {
                            label: stateName,
                            value: stateId,
                            lgaById: {},
                            lgas: [],
                          }
                          const lga = { label: lgaName, value: lgaId }
                          acc[stateId] = acc[stateId] || state
                          const { lgaById, lgas } = acc[stateId]
                          if (!lgaById[lgaId]) {
                            lgaById[lgaId] = lga
                            lgas.push(lga)
                          }
                          return acc
                        },
                        {}
                      )
                      const states = values(byStateId).map(
                        ({ label, lgas }) => {
                          return {
                            label,
                            options: sortBy(lgas, ['label']),
                          }
                        }
                      )
                      options = states
                    } else if (deviceLevelId === 'lab') {
                      options = data.map(({ externalId, name }) => ({
                        label: name,
                        value: externalId,
                      }))
                    }
                  }
                }
                return options
              },
              isMulti: true,
              dependencies: ['deviceLevelId'],
              placeholder: formik => {
                const { deviceLevelId } = formik.values
                return deviceLevelId
                  ? formatMessage(
                      messages[`Select${capitalize(deviceLevelId)}Placeholder`]
                    )
                  : '-'
              },
            },
            label: formik => {
              const { deviceLevelId } = formik.values
              return deviceLevelId
                ? formatMessage(
                    messages[`Select${capitalize(deviceLevelId)}Title`]
                  )
                : '-'
            },
            validate: validationBase.required,
            visibleIf: values => {
              const { deviceLevelId } = values
              return deviceLevelId && deviceLevelId !== 'national'
            },
          },
        ],
      },
    ],
  },
  {
    id: 'send',
    label: 'send',
    labelI18nKey: 'send',
    rows: [
      {
        id: 0,
        items: [
          {
            id: 'sendEmail',
            controlType: {
              component: 'checkbox',
            },
            classNames: checkboxClassNames,
            initialValue: true,
            // label: 'Email',
            labelI18nKey: 'email',
          },
          {
            id: 'sendSms',
            controlType: {
              component: 'checkbox',
            },
            classNames: checkboxClassNames,
            // label: 'SMS',
            labelI18nKey: 'sms',
          },
          {
            id: 'sendWeb',
            controlType: {
              component: 'checkbox',
            },
            classNames: checkboxClassNames,
            // label: 'Web',
            labelI18nKey: 'web',
          },
        ],
      },
      // -----------------------------------
      // Email
      // -----------------------------------
      {
        id: 1,
        items: [
          {
            id: 'emailSubject',
            controlType: {
              component: 'textField',
            },
            classNames: {
              itemContainer: cssClasses('item-in-group-container'),
            },
            type: 'text',
            labelI18nKey: 'emailSubject',
            validate: validationBase.required,
            visibleIf: values => values.sendEmail === true,
          },
        ],
      },
      {
        id: 2,
        items: [
          {
            id: 'emailBody',
            controlType: {
              component: 'textArea',
              rowsMax: 10,
            },
            classNames: {
              itemContainer: cssClasses('item-in-group-container'),
            },
            type: 'text',
            labelI18nKey: 'emailBody',
            validate: validationBase.required,
            visibleIf: values => values.sendEmail === true,
          },
        ],
      },
      // -----------------------------------
      // SMS
      // -----------------------------------
      {
        id: 3,
        items: [
          {
            id: 'smsBody',
            controlType: {
              component: 'textArea',
              rowsMax: 5,
            },
            classNames: {
              itemContainer: cssClasses('item-in-group-container'),
            },
            labelI18nKey: 'smsBody',
            validate: validationBase.required,
            visibleIf: values => values.sendSms === true,
          },
        ],
      },
      // -----------------------------------
      // Web
      // -----------------------------------
      {
        id: 4,
        items: [
          {
            id: 'webBody',
            controlType: {
              component: 'textArea',
              rowsMax: 10,
            },
            classNames: {
              itemContainer: cssClasses('item-in-group-container'),
            },
            labelI18nKey: 'webBody',
            validate: validationBase.required,
            visibleIf: values => values.sendWeb === true,
          },
        ],
      },
    ],
  },
  {
    id: 'toAnyOfTheseContacts',
    label: 'toAnyOfTheseContacts',
    labelI18nKey: 'toAnyOfTheseContacts',
    rows: [
      {
        id: 0,
        items: [
          {
            id: 'toNationalContacts',
            controlType: {
              component: 'checkbox',
            },
            classNames: {
              controlContainer: cssClasses('checkbox-container'),
              itemContainer: cssClasses('max-width-100pcr'),
              // container: cssClasses('item-in-group-container'),
            },
            initialValue: true,
            label: 'National Contacts',
            labelI18nKey: 'toNationalContacts',
          },
        ],
      },
      {
        id: 0,
        items: [
          {
            id: 'nationalTags',
            controlType: {
              component: 'select',
              endpoint: PERSON_LIST.ENDPOINT,
              hideIfNoOptions: false,
              queryKey: PERSON_LIST.KEY,
              normalizeLoadedData: response => {
                const { ok, data } = response
                let options = []
                if (ok === true) {
                  let tags = union(
                    ...data.map(person => {
                      return (person.tags || '').split(';')
                    })
                  )
                    .map(tag => tag.trim())
                    .filter(tag => tag !== '')
                  tags = [...new Set(tags)]
                  options = tags.map(tag => ({ label: tag, value: tag }))
                }
                return options
              },
              isMulti: true,
            },
            classNames: {
              // container: cssClasses('tags-container'),
              itemContainer: cssClasses('max-width-100pc', 'tags-container'),
              controlContainer: cssClasses('full-width-100pc'),
              item: cssClasses('full-width-100pc'),
            },
            label: 'Assay',
            labelI18nKey: 'nationalTags',
            visibleIf: values => values.toNationalContacts === true,
          },
        ],
      },

      // --------------------------------------------------------------
      //
      // --------------------------------------------------------------
      {
        id: 0,
        items: [
          {
            id: 'toStateContacts',
            controlType: {
              component: 'checkbox',
            },
            classNames: {
              controlContainer: cssClasses('checkbox-container'),
            },
            label: 'State Contacts',
            labelI18nKey: 'toStateContacts',
          },
        ],
      },

      {
        id: 0,
        items: [
          {
            id: 'toLgaContacts',
            controlType: {
              component: 'checkbox',
            },
            classNames: {
              controlContainer: cssClasses('checkbox-container'),
            },
            label: 'LGA Contacts',
            labelI18nKey: 'toLgaContacts',
          },
        ],
      },

      {
        id: 0,
        items: [
          {
            id: 'toLaboratoryContacts',
            controlType: {
              component: 'checkbox',
            },
            classNames: {
              controlContainer: cssClasses('checkbox-container'),
            },
            label: 'Laboratory Contacts',
            labelI18nKey: 'toLaboratoryContacts',
          },
        ],
      },
    ],
  },
]

const getConfig = formatMessage => {
  return {
    title: formatMessage(messages.titleNew, 'New Notification'),
    icon: 'document',
    actions: {
      default: 'save',
      helpers: '',
      items: [
        {
          // id: 'transfer',
          // text: formatMessage(messages.transferResult),
          // action: 'transferResult',
          id: 'save',
          text: formatMessage(messages.save),
          action: 'save',
        },
      ],
    },
    sections: [...getSectionsBase(formatMessage)],
  }
}

export default getConfig
