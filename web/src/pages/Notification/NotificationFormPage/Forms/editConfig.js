import classnames from 'classnames/bind'
import capitalize from 'lodash/capitalize'
import filter from 'lodash/filter'
import intersectionBy from 'lodash/intersectionBy'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import sortBy from 'lodash/sortBy'
import union from 'lodash/union'
import uniqWith from 'lodash/uniqWith'
import values from 'lodash/values'
import xor from 'lodash/xor'
import { getBaseData } from '../../../../components/Form/Formik/Helpers'
import ASSAY_LIST from '../../../../components/QueryFetch/Assay'
import { PERSON_SELECT_LIST } from '../../../../components/QueryFetch/Person'
import { SITE_SELECT } from '../../../../components/QueryFetch/Site'
import messages from '../messages'
import styles from '../NotificationFormPage.css'

const cssClasses = classnames.bind(styles)

const checkboxClassNames = {
  itemContainer: cssClasses('checkbox-item-container'),
  controlContainer: cssClasses('checkbox-container'),
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
    ...notificationTypeSection(formatMessage), // notification header (enabled/type)
    resultBasedSection(formatMessage), // only for ['resultBased']
    geographySection(formatMessage), // only for ['DeviceNoResults', 'DeviceOffline', 'calibration', 'ModuleReplaced', 'ModuleDisabled', 'UnusedModules', 'InstrumentReplaced']
    lowInventorySection(formatMessage, partner), // only for ['InventoryStockout']
    deviceOfflineSection(formatMessage, partner), // only for ['DeviceOffline']
    deviceNoResultsSection(formatMessage, partner), // only for ['deviceNoResultsSection']
    stockExpiringSection(formatMessage, partner), // only for ['InventoryStockExpiring']
    calibrationSection(formatMessage), // only for ['calibration']
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

const notificationTypeSection = formatMessage => {
  return [
    // notification enabled
    {
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
    },
    // notification type/name
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
              controlType: {
                component: 'select',
                hideIfNoOptions: false,
                options: [
                  {
                    label: formatMessage(messages.notificationCreateGroupForResults),
                    options: [
                      {
                        value: 'resultBased',
                        label: formatMessage(messages.notificationTypeResultBased),
                        icon: 'AiOutlineSolution',
                      },
                    ],
                  },
                  {
                    label: formatMessage(messages.notificationCreateGroupForSite),
                    options: [
                      // {
                      //   value: 'InventoryStockout',
                      //   label: formatMessage(messages.notificationTypeLowInventory),
                      //   icon: 'AiOutlineDashboard',
                      // },
                      // {
                      //   value: 'InventoryStockExpiring',
                      //   label: formatMessage(messages.notificationTypeExpiring),
                      //   icon: 'AiOutlineDashboard',
                      // },
                    ],
                  },
                  {
                    label: formatMessage(messages.notificationCreateGroupForDevices),
                    options: [
                      // {
                      //   value: 'DeviceNoResults',
                      //   label: formatMessage(messages.notificationTypeNoResult),
                      //   icon: 'AiOutlineFileExclamation',
                      // },
                      // {
                      //   value: 'DeviceOffline',
                      //   label: formatMessage(messages.notificationTypeOffline),
                      //   icon: 'AiOutlineApi',
                      // },
                      // { TODO:  Uncomment when the issue is ready.
                      //   value: 'calibration',
                      //   label: formatMessage(messages.notificationTypeCalibration),
                      //   icon: 'AiOutlineTool',
                      // },
                      // {
                      //   value: 'ModuleReplaced',
                      //   label: formatMessage(messages.notificationTypeModuleReplaced),
                      //   icon: 'AiOutlineSwap',
                      // },
                      // {
                      //   value: 'ModuleDisabled',
                      //   label: formatMessage(messages.notificationTypeModuleDisabled),
                      //   icon: 'AiOutlineBlock',
                      // },
                      // {
                      //   value: 'UnusedModules',
                      //   label: formatMessage(messages.notificationTypeModuleUnused),
                      //   icon: 'AiOutlineExclamation',
                      // },
                      // {
                      //   value: 'InstrumentReplaced',
                      //   label: formatMessage(messages.notificationTypeInstrumentReplaced),
                      //   icon: 'AiOutlineTool',
                      // },
                    ],
                  },
                ],
                placeholder: formatMessage(messages.notificationType),
              },
              classNames: {
                itemContainer: cssClasses('min-width-100pc', 'tags-container'),
                controlContainer: cssClasses('full-width-100pc'),
                item: cssClasses('full-width-100pc'),
              },
              labelI18nKey: 'notificationType',
            },
            {
              id: 'name',
              controlType: { component: 'textField' },
              fullWidth: true,
              labelI18nKey: 'notificationTitle',
            },
          ],
        },
      ],
    },
  ]
}

