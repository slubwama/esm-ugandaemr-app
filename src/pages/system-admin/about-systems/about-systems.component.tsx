import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Column,
  Grid,
  DataTable,
  DataTableSkeleton,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tile,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Pagination,
} from "@carbon/react";
import {
  ErrorState,
  UserHasAccess,
  showNotification,
  showSnackbar,
  usePagination,
} from "@openmrs/esm-framework";
import {
  updatePropertyValue,
  useGetSystemInformation,
  useRetrieveFacilityCode,
} from "./about-systems.resources";
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
  module_name: string;
  version_number: string;
}

function SystemInfoTable({ moduleInfo, error, loading }): React.JSX.Element {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState("");

  const pageSizes = [10, 20, 30, 40, 50];
  const [currentPageSize, setPageSize] = React.useState(10);

  const defineTableRows = (obj: any): ModuleInfo[] => {
    const arr: ModuleInfo[] = [];
    Object.keys(obj).forEach((key, i) => {
      if (key !== "SystemInfo.Module.repositoryPath") {
        arr.push({
          id: i,
          module_name: key,
          version_number: obj[key],
        });
      }
    });
    return arr;
  };

  const allModules = React.useMemo(
    () => defineTableRows(moduleInfo),
    [moduleInfo],
  );

  const filteredModules = React.useMemo(
    () =>
      allModules.filter((module) =>
        module.module_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.version_number.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [allModules, searchQuery],
  );

  const {
    goTo,
    results: paginatedModules,
    currentPage,
  } = usePagination(filteredModules, currentPageSize);

  const tableHeaders = [
    {
      header: t("moduleName", "Module Name"),
      key: "module_name",
    },
    {
      header: t("versionNumber", "Version Number"),
      key: "version_number",
    },
  ];

  const tableRows = React.useMemo(
    () =>
      paginatedModules.map((module: ModuleInfo) => ({
        id: String(module.id),
        module_name: module.module_name,
        version_number: module.version_number,
      })),
    [paginatedModules],
  );

  if (loading) {
    return (
      <DataTableSkeleton
        className={styles["system-info-table"]}
        role="progressbar"
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        headerTitle={t(
          "errorFetchingSytemInformation",
          "Error fetching system information",
        )}
        error={error}
      />
    );
  }

  if (moduleInfo && allModules.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>{t("noModulesFound", "No modules found")}</p>
      </div>
    );
  }

  return (
    <DataTable rows={tableRows} headers={tableHeaders}>
      {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
        <TableContainer className={styles["system-info-table"]}>
          <TableToolbar>
            <TableToolbarContent>
              <TableToolbarSearch
                value={searchQuery}
                onChange={(event, value) => setSearchQuery(value || "")}
                placeholder={t("searchModules", "Search modules...")}
              />
            </TableToolbarContent>
          </TableToolbar>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader {...getHeaderProps({ header })}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow {...getRowProps({ row })}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.id}>{cell.value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            forwardText={t("nextPage", "Next page")}
            backwardText={t("previousPage", "Previous page")}
            page={currentPage}
            pageSize={currentPageSize}
            pageSizes={pageSizes}
            totalItems={filteredModules.length}
            className={styles.pagination}
            onChange={({ pageSize, page }) => {
              if (pageSize !== currentPageSize) {
                setPageSize(pageSize);
              }
              if (page !== currentPage) {
                goTo(page);
              }
            }}
          />
        </TableContainer>
      )}
    </DataTable>
  );
}

const AboutSystemsPage = () => {
  const { t } = useTranslation();
  const [moduleInfo, setModuleInfo] = useState({});
  const [buildInfo, setBuildInfo] = useState({});
  const [emrVersion, setEMRVersion] = useState("4.0");
  const { systemInfo, isError, isLoading } = useGetSystemInformation();
  const [facilityCodeDetails, setFacilityCodeDetails] =
    useState<FacilityCodeDetails>({ value: null });
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
            subtitle: t(
              "UpdatingFacilityCode",
              `Updated Facility Code ${response?.value}`,
            ),
            autoClose: true,
          });
        },
        (error) => {
          showNotification({
            title: t(
              "errorUpdatingFacilityCode",
              "Could not update facility code",
            ),
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
      setBuildInfo(
        systemInfo["systemInfo"]["SystemInfo.title.openmrsInformation"],
      );
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
