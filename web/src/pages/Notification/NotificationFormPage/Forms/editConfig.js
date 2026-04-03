import capitalize from 'lodash/capitalize'
import filter from 'lodash/filter'
import intersectionBy from 'lodash/intersectionBy'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import sortBy from 'lodash/sortBy'
import union from 'lodash/union'
import uniqWith from 'lodash/uniqWith'
import values from 'lodash/values'
import xor from 'lodash/xor'
import { PERSON_SELECT_LIST } from '../../../../components/QueryFetch/Person'
import { SITE_SELECT } from '../../../../components/QueryFetch/Site'
import messages from '../messages'
import styles from '../NotificationFormPage.module.css'
import {
  issueBasedSection,
  calibrationSection,
  deviceOfflineSection,
  deviceNoResultsSection,
  lowInventorySection,
  stockExpiringSection,
  deviceOfflineRecurringSection,
} from './issueBasedConfig'
import notificationTypeSection from './notificationTypeSection'
import { reportBasedSection } from './reportBasedConfig'
import { resultBasedSection } from './resultBasedConfig'

const checkboxClassNames = {
  itemContainer: styles.checkbox_item_container,
  controlContainer: styles.checkbox_container,
}

const getFormConfig = (formatMessage, jobFunctions, partner, isEdit) => ({
  title: isEdit
    ? formatMessage(messages.titleEdit, 'Edit Notification')
    : formatMessage(messages.titleNew, 'New Notification'),
  icon: 'document',
  actions: {
    default: 'save',
    helpers: '',
    items: [{ id: 'save', text: formatMessage(messages.save), action: 'save' }],
  },
  sections: [
    enabledSection(formatMessage),
    notificationTypeSection(formatMessage, partner, isEdit), // notification header (enabled/type)
    issueBasedSection(formatMessage), // only for ['issueBased]
    resultBasedSection(formatMessage, partner), // only for ['resultBased']
    ...reportBasedSection(formatMessage),
    geographySection(formatMessage), // only for ['DeviceNoResults', 'DeviceOffline', 'CalibrationDueDate', 'ModuleReplaced', 'ModuleDisabled', 'UnusedModules']
    lowInventorySection(formatMessage, partner), // only for ['InventoryStockout']
    deviceOfflineSection(formatMessage), // only for ['DeviceOffline']
    deviceOfflineRecurringSection(formatMessage), // only for ['DeviceOffline']
    deviceNoResultsSection(formatMessage, partner), // only for ['deviceNoResultsSection']
    stockExpiringSection(formatMessage, partner), // only for ['InventoryStockExpiring']
    calibrationSection(formatMessage), // only for ['CalibrationDueDate']
    ...sendSection(formatMessage, jobFunctions), // notification footer (sending options)
  ],
})

function stateSelectOptions(data) {
  const stateOptions = reduce(
    data,
    (acc, curr) => {
      const { stateId, stateName } = curr
      const state = { label: stateName, value: stateId }
      acc[stateId] = acc[stateId] || state
      return acc
    },
    {}
  )
  return sortBy(values(stateOptions), ['label'])
}