const resultBasedSection = formatMessage => {
  return {
    id: 'whenResultIs',
    label: 'whenResultIs',
    labelI18nKey: 'whenResultIs',
    visibleIf: values => ['resultBased'].includes(values.notificationType),
    rows: [
      {
        id: 'result',
        isMulti: true,
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
                const options = ok === true ? getBaseData(data, formatMessage, messages) : []
                return options
              },
              placeholder: formatMessage(messages.assayPlaceholder),
            },
            labelI18nKey: 'assayTitle',
          },
          {
            id: 'resultCategoryId',
            controlType: {
              component: 'select',
              endpoint: ASSAY_LIST.ENDPOINT,
              hideIfNoOptions: false,
              isMulti: true,
              queryKey: ASSAY_LIST.KEY,
              normalizeLoadedData: (response, formik, subRowIndex) => {
                let options = []
                const { assayId: selectedAssayId } = formik.values.result[subRowIndex]
                if (selectedAssayId) {
                  const { ok, data } = response
                  if (ok === true) {
                    const selectedAssay = data.find(({ externalId }) => externalId === selectedAssayId)
                    const { resultCategories = [], resultCategoryGroups } = selectedAssay || {}
                    const scope =
                      isArray(resultCategoryGroups) && !isEmpty(resultCategoryGroups)
                        ? 'ResultCategoryGroups'
                        : 'ResultCategories'
                    options = getBaseData(
                      scope === 'ResultCategoryGroups' ? resultCategoryGroups : resultCategories,
                      formatMessage,
                      messages
                    )
                    options = options.map(it => ({ ...it, scope }))
                  }
                }
                return options
              },
              dependencies: ['result[{{subRowIndex}}].assayId'],
              placeholder: formatMessage(messages.resultPlaceholder),
            },
            labelI18nKey: 'resultTitle',
          },
        ],
      },
    ],
  }
}

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

const lowInventorySection = (formatMessage, partner) => {
  return {
    id: 'whenDeviceHasLessThan',
    label: 'whenDeviceHasLessThan',
    labelI18nKey: 'whenDeviceHasLessThan',
    visibleIf: values => ['InventoryStockout'].includes(values.notificationType),
    rows: [
      {
        id: 85,
        items: [
          {
            id: 'daysOfInventoryLeft',
            label: formatMessage(messages.daysOfInventoryLeft),
            initialValue: [`${partner.dueDaysInventoryStockout}`],
            type: 'readOnly',
            controlType: {
              component: 'select',
              hideIfNoOptions: false,
              options: [{ value: `${partner.dueDaysInventoryStockout}`, label: `${partner.dueDaysInventoryStockout}` }],
            },
            classNames: {
              itemContainer: cssClasses('max-width-100pc', 'tags-container'),
              controlContainer: cssClasses('full-width-100pc'),
              item: cssClasses('full-width-100pc'),
            },
            labelI18nKey: 'daysOfInventoryLeft',
          },
        ],
      },
    ],
  }
}

const deviceOfflineSection = (formatMessage, partner) => {
  return {
    id: 'whenDeviceHasBeenOfflineForMoreThan',
    label: 'whenDeviceHasBeenOfflineForMoreThan',
    labelI18nKey: 'whenDeviceHasBeenOfflineForMoreThan',
    visibleIf: values => ['DeviceOffline'].includes(values.notificationType),
    rows: [
      {
        id: 83,
        items: [
          {
            id: 'daysOffline',
            label: formatMessage(messages.daysOffline),
            initialValue: [`${partner.maxDaysDeviceOffline}`],
            type: 'readOnly',
            controlType: {
              component: 'select',
              hideIfNoOptions: false,
              options: [{ value: `${partner.maxDaysDeviceOffline}`, label: `${partner.maxDaysDeviceOffline}` }],
            },
            classNames: {
              itemContainer: cssClasses('max-width-100pc', 'tags-container'),
              controlContainer: cssClasses('full-width-100pc'),
              item: cssClasses('full-width-100pc'),
            },
            labelI18nKey: 'daysOffline',
          },
        ],
      },
    ],
  }
}

const deviceNoResultsSection = (formatMessage, partner) => {
  return {
    id: 'whenDeviceDidNotSendResultsForMoreThan',
    label: 'whenDeviceDidNotSendResultsForMoreThan',
    labelI18nKey: 'whenDeviceDidNotSendResultsForMoreThan',
    visibleIf: values => ['DeviceNoResults'].includes(values.notificationType),
    rows: [
      {
        id: 85,
        items: [
          {
            id: 'daysNoResults',
            label: formatMessage(messages.daysWithoutResults),
            initialValue: [`${partner.maxDaysDeviceNoResults}`],
            type: 'readOnly',
            controlType: {
              component: 'select',
              hideIfNoOptions: false,
              options: [{ value: `${partner.maxDaysDeviceNoResults}`, label: `${partner.maxDaysDeviceNoResults}` }],
            },
            classNames: {
              itemContainer: cssClasses('max-width-100pc', 'tags-container'),
              controlContainer: cssClasses('full-width-100pc'),
              item: cssClasses('full-width-100pc'),
            },
            labelI18nKey: 'daysWithoutResults',
          },
        ],
      },
    ],
  }
}

