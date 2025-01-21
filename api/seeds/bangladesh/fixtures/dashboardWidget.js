const { stat: dashboardWidgetsBase } = require('../../fixtures/dashboardWidgetsCommon')
const {
  stat: { totalModuleBays, activeModuleBays },
} = require('../../fixtures/dashboardWidgets')

// This widget is based on the assumption, valid only for Bangladesh, 
// that any device with at least one XDR result is a fully 10c device.
const moduleVersionWidget = {
  jobFunctions: ['all'],
  icon: 'MdViewModule',
  title: 'Module Version Widget',
  titleI18nKey: 'moduleVersionWidget',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `select modules10c+modules6c as cnt
  from (select sum(case when r.deviceId is not null then d.moduleBayCapacity else 0 end) as modules10c,
               sum(case when r.deviceId is null then d.moduleBayCapacity else 0 end)     as modules6c
        from Device                                            as d
                 join DeviceType                               as dt on d.deviceTypeId = dt.id
                 left join
             (select distinct r1.deviceId
              from Result as r1
              where r1.assayId = (select a.id
                               from Assay as a
                               where a.externalId = 'GxMtbXdr')) as r
             on d.id = r.deviceId
        where dt.externalId = 'CepheidGeneXpert') as source`,
  sortOrder: 0,
  externalId: 'ModulesVersions',
  description: 'Number of 6c and 10c modules.',
  descriptionI18nKey: 'countOf6cAnd10cModules',
  dashboards: {
    home: {},
  },
}

module.exports = {
  stat: {
    // ...dashboardWidgetsBase,
    // totalModuleBays,
    // activeModuleBays,
    moduleVersionWidget,
  },
}