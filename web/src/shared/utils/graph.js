/* eslint-disable import/prefer-default-export */

const isAllowedGroupsWithoutAssays = graphGroup =>
  ['assaysNotNeeded'].includes(graphGroup)

const getWhitelistedAssays = ({ assays, assaysFromState }) => {
  const allowed = []
  if (assays && assays.length > 0) {
    assays.map(a =>
      assaysFromState.filter(
        ({ externalId, hasResults }) =>
          externalId === a && hasResults && allowed.push(a)
      )
    )
  }
  return allowed
}

export { isAllowedGroupsWithoutAssays, getWhitelistedAssays }
