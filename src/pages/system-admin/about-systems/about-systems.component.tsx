import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Column,
  Grid,
  Tile,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tag,
  InlineLoading,
} from "@carbon/react";
import {
  ErrorState,
  UserHasAccess,
  showNotification,
  showSnackbar,
} from "@openmrs/esm-framework";
import {
  updatePropertyValue,
  useGetSystemInformation,
  useRetrieveFacilityCode,
  useGetModules,
} from "./about-systems.resources";
import SystemAdminDataTable from "../shared-components/data-table";
import styles from "./about-systems.scss";
import coatOfArms from "../../../images/coat_of_arms.png";
import UpdateFacilityCode from "./update-facility-code-button.component";
import {
  NHFRIdentifier,
  PRIVILEGE_UPDATE_FACILITY_CODE,
  systemInstallationDate,
  systemInstallationTime,
} from "../../../constants";

interface FacilityCodeDetails {
  value?: string;
}

const OverallSystemInfo = ({
  buildInfo,
  emrVersion,
  facilityCodeDetails,
  setFacilityCodeDetails,
}) => {
  const { t } = useTranslation();
  const buildDateTime =
    buildInfo && buildInfo[`${systemInstallationDate}`]
      ? `${buildInfo[`${systemInstallationDate}`]}, ${buildInfo[`${systemInstallationTime}`]}`
      : "-";

  return (
    <Grid className={styles["overall-info-card"]}>
      <Column className={styles["info-title"]}>
        <Column>
          <p>{t("governmentOfUganda", "Government of Uganda")}</p>
          <p>{t("ministryOfHealth", "Ministry of Health")}</p>
        </Column>
        <Column>
          <img src={coatOfArms} alt="Govt of Uganda Coat of Arms" height={50} />
        </Column>
      </Column>
      <Column className={styles["info-body"]}>
        <span>Version</span>
        <span>{emrVersion}</span>
        <span>SPA Version</span>
        <span>v5.1.0</span>
        <span>Build date time</span>
        <span>{buildDateTime}</span>
        <span>Facility code</span>
        <span>
          {facilityCodeDetails.value === null ? "-" : facilityCodeDetails.value}
        </span>
      </Column>
      <div className={styles.divUpdateContent}>
        <UserHasAccess privilege={PRIVILEGE_UPDATE_FACILITY_CODE}>
          <Column>
            <UpdateFacilityCode
              facilityCodeDetails={facilityCodeDetails}
              setFacilityCodeDetails={setFacilityCodeDetails}
            />
          </Column>
        </UserHasAccess>
      </div>
    </Grid>
  );
};

interface ModuleInfo {
  id: number;
  uuid: string;
  module_name: string;
  version_number: string;
  started: boolean;
  startup_error_message?: string;
  require_openmrs_version?: string;
  aware_of_modules?: string[];
}

function SystemInfoTable({ moduleInfo, error, loading }: {
  moduleInfo: any;
  error: any;
  loading: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();

  // Use the modules API
  const { modules: detailedModules, isLoading: modulesLoading, isError: modulesError } = useGetModules();

  const allModules = useMemo(() => {
    if (detailedModules && detailedModules.length > 0) {
      return detailedModules.map((mod, i) => ({
        id: i,
        uuid: mod.uuid,
        module_name: mod.name || mod.moduleId,
        version_number: mod.version,
        started: mod.started,
        startup_error_message: mod.startupErrorMessage,
        require_openmrs_version: mod.requireOpenmrsVersion,
        aware_of_modules: mod.awareOfModules,
      }));
    }
    // Fallback to system info if modules API doesn't return data
    const arr: ModuleInfo[] = [];
    if (moduleInfo) {
      Object.keys(moduleInfo).forEach((key, i) => {
        if (key !== "SystemInfo.Module.repositoryPath") {
          arr.push({
            id: i,
            uuid: '',
            module_name: key,
            version_number: moduleInfo[key],
            started: true,
            startup_error_message: undefined,
            require_openmrs_version: undefined,
            aware_of_modules: undefined,
          });
        }
      });
    }
    return arr;
  }, [detailedModules, moduleInfo]);

  const columns = [
    { key: 'module_name', header: t('moduleName', 'Module Name') },
    { key: 'version_number', header: t('versionNumber', 'Version Number') },
    { key: 'started', header: t('started', 'Started') },
    { key: 'status_details', header: t('statusDetails', 'Status Details') },
  ];

  const renderCell = (columnKey: string, row: ModuleInfo) => {
    switch (columnKey) {
      case 'module_name':
        return (
          <div className={styles.moduleNameContainer}>
            <span className={styles.moduleName}>{row.module_name}</span>
            {row.uuid && (
              <span className={styles.moduleUuid}>{t('uuid', 'UUID')}: {row.uuid}</span>
            )}
          </div>
        );
      case 'started':
        return row.started ? (
          <Tag type="green">{t('yes', 'Yes')}</Tag>
        ) : (
          <Tag type="red">{t('no', 'No')}</Tag>
        );
      case 'status_details':
        return (
          <div className={styles.statusDetails}>
            {row.startup_error_message && (
              <div className={styles.errorDetail}>
                <strong>{t('error', 'Error')}:</strong> {row.startup_error_message}
              </div>
            )}
            {row.require_openmrs_version && (
              <div className={styles.versionDetail}>
                <strong>{t('requires', 'Requires')}:</strong> {row.require_openmrs_version}
              </div>
            )}
            {!row.startup_error_message && !row.require_openmrs_version && (
              <span className={styles.noDetails}>-</span>
            )}
          </div>
        );
      default:
        return row[columnKey];
    }
  };

  const isLoadingData = loading || modulesLoading;
  const hasError = error || modulesError;

  if (isLoadingData) {
    return (
      <div className={styles.loadingContainer}>
        <InlineLoading description={t('loadingModules', 'Loading modules...')} />
      </div>
    );
  }

  if (hasError) {
    return (
      <ErrorState
        headerTitle={t('errorFetchingSytemInformation', 'Error fetching system information')}
        error={hasError}
      />
    );
  }

  if (allModules.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>{t('noModulesFound', 'No modules found')}</p>
      </div>
    );
  }

  return (
    <SystemAdminDataTable
      columns={columns}
      data={allModules}
      searchPlaceholder={t('searchModules', 'Search modules...')}
      renderCell={renderCell}
    />
  );
}

