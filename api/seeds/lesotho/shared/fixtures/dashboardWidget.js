module.exports = {
  stat: [
    {
      jobFunctions: ['all'],
      icon: 'MdPermIdentity',
      title: 'Contacts',
      titleI18nKey: 'personTitle',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator:
        'SELECT COUNT(pe.id) AS cnt FROM Person as pe INNER JOIN Partner as pa ON pe.partnerId IS NULL OR pe.partnerId = pa.id LEFT OUTER JOIN Geography AS g ON pe.geographyId = g.id',

      link: '/browse/person',
      sortOrder: 3,
      externalId: 'personTitle',
      description: 'The number of contacts in the system.',
      descriptionI18nKey: 'personDescription',
      dashboards: {
        home: {},
      },
    },
  ],
}
