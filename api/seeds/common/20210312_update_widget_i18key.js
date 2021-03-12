// correct value for descriptionI18nKey
module.exports = async knex => {
  await knex('DashboardWidget')
    .where('externalId', 'dashboardWidgetTitleTotalRecoveredCases')
    .andWhere('descriptionI18nKey', 'totalActiveCasesDescription')
    .update({
      descriptionI18nKey: 'totalRecoveredCasesDescription',
    })
}
