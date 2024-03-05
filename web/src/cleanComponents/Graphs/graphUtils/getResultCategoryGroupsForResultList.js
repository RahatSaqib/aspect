/**
 * This function is used to link graphs to the results list by getting the list of result category groups associated to an assay and result categories
 * @param {*} resultCategoryGroups The list of result category groups got from the useResultCategoryGroup hook
 * @param {*} assayId The assay id to be linked to the result list
 * @param {*} resultCategory1ExternalIds The array of result category 1 external ids to be linked to the result list
 * @param {*} resultCategory2ExternalIds The array of result category 2 external ids to be linked to the result list
 * @returns The array of result category groups external ids associated to the assay and result categories
 */
export const getResultCategoryGroupsForResultList = (
  resultCategoryGroups,
  assayIds = [],
  resultCategory1ExternalIds = [],
  resultCategory2ExternalIds = []
) => {
  let groups = []
  assayIds.forEach(assayId => {
    const assayGroups = resultCategoryGroups
      ?.filter(
        x =>
          x.assayId === assayId &&
          ((resultCategory1ExternalIds.length > 0 &&
            resultCategory1ExternalIds.includes(x.resultCategory1ExternalId)) ||
            (resultCategory2ExternalIds.length > 0 && resultCategory2ExternalIds.includes(x.resultCategory2ExternalId)))
      )
      .map(x => x.externalId)
    groups = [...groups, ...assayGroups]
  })
  return groups
}