const stockExpiringSection = (formatMessage, partner) => {
  return {
    id: 'stockExpiring',
    label: 'stockExpiring',
    labelI18nKey: 'stockExpiring',
    visibleIf: values => ['InventoryStockExpiring'].includes(values.notificationType),
    rows: [
      {
        id: 81,
        items: [
          {
            id: 'stockExpiring',
            label: formatMessage(messages.stockExpiring),
            initialValue: [`${partner.dueDaysInventoryStockExpiring}`],
            type: 'readOnly',
            controlType: {
              component: 'select',
              hideIfNoOptions: false,
              options: [
                {
                  value: `${partner.dueDaysInventoryStockExpiring}`,
                  label: `${partner.dueDaysInventoryStockExpiring}`,
                },
              ],
            },
            classNames: {
              itemContainer: cssClasses('max-width-100pc', 'tags-container'),
              controlContainer: cssClasses('full-width-100pc'),
              item: cssClasses('full-width-100pc'),
            },
            labelI18nKey: 'daysStockExpiring',
          },
        ],
      },
    ],
  }
}

const calibrationSection = formatMessage => {
  return {
    id: 'calibration',
    label: 'calibration',
    labelI18nKey: 'calibration',
    visibleIf: values => ['calibration'].includes(values.notificationType),
    rows: [
      {
        id: 181,
        items: [
          {
            id: 'calibration',
            label: formatMessage(messages.stockExpiring),
            initialValue: ['30/60/90'],
            type: 'readOnly',
            controlType: {
              component: 'select',
              // endpoint: PERSON_SELECT_LIST.ENDPOINT,
              hideIfNoOptions: false,
              // queryKey: PERSON_SELECT_LIST.KEY,
              options: [{ value: '30/60/90', label: '30/60/90' }],
              // normalizeLoadedData: (response, formik) => {
              //   const { values, setFieldValue } = formik
              //   function makeLabel(name, state) {
              //     const stateLabel = isEmpty(state) ? '' : ` (${state})`
              //     return `${name} ${stateLabel}`
              //   }
              //   const { ok, data } = response
              //   const options = [
              //     { label: formatMessage(messages.optionPersonRoleSet), options: [] },
              //     { label: formatMessage(messages.optionPersonRoleNotSet), options: [] },
              //   ]
              //   if (ok === true) {
              //     const selected = intersectionBy(data, values.persons, 'id')
              //     if (selected?.length) {
              //       const initialValues = []
              //       map(selected, ({ id, name, state }) =>
              //         initialValues.push({ label: makeLabel(name, state), value: id, grouped: true })
              //       )
              //       values.persons = initialValues
              //       setFieldValue('persons', initialValues)
              //     }
              //     const withJob = filter(data, item => !isEmpty(item.level))
              //     const withoutJob = xor(data, withJob)
              //     map(withJob, ({ id, name, state }) =>
              //       options[0].options.push({ label: makeLabel(name, state), value: id, grouped: true })
              //     )
              //     map(withoutJob, ({ name, state }) =>
              //       options[1].options.push({
              //         label: makeLabel(name, state),
              //         value: null,
              //         disabled: true,
              //         grouped: true,
              //       })
              //     )
              //   }
              //   return options?.length ? options : []
              // },
            },
            classNames: {
              itemContainer: cssClasses('max-width-100pc', 'tags-container'),
              controlContainer: cssClasses('full-width-100pc'),
              item: cssClasses('full-width-100pc'),
            },
            labelI18nKey: 'daysOfInventoryLeft',
          },
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
              classNames: { itemContainer: cssClasses('item-in-group-container') },
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
              classNames: { itemContainer: cssClasses('item-in-group-container') },
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
              classNames: { itemContainer: cssClasses('item-in-group-container') },
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
              classNames: { itemContainer: cssClasses('item-in-group-container') },
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
              classNames: { itemContainer: cssClasses('item-in-group-container') },
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
                    const withJob = filter(data, item => !isEmpty(item.level))
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
                itemContainer: cssClasses('max-width-100pc', 'tags-container'),
                controlContainer: cssClasses('full-width-100pc'),
                item: cssClasses('full-width-100pc'),
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
                      controlContainer: cssClasses('checkbox-container'),
                      itemContainer: cssClasses('max-width-100pcr'),
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
                      itemContainer: cssClasses('max-width-100pc', 'tags-container'),
                      controlContainer: cssClasses('full-width-100pc'),
                      item: cssClasses('full-width-100pc'),
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