function lgaSelectOptions(data) {
  const ByLGAId = reduce(
    data,
    (acc, item) => {
      const { stateId, stateName, lgaId, lgaName } = item
      /**
       * when by some reason API returns data with falsy value for
       * some needed props
       * then do not add such item to `acc` and return `acc` right away
       */
      if (!stateId || !stateName || !lgaId || !lgaName) {
        return acc
      }
      const state = { label: stateName, value: stateId, lgaById: {}, lgas: [] }
      const lga = { label: lgaName, value: lgaId, grouped: true }
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
  return values(ByLGAId).map(({ label, lgas }) => ({ label, options: sortBy(lgas, ['label']) }))
}

function labSelectOptions(data) {
  return data.map(({ id, name }) => ({ label: name, value: id }))
}

function sharedAreaItemsConfig(formatMessage, optionsBuilder, key) {
  return {
    controlType: {
      component: 'select',
      endpoint: SITE_SELECT.ENDPOINT,
      hideIfNoOptions: false,
      queryKey: SITE_SELECT.KEY,
      normalizeLoadedData: response => {
        const { ok, data } = response
        return ok === true ? optionsBuilder(data) : []
      },
      isMulti: true,
      dependencies: ['deviceLevelId'],
      placeholder: formik => {
        const { deviceLevelId } = formik.values
        return deviceLevelId ? formatMessage(messages[`Select${capitalize(deviceLevelId)}Placeholder`]) : '-'
      },
    },
    label: formik => {
      const { deviceLevelId } = formik.values
      return deviceLevelId ? formatMessage(messages[`Select${capitalize(deviceLevelId)}Title`]) : '-'
    },
    visibleIf: values => {
      const { deviceLevelId } = values
      return deviceLevelId && deviceLevelId === key
    },
  }
}
// notification enabled
const enabledSection = () => ({
  id: 'section_notificationType_disable',
  label: 'Enable',
  labelI18nKey: 'notificationTypeEnable',
  rows: [
    {
      id: 0,
      items: [
        {
          id: 'enabled',
          controlType: { component: 'checkbox' },
          classNames: checkboxClassNames,
          initialValue: true,
          label: '',
        },
      ],
    },
  ],
})

const geographySection = formatMessage => {
  return {
    id: 'fromThisDevice',
    label: 'from',
    labelI18nKey: 'from',
    rows: [
      {
        id: 10,
        items: [
          {
            id: 'deviceLevelId',
            initialValue: 'national',
            controlType: {
              component: 'select',
              endpoint: '/geography/level-by-user-select-list',
              hideIfNoOptions: false,
              queryKey: 'GEOGRAPHY_LEVEL',

              normalizeLoadedData: response =>
                response.map(i => ({ label: formatMessage(messages[`Area${i.name}`]), value: i.id })),
              placeholder: formatMessage(messages.SelectAreaPlaceholder),
            },
            label: formatMessage(messages.SelectAreaTitle),
          },
          { id: 'areaItemsState', ...sharedAreaItemsConfig(formatMessage, stateSelectOptions, 'state') },
          { id: 'areaItemsLGA', ...sharedAreaItemsConfig(formatMessage, lgaSelectOptions, 'lga') },
          { id: 'areaItemsLab', ...sharedAreaItemsConfig(formatMessage, labSelectOptions, 'lab') },
        ],
      },
    ],
  }
}

const sendSection = (formatMessage, jobFunctions) => {
  return [
    // send (sms/email/web)
    {
      id: 'send',
      label: 'send',
      labelI18nKey: 'send',
      rows: [
        {
          id: 20,
          items: [
            {
              id: 'sendEmail',
              controlType: { component: 'checkbox' },
              classNames: checkboxClassNames,
              initialValue: true,
              labelI18nKey: 'email',
            },
            {
              id: 'sendSms',
              controlType: { component: 'checkbox' },
              classNames: checkboxClassNames,
              labelI18nKey: 'sms',
            },
            {
              id: 'sendWeb',
              controlType: { component: 'checkbox' },
              classNames: checkboxClassNames,
              labelI18nKey: 'web',
            },
          ],
        },
        // -----------------------------------
        // Email
        // -----------------------------------
        {
          id: 30,
          items: [
            {
              id: 'emailSubject',
              controlType: { component: 'placeholderTextField' },
              classNames: { itemContainer: styles.item_in_group_container },
              type: 'text',
              labelI18nKey: 'emailSubject',
              visibleIf: values => values.sendEmail === true,
            },
          ],
        },
        {
          id: 40,
          items: [
            {
              id: 'emailBody',
              controlType: { component: 'placeholderTextArea', rowsMax: 10, rows: 4 },
              classNames: { itemContainer: styles.item_in_group_container },
              type: 'text',
              labelI18nKey: 'emailBody',
              visibleIf: values => values.sendEmail === true,
            },
          ],
        },
        // -----------------------------------
        // SMS
        // -----------------------------------
        {
          id: 50,
          items: [
            {
              id: 'smsBody',
              controlType: { component: 'placeholderTextArea', rowsMax: 5, rows: 2 },
              classNames: { itemContainer: styles.item_in_group_container },
              labelI18nKey: 'smsBody',
              visibleIf: values => values.sendSms === true,
            },
          ],
        },
        // -----------------------------------
        // Web
        // -----------------------------------
        {
          id: 60,
          items: [
            {
              id: 'webUrl',
              controlType: { component: 'textField' },
              classNames: { itemContainer: styles.item_in_group_container },
              type: 'text',
              labelI18nKey: 'webUrl',
              visibleIf: values => values.sendWeb === true,
            },
          ],
        },
        {
          id: 61,
          items: [
            {
              id: 'webBody',
              controlType: { component: 'placeholderTextArea', rowsMax: 10, rows: 3 },
              classNames: { itemContainer: styles.item_in_group_container },
              labelI18nKey: 'webBody',
              visibleIf: values => values.sendWeb === true,
            },
          ],
        },
      ],
    },
    // to persons
    {
      id: 'sendToPersons',
      label: 'sendToPersons',
      labelI18nKey: 'personsSelectLabel',
      rows: [
        {
          id: 81,
          items: [
            {
              id: 'persons',
              label: formatMessage(messages.selectPersonOption),
              initialValue: [],
              controlType: {
                component: 'select',
                endpoint: PERSON_SELECT_LIST.ENDPOINT,
                hideIfNoOptions: false,
                isMulti: true,
                isClearable: true,
                queryKey: PERSON_SELECT_LIST.KEY,
                placeholder: formatMessage(messages.selectPersonOption),
                normalizeLoadedData: (response, formik) => {
                  const { values, setFieldValue } = formik
                  function makeLabel(name, state) {
                    const stateLabel = isEmpty(state) ? '' : ` (${state})`
                    return `${name} ${stateLabel}`
                  }
                  const { ok, data } = response
                  const options = [
                    { label: formatMessage(messages.optionPersonRoleSet), options: [] },
                    { label: formatMessage(messages.optionPersonRoleNotSet), options: [] },
                  ]
                  if (ok === true) {
                    const selected = intersectionBy(data, values.persons, 'id')
                    if (selected?.length) {
                      const initialValues = []
                      map(selected, ({ id, name, state }) =>
                        initialValues.push({ label: makeLabel(name, state), value: id, grouped: true })
                      )
                      values.persons = initialValues
                      setFieldValue('persons', initialValues)
                    }
                    const withJob = filter(data, item => !isEmpty(item.assignments))
                    const withoutJob = xor(data, withJob)
                    map(withJob, ({ id, name, state }) =>
                      options[0].options.push({ label: makeLabel(name, state), value: id, grouped: true })
                    )
                    map(withoutJob, ({ name, state }) =>
                      options[1].options.push({
                        label: makeLabel(name, state),
                        value: null,
                        disabled: true,
                        grouped: true,
                      })
                    )
                  }
                  return options?.length ? options : []
                },
              },
              classNames: {
                itemContainer: 'max_width_100pc tags_container',
                controlContainer: styles.full_width_100pc,
                item: styles.full_width_100pc,
              },
              labelI18nKey: 'selectPersonOption',
            },
          ],
        },
        {
          id: 20,
          items: [
            {
              id: 'sendToPatient',
              labelI18nKey: 'sendToPatient',
              controlType: {
                component: 'checkbox',
              },
              classNames: checkboxClassNames,
              initialValue: false,
            },
          ],
        },
      ],
    },
    // job functions
    {
      id: 'toAnyOfTheseJobFunctions',
      label: 'toAnyOfTheseJobFunctions',
      labelI18nKey: 'toAnyOfTheseJobFunctions',
      rows: [
        ...reduce(
          [...jobFunctions],
          (acc, jf, index) => {
            acc = [
              ...acc,
              {
                id: `row-jf${jf.id}-name`,
                presetInitialValues: initialValues => {
                  const jobFunctions = initialValues.jobFunctions || []
                  jobFunctions[index] = jobFunctions[index] || { jobFunctionId: jf.id }
                  initialValues.jobFunctions = jobFunctions
                },
                items: [
                  {
                    id: `jobFunctions[${index}].checked`,
                    controlType: { component: 'checkbox' },
                    classNames: {
                      controlContainer: styles.checkbox_container,
                      itemContainer: styles.max_width_100pcr,
                    },
                    label: jf.name,
                    onAfterChange: formik => formik.setFieldTouched(`jobFunctions[${index}].checked`, true),
                  },
                ],
              },
              {
                id: `row-jf${jf.id}-tags`,
                items: [
                  {
                    id: `jobFunctions[${index}].tags`,
                    initialValue: [],
                    controlType: {
                      component: 'select',
                      endpoint: PERSON_SELECT_LIST.ENDPOINT,
                      hideIfNoOptions: false,
                      queryKey: PERSON_SELECT_LIST.KEY,
                      normalizeLoadedData: response => {
                        const { ok, data } = response
                        let options = []
                        if (ok === true) {
                          let personTags = union(...data.map(({ tagDetails }) => tagDetails))
                          personTags = uniqWith(personTags, isEqual)
                          options = personTags.map(({ tagName, tagId }) => ({
                            label: tagName,
                            value: tagId,
                          }))
                        }
                        return options
                      },
                      isMulti: true,
                    },
                    classNames: {
                      itemContainer: 'max_width_100pc tags_container',
                      controlContainer: styles.full_width_100pc,
                      item: styles.full_width_100pc,
                    },
                    label: 'Tags',
                    labelI18nKey: 'jobFunctionTags',
                    visibleIf: values => values.jobFunctions[index].checked,
                  },
                ],
              },
            ]
            return acc
          },
          []
        ),
      ],
    },
  ]
}

export default getFormConfig
