let {
  superAdmin,
  clinician,
  labUser,
  regionalOfficer,
  technician,
  regionalAdmin,
} = require('../../fixtures/jobFunctionBase')
const { inventoryManager } = require('../../fixtures/jobFunctionBase')
const { aspectBeta, mergeJobFunctions } = require('../../fixtures/jobFunctionBase')

const aspectBetaEnhanced = mergeJobFunctions(aspectBeta, {
  ...aspectBeta.permissions,
  permissions: [
    {
      module: 'dashboard-v2',
      activity: 'view',
    },
  ],
  reports: ['pk_xpert_site_summary_site_wise_report'],
})

/* Temporarily disabling  */
superAdmin = removeInventoryPermissions(superAdmin)
regionalAdmin = removeInventoryPermissions(regionalAdmin)
clinician = removeInventoryPermissions(clinician)
labUser = removeInventoryPermissions(labUser)
regionalOfficer = removeInventoryPermissions(regionalOfficer)
technician = removeInventoryPermissions(technician)

function removeInventoryPermissions(jobFunction) {
  return { ...jobFunction, permissions: jobFunction.permissions.filter(p => p.module !== 'inventory') }
}

module.exports = [
  mergeJobFunctions(superAdmin, {
    permissions: [
      {
        module: 'assay',
        activity: 'edit',
      },
      {
        module: 'device',
        activity: 'edit',
      },
      {
        module: 'person',
        activity: 'edit',
      },
      {
        module: 'result',
        activity: 'edit',
      },
      {
        module: 'treatmentStatus',
        activity: 'edit',
      },
      {
        module: 'site',
        activity: 'edit',
      },
      {
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'account',
        activity: 'edit',
      },
      {
        module: 'dashboard',
        activity: 'summary',
      },
      {
        module: 'dashboard',
        activity: 'result',
      },
      {
        module: 'issue',
        activity: 'edit',
      },
      {
        module: 'task',
        activity: 'edit',
      },
      {
        module: 'operationalData',
        activity: 'view',
      },
      {
        module: 'taskMenu',
        activity: 'view',
      },
      {
        module: 'notification',
        activity: 'edit',
      },
      {
        module: 'deviceApiKey',
        activity: 'edit',
      },
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'report',
        activity: 'view',
      },
      {
        module: 'router',
        activity: 'view',
      },
      {
        module: 'dashboard-v2',
        activity: 'view',
      },
    ],
    reports: [
      'xdr_devices_summary',
      'device_summary_report',
      'pk_xpert_site_detailed_report',
      'pk_xpert_site_summary_site_wise_report',
      'unreconciled_inventory_report',
      'pk_xpert_workload_summary_report',
      'pk_annual_utilization_rates',
    ],
  }),
  mergeJobFunctions(regionalAdmin, {
    permissions: [
      {
        module: 'assay',
        activity: 'edit',
      },
      {
        module: 'device',
        activity: 'edit',
      },
      {
        module: 'person',
        activity: 'edit',
      },
      {
        module: 'result',
        activity: 'edit',
      },
      {
        module: 'treatmentStatus',
        activity: 'edit',
      },
      {
        module: 'site',
        activity: 'edit',
      },
      {
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'account',
        activity: 'edit',
      },
      {
        module: 'dashboard',
        activity: 'summary',
      },
      {
        module: 'dashboard',
        activity: 'result',
      },
      {
        module: 'issue',
        activity: 'edit',
      },
      {
        module: 'task',
        activity: 'edit',
      },
      {
        module: 'operationalData',
        activity: 'view',
      },
      {
        module: 'taskMenu',
        activity: 'view',
      },
      {
        module: 'notification',
        activity: 'edit',
      },
      {
        module: 'deviceApiKey',
        activity: 'edit',
      },
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'report',
        activity: 'view',
      },
      {
        module: 'router',
        activity: 'view',
      },
      {
        module: 'dashboard-v2',
        activity: 'view',
      },
    ],
    reports: [
      'xdr_devices_summary',
      'device_summary_report',
      'pk_xpert_site_detailed_report',
      'pk_xpert_site_summary_site_wise_report',
      'unreconciled_inventory_report',
      'pk_xpert_workload_summary_report',
      'pk_annual_utilization_rates',
    ],
  }),
  mergeJobFunctions(regionalOfficer, {
    permissions: [
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'device',
        activity: 'view',
      },
      {
        module: 'person',
        activity: 'view',
      },
      {
        module: 'result',
        activity: 'edit',
      },
      {
        module: 'treatmentStatus',
        activity: 'edit',
      },
      {
        module: 'site',
        activity: 'view',
      },
      {
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'account',
        activity: 'edit',
      },
      {
        module: 'dashboard',
        activity: 'summary',
      },
      {
        module: 'dashboard',
        activity: 'result',
      },
      {
        module: 'task',
        activity: 'edit',
      },
      {
        module: 'operationalData',
        activity: 'view',
      },
      {
        module: 'taskMenu',
        activity: 'view',
      },
      {
        module: 'notification',
        activity: 'edit',
      },
      {
        module: 'deviceApiKey',
        activity: 'edit',
      },
      {
        module: 'dashboard-v2',
        activity: 'view',
      },
    ],
    reports: [
      'xdr_devices_summary',
      'device_summary_report',
      'pk_xpert_site_detailed_report',
      'pk_xpert_site_summary_site_wise_report',
      'unreconciled_inventory_report',
      'pk_xpert_workload_summary_report',
      'pk_annual_utilization_rates',
    ],
  }),
  mergeJobFunctions(labUser, {
    permissions: [
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'person',
        activity: 'view',
      },
      {
        module: 'device',
        activity: 'view',
      },
      {
        module: 'result',
        activity: 'edit',
      },
      {
        module: 'treatmentStatus',
        activity: 'edit',
      },
      {
        module: 'site',
        activity: 'view',
      },
      {
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'account',
        activity: 'edit',
      },
      {
        module: 'dashboard',
        activity: 'summary',
      },
      {
        module: 'dashboard',
        activity: 'result',
      },
      {
        module: 'task',
        activity: 'view',
      },
      {
        module: 'operationalData',
        activity: 'view',
      },
      {
        module: 'taskMenu',
        activity: 'view',
      },
      {
        module: 'notification',
        activity: 'view',
      },
      {
        module: 'deviceApiKey',
        activity: 'view',
      },
      {
        module: 'report',
        activity: 'view',
      },
      {
        module: 'dashboard-v2',
        activity: 'view',
      },
    ],
    reports: [
      'xdr_devices_summary',
      'device_summary_report',
      'pk_xpert_site_detailed_report',
      'pk_xpert_site_summary_site_wise_report',
      'unreconciled_inventory_report',
      'pk_xpert_workload_summary_report',
      'pk_annual_utilization_rates',
    ],
  }),
  mergeJobFunctions(clinician, {
    permissions: [
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'person',
        activity: 'view',
      },
      {
        module: 'device',
        activity: 'view',
      },
      {
        module: 'result',
        activity: 'edit',
      },
      {
        module: 'treatmentStatus',
        activity: 'edit',
      },
      {
        module: 'site',
        activity: 'view',
      },
      {
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'account',
        activity: 'edit',
      },
      {
        module: 'dashboard',
        activity: 'summary',
      },
      {
        module: 'dashboard',
        activity: 'result',
      },
      {
        module: 'task',
        activity: 'view',
      },
      {
        module: 'operationalData',
        activity: 'view',
      },
      {
        module: 'taskMenu',
        activity: 'view',
      },
      {
        module: 'notification',
        activity: 'view',
      },
      {
        module: 'deviceApiKey',
        activity: 'view',
      },
      {
        module: 'report',
        activity: 'view',
      },
      {
        module: 'dashboard-v2',
        activity: 'view',
      },
    ],
    reports: [
      'xdr_devices_summary',
      'device_summary_report',
      'pk_xpert_site_detailed_report',
      'pk_xpert_site_summary_site_wise_report',
      'unreconciled_inventory_report',
      'pk_xpert_workload_summary_report',
      'pk_annual_utilization_rates',
    ],
  }),
  mergeJobFunctions(technician, {
    permissions: [
      {
        module: 'dashboard-v2',
        activity: 'view',
      },
    ],
    reports: [],
  }),
  aspectBetaEnhanced,
  inventoryManager,
]
