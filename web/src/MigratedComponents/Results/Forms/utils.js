import ASSAY_LIST from '../../QueryFetch/Assay'
import { DEVICE_SELECT_LIST, DEVICE_TYPES } from '../../QueryFetch/Device'
import { SITE_ALL } from '../../QueryFetch/Site'
import { GEOGRAPHY_STATES } from '../../QueryFetch/Geography'

import messages from '../Detail/messages'

export const getBaseOptions = (
  response,
  { formatMessage, propNameForLabel = 'name', propNameForValue = 'id', propNameForI18n } = {}
) => {
  let options = []
  const { ok, data } = response
  if (ok) {
    options = data.map(item => {
      const msg = propNameForI18n && formatMessage ? messages[propNameForI18n] : null
      return {
        label: msg ? formatMessage(msg) : item[propNameForLabel],
        value: item[propNameForValue],
      }
    })
  }
  return options
}

export const getReadonly = (id, props, hiddenFields) => {
  let items = [
    {
      ...props,
      id,
      controlType: {
        component: 'textField',
      },
      type: 'readOnly',
    },
  ]
  if (hiddenFields) {
    items = [
      ...items,
      ...hiddenFields
        .filter(fld => fld.id !== id)
        .map(fld => ({
          id: fld.id,
          controlType: {
            component: 'hidden',
          },
          type: fld.submitToApi ? undefined : 'readOnly',
        })),
    ]
  }
  return items
}

export const siteProps = (isNew, props) => {
  if (!isNew) {
    return getReadonly('siteName', props, [{ id: 'siteId' }])
  }
  return [
    {
      ...props,
      id: 'siteId',
      controlType: {
        /**
         * TODO: replace `select` to `autoComplete` new field which should be implemented
         * in https://ops.systemone.id/browse/ASP-2349
         */
        component: 'select',
        endpoint: SITE_ALL.ENDPOINT,
        hideIfNoOptions: false,
        queryKey: SITE_ALL.KEY,
        normalizeLoadedData: (response, formik) => {
          let options = []
          const { ok, data } = response
          const { stateId, lgaId } = formik.values
          if (ok) {
            options = data
              .filter(item => (!stateId || item.stateId === stateId) && (!lgaId || item.lgaId === lgaId))
              .map(({ id, name }) => ({
                label: name,
                value: id,
              }))
          }
          return options
        },
        populateOnChange: (value, { formik }, dataSource) => {
          const { sampleOriginSiteId, reportableSiteId } = formik.values
          if (value) {
            if (!sampleOriginSiteId) {
              formik.setFieldValue('sampleOriginSiteId', value, false)
            }
            if (!reportableSiteId) {
              // see `endpoint` for props in dataSource
              const { name } = dataSource.find(({ id }) => id === value) || {}
              formik.setFieldValue('reportableSiteName', name, false)
              formik.setFieldValue('reportableSiteId', value, false)
            }
          }
        },
        dependencies: ['stateId', 'lgaId'],
      },
    },
  ]
}

export const stateProps = (isNew, props) => {
  if (!isNew) {
    return getReadonly('stateName', props, [{ id: 'stateId' }])
  }
  return [
    {
      ...props,
      id: 'stateId',
      controlType: {
        component: 'select',
        endpoint: GEOGRAPHY_STATES.ENDPOINT,
        hideIfNoOptions: false,
        queryKey: GEOGRAPHY_STATES.KEY,
        normalizeLoadedData: response => getBaseOptions(response),
        isClearable: true,
      },
    },
  ]
}

export const lgaProps = (isNew, props) => {
  if (!isNew) {
    return getReadonly('lgaName', props, [{ id: 'lgaId' }])
  }
  return [
    {
      ...props,
      id: 'lgaId',
      controlType: {
        component: 'select',
        endpoint: GEOGRAPHY_STATES.ENDPOINT,
        hideIfNoOptions: false,
        queryKey: GEOGRAPHY_STATES.KEY,
        normalizeLoadedData: (response, formik) => {
          let options = []
          const { ok, data } = response
          const { stateId } = formik.values
          if (ok) {
            options =
              data
                .find(({ id }) => id === stateId)
                ?.lgas?.map(({ id, name }) => ({
                  label: name,
                  value: id,
                })) || []
          }
          return options
        },
        dependencies: ['stateId'],
        isClearable: true,
      },
    },
  ]
}

