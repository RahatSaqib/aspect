import { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useQuery } from 'react-query'

import startOfMonth from 'date-fns/startOfMonth'
import endOfMonth from 'date-fns/endOfMonth'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import map from 'lodash/map'
import uniqBy from 'lodash/uniqBy'
import filter from 'lodash/filter'

import ASSAY_LIST from '../../../QueryFetch/Assay'
import fetchWrapperForQueries from '../../../QueryFetch'
import GRAPH_CONSTS from '../../../../globals/consts/Graphs/CONSTS'
import DATE_CONSTS from '../../../../globals/consts/DateTime/CONSTS'

const { treatmentStatus } = GRAPH_CONSTS
const {
  DATE_RANGE_KEYS: { MIN_DATE, MAX_DATE },
} = DATE_CONSTS

const parseDate = (date, dateFormat) => {
  const baseFormat = 'yyyy-MM-dd'
  const parsedDate = parse(date, dateFormat, new Date())
  return {
    [MIN_DATE]: format(startOfMonth(parsedDate), baseFormat),
    [MAX_DATE]: format(endOfMonth(parsedDate), baseFormat),
  }
}

const flattenAssaysStructure = async ({ data }) => {
  const output = []
  map(data, ({ resultCategories }) =>
    map(resultCategories, category => output.push({ ...category }))
  )
  return uniqBy(output, 'i18nKey')
}

const assayResultCategoryIdFromKey = async (data, id) => {
  return filter(data, { externalId: id })[0] || false
}

const assayIdFromKey = async ({ data }, id) => {
  return filter(data, { name: id })[0] || false
}

const diseaseIdFromKey = async ({ data }, id) => {
  return filter(data, { externalId: id })[0] || false
}

const useGraphClickThrough = () => {
  const { push } = useHistory()
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
    async function buildLink(
      linkData,
      data,
      formatDate,
      id,
      indexBy,
      baseUrl,
      baseAssay,
      keys
    ) {
      const params = {}
      const buildParamsFromKey = async (key, params) => {
        if (key === 'indexBy' && indexBy.includes('month')) {
          const { [indexBy]: month } = data
          const { minDate, maxDate } = parseDate(month, formatDate)
          params[MIN_DATE] = minDate
          params[MAX_DATE] = maxDate
        }

        if (key === 'resultCategoryId') {
          const categories = await flattenAssaysStructure(linkData)
          const { id: resultCategoryId } = await assayResultCategoryIdFromKey(
            categories,
            id
          )
          params.resultCategoryId = resultCategoryId
          params.assayOverride = id
        }

        if (key === 'assay') {
          const { id: assayId } = await assayIdFromKey(linkData, id)
          params.assayId = assayId
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
        }

        if (key === 'diseaseId') {
          const { diseaseId } = await diseaseIdFromKey(linkData, baseAssay)
          params.diseaseId = diseaseId
        }
      }
      await Promise.all(map(keys, key => buildParamsFromKey(key, params)))
      setLink(
        `${baseUrl}${encodeURIComponent(
          new URLSearchParams(params).toString()
        )}`
      )
    }

    if (!isLoading && config && linkData) {
      const {
        baseConfig: {
          indexBy,
          formatDate,
          clickThrough: { allow, baseUrl, baseAssay, keys } = false,
        },
        value: { data, id },
      } = config

      if (allow) {
        buildLink(
          linkData,
          data,
          formatDate,
          id,
          indexBy,
          baseUrl,
          baseAssay,
          keys
        )
      }
    }
  }, [config, linkData, isLoading, push])

  useEffect(() => {
    if (link) {
      push(link)
    }
  }, [link, push])

  return { setConfig }
}

export default useGraphClickThrough
