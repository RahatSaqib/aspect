const _ = require('lodash')

const superAdmin = {
  name: 'Super Admin',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'critical_errors_by_module',
    'unreconciled_inventory_report',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_activity_per_assay',
    'device_activity_percent',
    'genxpert_tb_workload_report',
    'module_swaps',
    'device_utilization',
    'all_results',
    'data_extract',
    'error_rate',
    'xpert_test_activities_report',
    'device_utilization_per_day',
    'module_activity_report',
    'do_not_use_modules_report',
    'report_custom_fields_completion',
    'inventory_log',
    'tb_workload_summary',
    'xdr_devices_summary',
    'usage_statistics_report',
    'device_and_site_summary_report',
    'result_notifications',
    'no_stock',
    'unused_modules_report',
  ],
  permissions: [
    {
      module: 'admin',
      activity: 'edit',
    },
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'device',
      activity: 'admin',
    },
    {
      module: 'case',
      activity: 'edit',
    },
    {
      module: 'demo',
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
      module: 'router',
      activity: 'view',
    },
    {
      module: 'treatmentStatus',
      activity: 'edit',
    },
    {
      module: 'site',
      activity: 'admin',
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
      activity: 'view',
    },
    {
      module: 'issue',
      activity: 'edit',
    },
    {
      module: 'reporter',
      activity: 'edit',
    },
    {
      module: 'task',
      activity: 'view',
    },
    {
      module: 'patient',
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
      module: 'report',
      activity: 'view',
    },
    {
      module: 'dashboard',
      activity: 'inventory',
    },
    {
      module: 'inventory',
      activity: 'edit',
    },
  ],
}

const regionalAdmin = {
  name: 'Regional Admin',
  reports: superAdmin.reports.filter(
    report => !['unreconciled_inventory_report', 'inventory_log', 'no_stock'].includes(report)
  ),
  permissions: superAdmin.permissions.filter(permission => !['admin', 'inventory'].includes(permission.module)),
}

const regionalOfficer = {
  name: 'Regional Officer',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'critical_errors_by_module',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'genxpert_tb_workload_report',
    'module_swaps',
    'all_results',
    'data_extract',
    'error_rate',
    'device_utilization_per_day',
    'module_activity_report',
    'do_not_use_modules_report',
    'report_custom_fields_completion',
    'tb_workload_summary',
    'xdr_devices_summary',
    'usage_statistics_report',
    'device_and_site_summary_report',
    'result_notifications',
    'unused_modules_report',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'deviceApiKey',
      activity: 'edit',
    },
    {
      module: 'notification',
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
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'device',
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'person',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
    {
      module: 'taskMenu',
      activity: 'view',
    },
    {
      module: 'assay',
      activity: 'view',
    },
  ],
}

const labUser = {
  name: 'Lab User',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'critical_errors_by_module',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'genxpert_tb_workload_report',
    'module_swaps',
    'all_results',
    'data_extract',
    'device_utilization_per_day',
    'module_activity_report',
    'do_not_use_modules_report',
    'tb_workload_summary',
    'xdr_devices_summary',
    'result_notifications',
    'unused_modules_report',
  ],
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
      activity: 'view',
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
  ],
}

const clinician = {
  name: 'Clinician',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'critical_errors_by_module',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'genxpert_tb_workload_report',
    'module_swaps',
    'all_results',
    'data_extract',
    'device_utilization_per_day',
    'module_activity_report',
    'do_not_use_modules_report',
    'tb_workload_summary',
    'xdr_devices_summary',
    'result_notifications',
    'unused_modules_report',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'case',
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
      module: 'site',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
    {
      module: 'taskMenu',
      activity: 'view',
    },
    {
      module: 'router',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'dashboard',
      activity: 'inventory',
    },
  ],
}

const deviceMaker = {
  name: 'Device Maker',
  reports: [
    'critical_errors_by_device',
    'critical_errors_by_module',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'device_utilization_per_day',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'site',
      activity: 'view',
    },
  ],
}