const AboutSystemsPage = () => {
  const { t } = useTranslation();
  const [moduleInfo, setModuleInfo] = useState({});
  const [buildInfo, setBuildInfo] = useState({});
  const [emrVersion, setEMRVersion] = useState("4.0");
  const { systemInfo, isError, isLoading } = useGetSystemInformation();
  const [facilityCodeDetails, setFacilityCodeDetails] = useState<FacilityCodeDetails>({ value: null });
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  const { facilityIds } = useRetrieveFacilityCode();

  useEffect(() => {
    if (facilityIds && facilityIds.length) {
      setFacilityCodeDetails({
        value: facilityIds[0]["value"],
      });
    }
  }, [facilityIds]);

  const updateFacilityCode = useCallback(() => {
    if (facilityCodeDetails.value) {
      updatePropertyValue(`${NHFRIdentifier}`, facilityCodeDetails.value).then(
        (response) => {
          showSnackbar({
            isLowContrast: true,
            kind: "success",
            title: t("Updating Facility Code", "Updating Facility Code"),
            subtitle: t("UpdatingFacilityCode", `Updated Facility Code ${response?.value}`),
            autoClose: true,
          });
        },
        (error) => {
          showNotification({
            title: t("errorUpdatingFacilityCode", "Could not update facility code"),
            kind: "error",
            critical: true,
            description: error?.message,
            millis: 3000,
          });
        },
      );
    }
  }, [facilityCodeDetails.value, t]);

  useEffect(() => {
    if (facilityCodeDetails.value) {
      updateFacilityCode();
    }
  }, [facilityCodeDetails.value, updateFacilityCode]);

  useEffect(() => {
    if (systemInfo) {
      const moduleInformation = {
        ...systemInfo["systemInfo"]["SystemInfo.title.moduleInformation"],
      };
      delete moduleInformation["SystemInfo.Module.repositoryPath"];
      setModuleInfo(moduleInformation);
      setBuildInfo(systemInfo["systemInfo"]["SystemInfo.title.openmrsInformation"]);
    }
  }, [systemInfo]);

  useEffect(() => {
    if (moduleInfo) {
      setEMRVersion(moduleInfo["UgandaEMR"]);
    }
  }, [moduleInfo]);

  return (
    <Tabs selectedIndex={selectedTabIndex} onChange={({ selectedIndex }) => setSelectedTabIndex(selectedIndex)}>
      <TabList aria-label="About system tabs">
        <Tab>{t("systemInfo", "System Information")}</Tab>
        <Tab>{t("modules", "Modules")}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <Tile>
            <OverallSystemInfo
              buildInfo={buildInfo}
              emrVersion={emrVersion}
              facilityCodeDetails={facilityCodeDetails}
              setFacilityCodeDetails={setFacilityCodeDetails}
            />
          </Tile>
        </TabPanel>
        <TabPanel>
          <Tile>
            <SystemInfoTable
              moduleInfo={moduleInfo}
              error={isError}
              loading={isLoading}
            />
          </Tile>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default AboutSystemsPage;
