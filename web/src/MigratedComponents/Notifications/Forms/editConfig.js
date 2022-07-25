import classnames from 'classnames/bind'
import capitalize from 'lodash/capitalize'
import isArray from 'lodash/isArray'
import isEqual from 'lodash/isEqual'
import isEmpty from 'lodash/isEmpty'
import intersectionBy from 'lodash/intersectionBy'
import filter from 'lodash/filter'
import map from 'lodash/map'
import sortBy from 'lodash/sortBy'
import reduce from 'lodash/reduce'
import values from 'lodash/values'
import union from 'lodash/union'
import uniqWith from 'lodash/uniqWith'
import xor from 'lodash/xor'

import messages from '../Detail/messages'
import ASSAY_LIST from '../../QueryFetch/Assay'
import { SITE_ALL } from '../../QueryFetch/Site'
import { getBaseData, getBaseValidation } from '../../Form/Formik/Helpers'
import { PERSON_SELECT_LIST } from '../../QueryFetch/Person'
import styles from '../Detail/Detail.css'

const cssClasses = classnames.bind(styles)

const checkboxClassNames = {
  itemContainer: cssClasses('checkbox-item-container'),
  controlContainer: cssClasses('checkbox-container'),
}

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
      const state = {
        label: stateName,
        value: stateId,
        lgaById: {},
        lgas: [],
      }
      const lga = {
        label: lgaName,
        value: lgaId,
        grouped: true,
      }
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
  const lgas = values(ByLGAId).map(({ label, lgas }) => {
    return {
      label,
      options: sortBy(lgas, ['label']),
    }
  })
  return lgas
}

function labSelectOptions(data) {
  return data.map(({ id, name }) => ({
    label: name,
    value: id,
  }))
}