const ntp = {
  name: 'NTP',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'critical_errors_by_module',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'genxpert_tb_workload_report',
    'module_swaps',
    'all_results',
    'data_extract',
    'error_rate',
    'device_utilization_per_day',
    'module_activity_report',
    'do_not_use_modules_report',
    'report_custom_fields_completion',
    'tb_workload_summary',
    'xdr_devices_summary',
    'result_notifications',
    'unused_modules_report',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'result',
      activity: 'view',
    },
  ],
}

const ntpNoResults = {
  name: 'NTP - No Results',
  reports: [
    'critical_errors_by_device',
    'critical_errors_by_module',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'device_utilization_per_day',
    'result_notifications',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const technician = {
  name: 'Technician',
  reports: [
    'critical_errors_by_device',
    'critical_errors_by_module',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'device_utilization_per_day',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'device',
      activity: 'view',
    },
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'deviceApiKey',
      activity: 'edit',
    },
    {
      module: 'browse',
      activity: 'view',
    },
  ],
}

const donor = {
  name: 'Donor',
  reports: [
    'critical_errors_by_device',
    'critical_errors_by_module',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'device_utilization_per_day',
    'result_notifications',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'site',
      activity: 'view',
    },
  ],
}

const resultViewerNo = {
  name: 'Result Viewer - No',
  reports: [
    'critical_errors_by_device',
    'critical_errors_by_module',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'device_utilization_per_day',
  ],
  permissions: [
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'reporter',
      activity: 'view',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const resultViewerYes = {
  name: 'Result Viewer - Yes',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'critical_errors_by_module',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'genxpert_tb_workload_report',
    'module_swaps',
    'all_results',
    'data_extract',
    'device_utilization_per_day',
    'module_activity_report',
    'do_not_use_modules_report',
    'report_custom_fields_completion',
    'unused_modules_report',
  ],
  permissions: [
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'reporter',
      activity: 'view',
    },
    {
      module: 'result',
      activity: 'view',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const remoteHealthWorker = {
  name: 'Remote Health Worker',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'critical_errors_by_module',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'all_results',
    'data_extract',
  ],
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
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'reporter',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'dashboard',
      activity: 'inventory',
    },
  ],
}

const labManager = {
  name: 'Lab Manager',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'critical_errors_by_module',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'genxpert_tb_workload_report',
    'module_swaps',
    'all_results',
    'data_extract',
    'error_rate',
    'device_utilization_per_day',
    'module_activity_report',
    'do_not_use_modules_report',
    'report_custom_fields_completion',
    'tb_workload_summary',
    'usage_statistics_report',
    'device_and_site_summary_report',
    'result_notifications',
    'unused_modules_report',
  ],
  permissions: [
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'device',
      activity: 'admin',
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
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
  ],
}

const labSupervisor = {
  name: 'Lab Supervisor',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'critical_errors_by_module',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'genxpert_tb_workload_report',
    'module_swaps',
    'all_results',
    'data_extract',
    'error_rate',
    'device_utilization_per_day',
    'module_activity_report',
    'do_not_use_modules_report',
    'report_custom_fields_completion',
    'tb_workload_summary',
    'xdr_devices_summary',
    'usage_statistics_report',
    'device_and_site_summary_report',
    'result_notifications',
    'unused_modules_report',
  ],
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
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
  ],
}

const medTech = {
  name: 'Med Tech',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'critical_errors_by_module',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'data_extract',
    'device_utilization_per_day',
    'tb_workload_summary',
    'xdr_devices_summary',
  ],
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
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
  ],
}

const dataViewer = {
  name: 'Data Viewer',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'critical_errors_by_module',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'genxpert_tb_workload_report',
    'module_swaps',
    'all_results',
    'data_extract',
    'device_utilization_per_day',
    'module_activity_report',
    'do_not_use_modules_report',
    'tb_workload_summary',
    'xdr_devices_summary',
    'unused_modules_report',
  ],
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
      activity: 'view',
    },
    {
      module: 'treatmentStatus',
      activity: 'view',
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
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
  ],
}

const systemOne = {
  ...superAdmin,
  name: 'SystemOne',
}

