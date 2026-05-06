import {
  defineConfigSchema,
  getAsyncLifecycle,
  getSyncLifecycle,
} from "@openmrs/esm-framework";
import { configSchema } from "./config-schema";
import { moduleName } from "./constants";

import formBuilderAppMenu from "./menu-app-items/form-builder-app-item/form-builder-app-item.component";
import systemAdminAppMenu from "./menu-app-items/system-admin-item/system-admin-item.component";
import legacyAdminAppMenu from "./menu-app-items/legacy-admin-item/legacy-admin-item.component";
import cohortBuilderAppMenu from "./menu-app-items/cohort-builder-item/cohort-builder-item.component";
import formRenderTestAppMenu from "./menu-app-items/form-render-test-item/form-render-test-item.component";
import dispensingAppMenu from "./menu-app-items/despensing-app-menu-item/dispensing-app-menu-item.component";
import bedManagementAppMenu from "./menu-app-items/bed-mgt-item/bed-mgt.component";
import suppliesDispensingAppMenu from "./menu-app-items/supply-dispensing-app-item/supply-dispensing.component";
import { createHomeDashboardLink } from "./create-dashboard-link";

import ClinicalPatientSummary from "./pages/clinical-patient-summary/clinical-patient-summary.component";
import ClinicalPatientSummaryTabsView from "./pages/clinical-patient-summary/clinical-patient-summary-tabs/clinical-patient-summary-tabs.component";
import SubjectiveFindingsView from "./pages/clinical-patient-summary/clinical-patient-summary-tabs/subjective-findings.component";
import ObjectiveFindingsView from "./pages/clinical-patient-summary/clinical-patient-summary-tabs/objective-findings.component";
import TreatmentPlanView from "./pages/clinical-patient-summary/clinical-patient-summary-tabs/treatment-plan.component";
import AssessmentView from "./pages/clinical-patient-summary/clinical-patient-summary-tabs/assessment.component";

import { DSDMCategorizationDatasource } from "./custom-expressions/custom-expressions";
import AppSearchLaunch from "./app-menu/app-search-icon/app-search-icon.component";
import NotificationsMenuButton from "./notifications-menu/notifications-menu-button.component";
import { registerCustomDataSource } from "@openmrs/esm-form-engine-lib";

export const importTranslation = require.context(
  "../translations",
  false,
  /.json$/,
  "lazy",
);

const options = {
  featureName: "esm-ugandaemr-app",
  moduleName,
};

export const formBuilderAppMenuItem = getSyncLifecycle(formBuilderAppMenu, options);
export const systemAdminAppMenuItem = getSyncLifecycle(systemAdminAppMenu, options);
export const legacyAdminAppMenuItem = getSyncLifecycle(legacyAdminAppMenu, options);
export const cohortBuilderAppMenuItem = getSyncLifecycle(cohortBuilderAppMenu, options);
export const formRenderTestAppMenuItem = getSyncLifecycle(formRenderTestAppMenu, options);
export const dispensingAppMenuItem = getSyncLifecycle(dispensingAppMenu, options);
export const bedManagementMenuItem = getSyncLifecycle(bedManagementAppMenu, options);
export const suppliesDispensingMenuItem = getSyncLifecycle(suppliesDispensingAppMenu, options);

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);

  registerCustomDataSource({
    name: "dsdm_categorization_datasource",
    load: () =>
      Promise.resolve({
        default: new DSDMCategorizationDatasource(),
      }),
  });
}

export const systemAdminPage = getAsyncLifecycle(
  () => import("./pages/system-admin/system-admin.component"),
  {
    featureName: "system admin page",
    moduleName,
  },
);

export const profileDetailModal = getAsyncLifecycle(
  () => import("./pages/system-admin/sync-profiles/profile-detail-modal.component"),
  {
    featureName: "profile detail modal",
    moduleName,
  },
);

export const taskTypeDetailModal = getAsyncLifecycle(
  () => import("./pages/system-admin/sync-task-types/tasktype-detail-modal.component"),
  {
    featureName: "task type detail modal",
    moduleName,
  },
);

export const retrieveFacilityCodeModal = getAsyncLifecycle(
  () => import("./pages/system-admin/about-systems/facility-modal.component"),
  {
    featureName: "retrieve facility code modal",
    moduleName,
  },
);

export const updateFacilityCodeAlert = getAsyncLifecycle(
  () => import("./pages/system-admin/about-systems/update-facility-code-alert"),
  {
    featureName: "update facility code alert",
    moduleName,
  },
);

export const dispensingDashboardLink = getSyncLifecycle(
  createHomeDashboardLink({
    name: "dispensing",
    slot: "dispensing-dashboard-slot",
    title: "Pharmacy",
    customSpaBasePath: `${window.spaBase}`,
  }),
  options,
);

export const clinicalPatientSummary = getSyncLifecycle(
  ClinicalPatientSummary,
  options,
);

export const ClinicalPatientSummaryTabs = getSyncLifecycle(
  ClinicalPatientSummaryTabsView,
  options,
);

export const SubjectiveFindingsComponent = getSyncLifecycle(
  SubjectiveFindingsView,
  options,
);

export const ObjectiveFindingsComponent = getSyncLifecycle(
  ObjectiveFindingsView,
  options,
);

export const TreatmentPlanComponent = getSyncLifecycle(
  TreatmentPlanView,
  options,
);

export const AssessmentComponent = getSyncLifecycle(
  AssessmentView,
  options,
);

export const appMenuButton = getSyncLifecycle(AppSearchLaunch, options);

export const notificationsMenuButton = getSyncLifecycle(
  NotificationsMenuButton,
  options,
);
