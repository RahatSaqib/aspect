export const getResultCategoryGroupsForResultList = (
  resultCategoryGroups,
  assayId,
  resultCategory1ExternalIds = [],
  resultCategory2ExternalIds = []
) => {
  return resultCategoryGroups
    ?.filter(
      x =>
        x.assayId === assayId &&
        ((resultCategory1ExternalIds.length > 0 && resultCategory1ExternalIds.includes(x.resultCategory1ExternalId)) ||
          (resultCategory2ExternalIds.length > 0 && resultCategory2ExternalIds.includes(x.resultCategory2ExternalId)))
    )
    .map(x => x.externalId)
}