const labAdmin = {
  name: 'Lab Admin',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'critical_errors_by_module',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'genxpert_tb_workload_report',
    'module_swaps',
    'all_results',
    'data_extract',
    'error_rate',
    'device_utilization_per_day',
    'module_activity_report',
    'do_not_use_modules_report',
    'report_custom_fields_completion',
    'tb_workload_summary',
    'xdr_devices_summary',
    'usage_statistics_report',
    'device_and_site_summary_report',
    'unused_modules_report',
  ],
  permissions: [
    {
      module: 'device',
      activity: 'admin',
    },
    {
      module: 'result',
      activity: 'edit',
    },
    {
      module: 'site',
      activity: 'edit',
    },
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
  ],
}

const aspectBeta = {
  ...superAdmin,
  name: 'Aspect Beta',
  permissions: [
    {
      module: 'dashboard',
      activity: 'inventory',
    },
  ],
}

const inventoryManager = {
  name: 'Inventory Manager',
  reports: ['unreconciled_inventory_report', 'inventory_log', 'no_stock'],
  permissions: [
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'inventory',
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
  ],
}

const concatUniqOrderedArray = (arr1, arr2, sortedFunction = _.identity) =>
  _.compact(_.sortBy(_.uniq(_.concat(arr1, arr2)), arr1 && arr2 ? sortedFunction : _.identity))

const mergeJobFunctions = (jf1, jf2) => {
  if (jf1.name && jf2.name && jf1.name !== jf2.name) throw new Error('The jobfunction names should be equals')
  const plainObject = _.merge({}, _.omit(jf1, ['reports', 'permissions']), _.omit(jf2, ['reports', 'permissions']))
  const reports = concatUniqOrderedArray(jf1.reports, jf2.reports)
  const permissions = concatUniqOrderedArray(jf1.permissions, jf2.permissions, obj => [obj.module, obj.activity])

  const finalJobFunction = { ...plainObject }

  if (reports.length) finalJobFunction.reports = reports
  return reduceToSinglePermissionByModule(permissions, finalJobFunction)
}

/**
 * Builds a new version of the provided job function with the addition of country specific reports
 * @param {Object} jobFunction The base job function to decorate
 * @param {Array} countryReports The country reports external ids
 * @returns The job function including the additional reports
 */
const countryReportsDecorator = (jobFunction = {}, countryReports) => ({
  ...jobFunction,
  reports: [...(jobFunction.reports || []), ...countryReports],
})

module.exports = {
  superAdmin,
  regionalOfficer,
  labUser,
  clinician,
  deviceMaker,
  ntp,
  technician,
  donor,
  regionalAdmin,
  resultViewerNo,
  resultViewerYes,
  remoteHealthWorker,
  labManager,
  labSupervisor,
  medTech,
  dataViewer,
  ntpNoResults,
  systemOne,
  labAdmin,
  aspectBeta,
  inventoryManager,
  mergeJobFunctions,
  countryReportsDecorator,
}

/**
 * Add permissions to a jobFuncion, reduced to only the one highest access per each module
 * @param { Array } permissions - Sorted by access level array of permissions
 * @param { Object } finalJobFunction - Job function object to load permissions into
 * @returns The same jobFunction received with a reduces permission list loaded.
 * @description The permissions array should be ordered by module and activity,
 * as activity cases are 'admin', 'edit', 'view', the alphabetic order matches the access level priority [sic].
 * Then in {@link https://github.com/SystemOneId/aspect/blob/a61524d54baf01a5239f641a7106489534280fd3/web/src/oldComponents/shared/requirePermissions.jsx#L103 | requirePermissions.jsx } in frontend,
 * and {@link https://github.com/SystemOneId/aspect/blob/a61524d54baf01a5239f641a7106489534280fd3/api/src/routes.js#L110 | routes.js } in backend, the system will scale required permissions for users with higher access level
 * for the module that the required one.
 */
function reduceToSinglePermissionByModule(permissions, finalJobFunction) {
  const modulesToNotReduce = ['dashboard']

  if (permissions.length)
    // Access levels (admin, edit, view) are
    finalJobFunction.permissions = _.reduce(
      permissions,
      (result, curr) => {
        const lastPermission = _.last(result)
        if (!lastPermission) result.push(curr)
        else if (modulesToNotReduce.includes(lastPermission.module) || lastPermission.module !== curr.module) {
          result.push(curr)
        }
        return result
      },
      []
    )

  return finalJobFunction
}