function sharedAreaItemsConfig(formatMessage, optionsBuilder, key) {
  return {
    controlType: {
      component: 'select',
      endpoint: SITE_ALL.ENDPOINT,
      hideIfNoOptions: false,
      queryKey: SITE_ALL.KEY,
      normalizeLoadedData: response => {
        let options = []
        const { ok, data } = response
        if (ok === true) {
          options = optionsBuilder(data)
        }
        return options
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

function buildFromThisDevice(formatMessage) {
  return {
    id: 'fromThisDevice',
    label: 'fromThisDevice',
    labelI18nKey: 'fromThisDevice',
    rows: [
      {
        id: 10,
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
                {
                  label: formatMessage(messages.AreaLGA),
                  value: 'lga',
                },
                {
                  label: formatMessage(messages.AreaLaboratory),
                  value: 'lab',
                },
              ],
              placeholder: formatMessage(messages.SelectAreaPlaceholder),
            },
            label: formatMessage(messages.SelectAreaTitle),
          },
          {
            id: 'areaItemsState',
            ...sharedAreaItemsConfig(formatMessage, stateSelectOptions, 'state'),
          },
          {
            id: 'areaItemsLGA',
            ...sharedAreaItemsConfig(formatMessage, lgaSelectOptions, 'lga'),
          },
          {
            id: 'areaItemsLab',
            ...sharedAreaItemsConfig(formatMessage, labSelectOptions, 'lab'),
          },
        ],
      },
    ],
  }
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
        id: 1,
        items: [
          {
            id: 'name',
            controlType: {
              component: 'textField',
            },
            fullWidth: true,
            labelI18nKey: 'notificationTitle',
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
  },
]

function buildSendSection() {
  return {
    id: 'send',
    label: 'send',
    labelI18nKey: 'send',
    rows: [
      {
        id: 20,
        items: [
          {
            id: 'sendEmail',
            controlType: {
              component: 'checkbox',
            },
            classNames: checkboxClassNames,
            initialValue: true,
            labelI18nKey: 'email',
          },
          {
            id: 'sendSms',
            controlType: {
              component: 'checkbox',
            },
            classNames: checkboxClassNames,
            labelI18nKey: 'sms',
          },
          {
            id: 'sendWeb',
            controlType: {
              component: 'checkbox',
            },
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
            controlType: {
              component: 'placeholderTextField',
            },
            classNames: {
              itemContainer: cssClasses('item-in-group-container'),
            },
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
            controlType: {
              component: 'placeholderTextArea',
              rowsMax: 10,
              rows: 4,
            },
            classNames: {
              itemContainer: cssClasses('item-in-group-container'),
            },
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
            controlType: {
              component: 'placeholderTextArea',
              rowsMax: 5,
              rows: 2,
            },
            classNames: {
              itemContainer: cssClasses('item-in-group-container'),
            },
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
            controlType: {
              component: 'textField',
            },
            classNames: {
              itemContainer: cssClasses('item-in-group-container'),
            },
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
            controlType: {
              component: 'placeholderTextArea',
              rowsMax: 10,
              rows: 3,
            },
            classNames: {
              itemContainer: cssClasses('item-in-group-container'),
            },
            labelI18nKey: 'webBody',
            visibleIf: values => values.sendWeb === true,
          },
        ],
      },
    ],
  }
}

function buildJobFunctionsRows(jobFunctions) {
  return {
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
                jobFunctions[index] = jobFunctions[index] || {
                  jobFunctionId: jf.id,
                }
                initialValues.jobFunctions = jobFunctions
              },
              items: [
                {
                  id: `jobFunctions[${index}].checked`,
                  controlType: {
                    component: 'checkbox',
                  },
                  classNames: {
                    controlContainer: cssClasses('checkbox-container'),
                    itemContainer: cssClasses('max-width-100pcr'),
                  },
                  label: jf.name,
                  onAfterChange: formik => {
                    formik.setFieldTouched(`jobFunctions[${index}].checked`, true)
                  },
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
  }
}

function buildSendToPersons(formatMessage) {
  return {
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
                  {
                    label: formatMessage(messages.optionPersonRoleSet),
                    options: [],
                  },
                  {
                    label: formatMessage(messages.optionPersonRoleNotSet),
                    options: [],
                  },
                ]
                if (ok === true) {
                  const selected = intersectionBy(data, values.persons, 'id')
                  if (selected?.length) {
                    const initialValues = []
                    map(selected, ({ id, name, state }) =>
                      initialValues.push({
                        label: makeLabel(name, state),
                        value: id,
                        grouped: true,
                      })
                    )
                    values.persons = initialValues
                    setFieldValue('persons', initialValues)
                  }
                  const withJob = filter(data, item => !isEmpty(item.level))
                  const withoutJob = xor(data, withJob)
                  map(withJob, ({ id, name, state }) =>
                    options[0].options.push({
                      label: makeLabel(name, state),
                      value: id,
                      grouped: true,
                    })
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
                return options?.length ? options : null
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
  }
}

const getFormConfig = (formatMessage, _notificationType, jobFunctions, isEdit) => {
  const validationBase = getBaseValidation(formatMessage, messages)
  const fromThisDevice = buildFromThisDevice(formatMessage)
  const sendToPersons = buildSendToPersons(formatMessage)

  return {
    title: isEdit
      ? formatMessage(messages.titleEdit, 'Edit Notification')
      : formatMessage(messages.titleNew, 'New Notification'),
    icon: 'document',
    actions: {
      default: 'save',
      helpers: '',
      items: [
        {
          id: 'save',
          text: formatMessage(messages.save),
          action: 'save',
        },
      ],
    },
    sections: [
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
                controlType: {
                  component: 'checkbox',
                },
                classNames: {
                  controlContainer: cssClasses('checkbox-container'),
                  itemContainer: cssClasses('checkbox-item-container'),
                },
                initialValue: true,
                label: '',
              },
            ],
          },
        ],
      },
      ...getSectionsBase(formatMessage, validationBase),
      fromThisDevice,
      buildSendSection(formatMessage),
      sendToPersons,
      buildJobFunctionsRows(jobFunctions),
    ],
  }
}

export default getFormConfig