export const deviceProps = (isNew, props) => {
  if (!isNew) {
    return getReadonly('deviceName', props, [{ id: 'deviceId' }])
  }
  return [
    {
      ...props,
      id: 'deviceId',
      controlType: {
        component: 'select',
        endpoint: DEVICE_SELECT_LIST.ENDPOINT,
        hideIfNoOptions: false,
        queryKey: DEVICE_SELECT_LIST.KEY,
        normalizeLoadedData: (response, formik) => {
          let options = []
          const { ok, data } = response
          const { deviceTypeId, siteId } = formik.values
          if (ok) {
            options = data
              .filter(
                item => (!siteId || item.siteId === siteId) && (!deviceTypeId || item.deviceTypeId === deviceTypeId)
              )
              .map(({ id, name }) => ({
                label: name,
                value: id,
              }))
          }
          return options
        },
        populateOnChange: (value, { formik }, dataSource) => {
          // see `endpoint` for props in dataSource
          const { deviceType, deviceTypeId, deviceSerial } = dataSource.find(({ id }) => id === value) || {}
          // set other fields on a form
          formik.setFieldValue('deviceType', deviceType || '', false)
          formik.setFieldValue('deviceTypeId', deviceTypeId, false)
          formik.setFieldValue('deviceSerial', deviceSerial || '', false)
        },
        dependencies: ['siteId'],
        isClearable: true,
      },
    },
  ]
}

export const deviceTypeProps = (isNew, props) => {
  if (!isNew) {
    return getReadonly('deviceType', props, [{ id: 'deviceTypeId' }])
  }
  return [
    {
      ...props,
      id: 'deviceTypeId',
      controlType: {
        component: 'select',
        endpoint: DEVICE_TYPES.ENDPOINT,
        hideIfNoOptions: false,
        queryKey: DEVICE_TYPES.KEY,
        normalizeLoadedData: response => {
          let options = []
          const { ok, data } = response
          if (ok) {
            options = data
              .filter(({ name }) => !name.includes('Aspect') && !name.includes('GxAlert'))
              .map(({ id, name }) => ({
                label: name,
                value: id,
              }))
          }
          return options
        },
      },
    },
  ]
}

export const deviceSerialProps = (isNew, props) => {
  if (!isNew) {
    return getReadonly('deviceSerial', props, null)
  }
  return [
    {
      ...props,
      id: 'deviceSerial',
      controlType: {
        component: 'textField',
      },
    },
  ]
}

export const assayProps = (isNew, props) => {
  if (!isNew) {
    return getReadonly('assayName', props, [{ id: 'assayId' }])
  }
  return [
    {
      ...props,
      id: 'assayId',
      controlType: {
        component: 'select',
        endpoint: ASSAY_LIST.ENDPOINT,
        hideIfNoOptions: false,
        queryKey: ASSAY_LIST.KEY,
        normalizeLoadedData: (response, formik) => {
          let options = []
          const { ok, data } = response
          const { deviceTypeId } = formik.values
          if (ok) {
            options = data
              .filter(item => item.deviceTypeId === deviceTypeId)
              .map(({ id, name }) => ({
                label: name,
                value: id,
              }))
          }
          return options
        },
        dependencies: ['deviceTypeId'],
      },
    },
  ]
}

export const resultCategoryControlType = formatMessage => {
  return {
    component: 'select',
    endpoint: ASSAY_LIST.ENDPOINT,
    hideIfNoOptions: false,
    queryKey: ASSAY_LIST.KEY,
    normalizeLoadedData: (response, formik) => {
      let options = []
      const { ok, data } = response
      const { assayId } = formik.values
      if (ok) {
        const { resultCategories = [] } = data.find(({ id }) => id === assayId) || {}
        options = resultCategories.map(({ id, name, i18nKey }) => ({
          label: formatMessage(messages[i18nKey], name),
          value: id,
        }))
      }
      return options
    },
    dependencies: ['assayId'],
  }
}
