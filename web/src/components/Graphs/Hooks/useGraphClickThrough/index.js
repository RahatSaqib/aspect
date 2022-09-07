import { useState, useEffect } from 'react'
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
import { negateTimeZoneOffset } from '../../../../oldComponents/shared/DateTimeInput/utils/date'
import DATE_CONSTS from '../../../../utils/consts/DateTime/CONSTS'
import GRAPH_CONSTS from '../../../../utils/consts/Graphs/CONSTS'
import fetchWrapperForQueries from '../../../QueryFetch'
import ASSAY_LIST from '../../../QueryFetch/Assay'

const { treatmentStatus } = GRAPH_CONSTS
const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

const parseDate = (date, dateFormat) => {
  const baseFormat = 'yyyy-MM-dd'
  const parsedDate =
    dateFormat === 'MMM' ? negateTimeZoneOffset(new Date(date), baseFormat) : parse(date, dateFormat, new Date())
  return {
    [MIN_DATE]: format(startOfMonth(parsedDate), baseFormat),
    [MAX_DATE]: format(endOfMonth(parsedDate), baseFormat),
  }
}

const flattenAssaysStructure = ({ data }) => {
  const output = []
  map(data, ({ resultCategories }) => map(resultCategories, category => output.push({ ...category })))
  return uniqBy(output, 'i18nKey')
}

const assayResultCategoryIdFromKey = (data, id) => {
  return filter(data, { externalId: id })[0] || false
}

const assayIdFromKey = ({ data }, id) => {
  return filter(data, { externalId: id })[0] || false
}

const diseaseIdFromKey = ({ data }, id) => {
  return filter(data, { externalId: id })[0] || false
}

function getQueryParameters(
  linkData,
  data,
  formatDate,
  id,
  indexBy,
  { assays, baseAssay, keys: paramKeys, filterBy, keyToConsume }
) {
  const params = new URLSearchParams()
  const buildParamsFromKey = (key, params) => {
    if (key === 'indexBy' && indexBy.includes('month')) {
      const { [indexBy]: month } = data
      const { minDate, maxDate } = parseDate(month, formatDate)
      params.set(MIN_DATE, minDate)
      params.set(MAX_DATE, maxDate)
      return
    }

    if (key === 'resultCategoryId') {
      const categories = flattenAssaysStructure(linkData)

      if (filterBy?.resultCategory1) {
        const { values } = filterBy.resultCategory1
        values.forEach(externalId => {
          const { id: resultCategoryId } = assayResultCategoryIdFromKey(categories, externalId)
          params.append('resultCategoryId', resultCategoryId)
        })

        if (keyToConsume === 'resultCategory2') {
          const { id: resultCategoryId } = assayResultCategoryIdFromKey(categories, id)
          params.set('resultCategory2Id', resultCategoryId)
        }
      } else {
        const { id: resultCategoryId } = assayResultCategoryIdFromKey(categories, id)
        params.set('resultCategoryId', resultCategoryId)
      }
      return
    }

    if (key === 'assay' && !params.has('assayId')) {
      const { id: assayId } = assayIdFromKey(linkData, id)
      params.set('assayId', assayId)
      return
    }

    if (key === 'treatmentStatus') {
      switch (id) {
        case 'NotConfirmed':
          params.set('treatmentStatus', treatmentStatus.NotConfirmed)
          break

        case 'Confirmed':
          params.set('treatmentStatus', treatmentStatus.Confirmed)
          break

        default:
          break
      }
      return
    }

    if (key === 'diseaseId') {
      const { diseaseId } = diseaseIdFromKey(linkData, baseAssay)
      params.set('diseaseId', diseaseId)
      return
    }

    if (key === 'daysStockLeft') {
      params.set('daysStockLeft', id)
      return
    }

    if (key === 'consumableId') {
      params.set('consumableId', data.consumableId)
      return
    }

    if (isFunction(key)) {
      const moreParams = key(id)
      if (isPlainObject(moreParams)) {
        keys(moreParams).forEach(paramName => {
          params.set(paramName, moreParams[paramName])
        })
      }
    }
  }

  // params from `assays`
  if (assays) {
    linkData.data.filter(it => assays.includes(it.externalId)).map(it => params.append('assayId', it.id))
  }
  // params from `paramKeys`
  paramKeys.forEach(key => buildParamsFromKey(key, params))

  return params
}

const useGraphClickThrough = () => {
  const navigate = useNavigate()
  const [link, setLink] = useState(false)
  const [config, setConfig] = useState(false)
  const [linkData, setLinkData] = useState(false)

  const { isLoading, isError, error } = useQuery(
    ASSAY_LIST.KEY,
    async () => fetchWrapperForQueries({ endpoint: ASSAY_LIST.ENDPOINT }),
    { onSuccess: setLinkData }
  )

  if (isError) {
    throw new Error(error)
  }

  useEffect(() => {
    if (!isLoading && config && linkData) {
      const {
        baseConfig: {
          indexBy,
          formatDate,
          clickThrough: { allow, assays, baseUrl, baseAssay, keys } = false,
          filterBy,
          keyToConsume,
        },
        value: { data, id },
      } = config

      if (allow) {
        const params = getQueryParameters(linkData, data, formatDate, id, indexBy, {
          assays,
          baseAssay,
          keys,
          filterBy,
          keyToConsume,
        })
        setLink(`${baseUrl}${encodeURIComponent(params.toString())}`)
      }
    }
  }, [config, linkData, isLoading])

  useEffect(() => {
    if (link) {
      navigate(link)
    }
  }, [link, navigate])

  return { setConfig }
}

export default useGraphClickThrough
