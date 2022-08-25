const adminUserPermissions = [
  'dashboard:summary',
  'demo:edit',
  'operationalData:view',
  'reporter:edit',
  'dashboard:result',
  'assay:view',
  'result:edit',
  'inventory:edit',
  'deviceApiKey:edit',
  'issue:edit',
  'report:view',
  'dashboard:site',
  'device:edit',
  'person:edit',
  'case:edit',
  'browse:view',
  'router:view',
  'dashboard:inventory',
  'dashboard:target',
  'account:edit',
  'notification:edit',
  'treatmentStatus:edit',
  'patient:view',
  'task:view',
  'taskMenu:view',
  'dashboard:device',
  'site:edit',
  'patient:edit',
]

const bobUserPermissions = [
  'dashboard:summary',
  'reporter:edit',
  'assay:view',
  'inventory:edit',
  'dashboard:site',
  'device:edit',
  'person:edit',
  'case:edit',
  'router:view',
  'dashboard:inventory',
  'dashboard:target',
  'account:edit',
  'dashboard:report',
  'dashboard:device',
  'site:edit',
]

const cepheidUserPermissions = ['account:edit', 'assay:view', 'inventory:view', 'operationalData:view', 'site:view']

const users = [
  { key: 'admin', permissions: adminUserPermissions },
  { key: 'cepheid', permissions: cepheidUserPermissions },
  { key: 'bob', permissions: bobUserPermissions },
]

const links = [
  {
    link: '/browse/device',
    expected: {
      allowed: '/browse/device?filters=deviceType%3DCepheidGeneXpert',
      restricted: '#',
    },
    linkParams: '{"deviceType": "CepheidGeneXpert"}',
  },
  {
    link: '/operational-data#deviceStatus',
    expected: {
      allowed: '/operational-data#deviceStatus',
      restricted: '#',
    },
    linkParams: '{}',
  },
  {
    link: '/operational-data#deviceStatus',
    expected: {
      allowed: '/operational-data#deviceStatus',
      restricted: '#',
    },
    linkParams: '{}',
  },
  {
    link: '/browse/result',
    expected: {
      allowed: '/browse/result',
      restricted: '#',
    },
    linkParams: '{}',
  },
  {
    link: '/operational-data#resultsTransmitted',
    expected: {
      allowed: '/operational-data#resultsTransmitted',
      restricted: '#',
    },
    linkParams: '{}',
  },
  {
    link: '/operational-data#resultsTransmitted',
    expected: {
      allowed: '/operational-data#resultsTransmitted',
      restricted: '#',
    },
    linkParams: '{}',
  },
  {
    link: '/operational-data#resultsTransmitted',
    expected: {
      allowed: '/operational-data#resultsTransmitted',
      restricted: '#',
    },
    linkParams: '{}',
  },
  {
    link: '/browse/notification',
    expected: {
      allowed: '/browse/notification',
      restricted: '#',
    },
    linkParams: '{}',
  },
  {
    link: '/browse/notification',
    expected: {
      allowed: '/browse/notification',
      restricted: '#',
    },
    linkParams: '{}',
  },
  {
    link: '/operational-data#inventoryStatus',
    expected: {
      allowed: '/operational-data#inventoryStatus',
      restricted: '#',
    },
    linkParams: '{}',
  },
  {
    link: '/operational-data#inventoryStatus',
    expected: {
      allowed: '/operational-data#inventoryStatus',
      restricted: '#',
    },
    linkParams: '{}',
  },
  {
    link: '/browse/device',
    expected: {
      allowed: '/browse/device?filters=deviceType%3DCepheidGeneXpert',
      restricted: '#',
    },
    linkParams: '{"deviceType": "CepheidGeneXpert"}',
  },
  {
    link: '/browse/result',
    expected: {
      allowed: '/browse/result?filters=deviceType%3DCepheidGeneXpert',
      restricted: '#',
    },
    linkParams: '{"deviceType": "CepheidGeneXpert"}',
  },
  {
    link: '/browse/result',
    expected: {
      allowed: '/browse/result?filters=deviceType%3DCepheidGeneXpert%26onlyReportableResults%3Dtrue',
      restricted: '#',
    },
    linkParams: '{"deviceType": "CepheidGeneXpert", "onlyReportableResults": true}',
  },
  {
    link: '/browse/result',
    expected: {
      allowed: '/browse/result?filters=deviceType%3DCepheidGeneXpert%26workflowStatusId%3D2',
      restricted: '#',
    },
    linkParams: '{"deviceType": "CepheidGeneXpert", "workflowStatusId": 2}',
  },
  {
    link: '/browse/device',
    expected: {
      allowed: '/browse/device?filters=deviceType%3DCepheidGeneXpert',
      restricted: '#',
    },
    linkParams: '{"deviceType": "CepheidGeneXpert"}',
  },
  {
    link: '/browse/device',
    expected: {
      allowed: '/browse/device?filters=deviceType%3DCepheidGeneXpert',
      restricted: '#',
    },
    linkParams: '{"deviceType": "CepheidGeneXpert"}',
  },
  {
    link: '/browse/device',
    expected: {
      allowed: '/browse/device',
      restricted: '#',
    },
    linkParams: '{}',
  },
  {
    link: '/browse/device',
    expected: {
      allowed: '/browse/device?filters=deviceType%3DCepheidGeneXpert%26issueTypeId%3DInstrumentReplaced',
      restricted: '#',
    },
    linkParams: '{"deviceType": "CepheidGeneXpert", "issueTypeId": "InstrumentReplaced"}',
  },
  {
    link: '/browse/device',
    expected: {
      allowed: '/browse/device?filters=deviceType%3DCepheidGeneXpert%26issueTypeId%3DModuleReplaced',
      restricted: '#',
    },
    linkParams: '{"deviceType": "CepheidGeneXpert", "issueTypeId": "ModuleReplaced"}',
  },
  {
    link: '/browse/notification',
    expected: {
      allowed: '/browse/notification',
      restricted: '#',
    },
    linkParams: '{}',
  },
  {
    link: '/browse/notification',
    expected: {
      allowed: '/browse/notification',
      restricted: '#',
    },
    linkParams: '{}',
  },
  {
    link: '/browse/device',
    expected: {
      allowed: '/browse/device?filters=deviceType%3DCepheidGeneXpert%26issueTypeId%3DUnusedModules',
      restricted: '#',
    },
    linkParams: '{"deviceType": "CepheidGeneXpert", "issueTypeId": "UnusedModules"}',
  },
]

export { users, links }
