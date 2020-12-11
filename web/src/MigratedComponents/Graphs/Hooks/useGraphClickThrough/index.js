import { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useQuery } from 'react-query'

import startOfMonth from 'date-fns/startOfMonth'
import endOfMonth from 'date-fns/endOfMonth'
import parse from 'date-fns/parse'
import map from 'lodash/map'
import uniqBy from 'lodash/uniqBy'
import filter from 'lodash/filter'

import ASSAY_LIST from '../../../QueryFetch/Assay'
import fetchWrapperForQueries from '../../../QueryFetch'

const CONSTS = {
  treatmentStatusId: {
    NotConfirmed: 1,
    Confirmed: 2,
  },
}

const parseDate = (date, dateFormat) => {
  const parsedDate = parse(date, dateFormat, new Date())
  return {
    minDate: startOfMonth(parsedDate).toISOString(),
    maxDate: endOfMonth(parsedDate).toISOString(),
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
  console.log(data, id)

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
          params.minDate = minDate
          params.maxDate = maxDate
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

        if (key === 'treatmentStatusId') {
          switch (id) {
            case 'NotConfirmed':
              params.treatmentStatusId = CONSTS.treatmentStatusId.NotConfirmed
              break

            case 'Confirmed':
              params.treatmentStatusId = CONSTS.treatmentStatusId.Confirmed
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
