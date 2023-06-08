import { useEffect, useState } from 'react'
import endOfMonth from 'date-fns/endOfMonth'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfMonth from 'date-fns/startOfMonth'
import filter from 'lodash/filter'
import isFunction from 'lodash/isFunction'
import isPlainObject from 'lodash/isPlainObject'
import keys from 'lodash/keys'
import map from 'lodash/map'
import uniqBy from 'lodash/uniqBy'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import fetchWrapperForQueries from '../components/QueryFetch'
import ASSAY_LIST from '../components/QueryFetch/Assay'
import { negateTimeZoneOffset } from '../oldComponents/shared/DateTimeInput/utils/date'
import { useFilterUpdate, useFilterValues } from '../providers/FilterProvider'
import DATE_CONSTS from '../utils/consts/DateTime/CONSTS'
import GRAPH_CONSTS from '../utils/consts/Graphs/CONSTS'

const { treatmentStatus } = GRAPH_CONSTS
const { DATE_RANGE_KEYS } = DATE_CONSTS
const { MIN_DATE, MAX_DATE } = DATE_RANGE_KEYS

const parseDate = (date, fmt) => {
  const base = 'yyyy-MM-dd'
  const parsedDate = fmt === 'MMM' ? negateTimeZoneOffset(new Date(date), base) : parse(date, fmt, new Date())
  return {
    [MIN_DATE]: format(startOfMonth(parsedDate), base),
    [MAX_DATE]: format(endOfMonth(parsedDate), base),
  }
}

const flattenAssaysStructure = ({ data }) => {
  const output = []
  map(data, ({ resultCategories }) => map(resultCategories, category => output.push({ ...category })))
  return uniqBy(output, 'i18nKey')
}

const assayResultCategoryIdFromKey = (data, id) => filter(data, { externalId: id })[0] || false

const assayIdFromKey = ({ data }, id) => filter(data, { externalId: id })[0] || false

const diseaseIdFromKey = ({ data }, id) => filter(data, { externalId: id })[0] || false

function getQueryParameters(linkData, data, formatDate, id, indexBy, moreProps) {
  const { assays, baseAssay, keys: paramKeys, filterBy, keyToConsume } = moreProps
  const params = {}
  const buildParamsFromKey = key => {
    if (key === 'indexBy' && indexBy.includes('month')) {
      const { [indexBy]: month } = data
      const { minDate, maxDate } = parseDate(month, formatDate)
      params[MIN_DATE] = minDate
      params[MAX_DATE] = maxDate
      return
    }

    if (key === 'resultCategoryId') {
      const categories = flattenAssaysStructure(linkData)

      if (filterBy?.resultCategory1) {
        const { values } = filterBy.resultCategory1
        values.forEach(externalId => {
          const { id: resultCategoryId } = assayResultCategoryIdFromKey(categories, externalId)
          params.resultCategoryId = params.resultCategoryId
            ? [...params.resultCategoryId, resultCategoryId]
            : [resultCategoryId]
        })

        if (keyToConsume === 'resultCategory2') {
          const { id: resultCategoryId } = assayResultCategoryIdFromKey(categories, id)
          params.resultCategory2Id = resultCategoryId
        }
      } else {
        const { id: resultCategoryId } = assayResultCategoryIdFromKey(categories, id)
        params.resultCategoryId = resultCategoryId
      }
      return
    }

    if (key === 'assay' && !Object.keys(params).includes('assayId')) {
      const { id: assayId } = assayIdFromKey(linkData, id)
      params.assayId = assayId
      return
    }

    if (key === 'treatmentStatus') {
      switch (id) {
        case 'NotConfirmed':
          params.treatmentStatus = treatmentStatus.NotConfirmed
          break

        case 'Confirmed':
          params.treatmentStatus = treatmentStatus.Confirmed
          break

        default:
          break
      }
      return
    }

    if (key === 'diseaseId') {
      const { diseaseId } = diseaseIdFromKey(linkData, baseAssay)
      params.diseaseId = diseaseId
      return
    }

    if (key === 'daysStockLeft') {
      params.daysStockLeft = id
      return
    }

    if (key === 'consumableId') {
      params.consumableId = data.consumableId
      return
    }

    if (key === 'onlyReportableResults') {
      params.onlyReportableResults = true
      return
    }

    if (key === 'displayResult') {
      params.displayResult = 'actual'
      return
    }

    if (isFunction(key)) {
      const moreParams = key(id)
      if (isPlainObject(moreParams)) {
        keys(moreParams).forEach(paramName => {
          params[paramName] = moreParams[paramName]
        })
      }
    }
  }

  // params from `assays`
  if (assays) {
    linkData.data
      .filter(it => assays.includes(it.externalId))
      .map(it => (params.assayId = params.assayId ? [...params.assayId, it.id] : [it.id]))
  }
  // params from `paramKeys`
  paramKeys.forEach(key => buildParamsFromKey(key))

  return params
}

const useGraphClickThrough = cfg => {
  const { indexBy, formatDate, clickThrough, filterBy, keyToConsume } = cfg
  const { allow, assays, baseUrl, baseAssay, keys } = clickThrough || { allow: false }

  const navigate = useNavigate()
  const [value, setValue] = useState()
  const filter = useFilterValues(baseUrl)
  const [addFilter] = useFilterUpdate()

  const { data } = useQuery(ASSAY_LIST.KEY, async () => fetchWrapperForQueries({ endpoint: ASSAY_LIST.ENDPOINT }))

  useEffect(() => {
    if (allow && data && value) {
      const moreProps = { assays, baseAssay, keys, filterBy, keyToConsume }
      const params = getQueryParameters(data, value.data, formatDate, value.id, indexBy, moreProps)
      addFilter({ ...filter, ...params }, baseUrl)

      navigate(baseUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addFilter, allow, data, navigate])

  return { setValue }
}

export default useGraphClickThrough
