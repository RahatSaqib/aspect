const _ = require('lodash')

async function updateDashboardWidgetQueries(knex) {
  // ---------------------------------------
  // SD-621
  // Ensure next targets do not count tests already counted in earlier targets
  //
  // see section "Testing Targets" in
  // https://kb.systemone.id/display/AS/PRD+-+Action+Dashboard#app-switcher where
  // last option says:
  // "The system shall allow some target groups to be mutually exclusive with
  // rules evaluated in order, stopping at the first matching class."
  // ---------------------------------------

  const base = `SELECT IFNULL(count(r.id), 0) as cnt
  FROM Result as r
    INNER JOIN Device as d on d.id = r.deviceId
    INNER JOIN Site as s on s.id = d.siteId
    INNER JOIN Partner p on s.partnerId = p.id
    LEFT OUTER JOIN Geography as g on s.geographyId = g.id
    INNER JOIN Assay as a on a.id = r.assayId
  `
  const inAssays = "a.externalId IN ('GxMtbRif', 'GxMtbRifUltra')"
  const hivYes = "IFNULL(patientData ->> '$.hivStatus', '') = 'HIV Positive'"
  const hivNo = "IFNULL(patientData ->> '$.hivStatus', '') != 'HIV Positive'"
  const mdrYes =
    "IFNULL(patientData ->> '$.previouslyTreated', '') IN ('Yes', 'true')"
  const mdrNo =
    "IFNULL(patientData ->> '$.previouslyTreated', '') NOT IN ('Yes', 'true')"
  const smearYes =
    "IFNULL(patientData ->> '$.microscopyResult', '') LIKE '%Positive'"

  const items = [
    // a category "Total" ("All Tests") shall, in parallel, monitor progress toward an overall testing goal.
    {
      titleI18nKey: 'dashboardWidgetTitleTotal',
      sqlForIndicator: `${base}`, // WHERE ${inAssays}`,
    },
    // For the Myanmar Dashboard, the categories are "Child," "HIV+", "MDR+", and "Smear+", and are tested in that order.
    // --------
    // "Child" target is removed - see SD-761
    // --------
    // order of how Myanmar checks the KPI (see SD-621 - https://ops.systemone.id/browse/SD-621?focusedCommentId=18533&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-18533):
    // MDR should include all MDR (regardless of HIV/smear)
    // HIV = HIV (not mdr) and any smear
    // Smear positive = not HIV/Not MDR
    // --------
    {
      // MDR-TB
      titleI18nKey: 'dashboardWidgetTitleMDRTB',
      sqlForIndicator: `${base} WHERE ${inAssays} AND ${mdrYes}`,
    },
    {
      // HIV+
      titleI18nKey: 'dashboardWidgetTitleHIV',
      sqlForIndicator: `${base} WHERE ${inAssays} AND ${mdrNo} AND ${hivYes}`,
    },
    {
      // Smear+
      titleI18nKey: 'dashboardWidgetTitleSmear',
      sqlForIndicator: `${base} WHERE ${inAssays} AND ${mdrNo} AND ${hivNo} AND ${smearYes}`,
    },
  ]

  //
  await Promise.all(
    _.map(items, async ({ titleI18nKey, sqlForIndicator }) => {
      await knex('DashboardWidget')
        .where({ titleI18nKey })
        .update({ sqlForIndicator })
    })
  )
}

module.exports = {
  updateDashboardWidgetQueries,
}
