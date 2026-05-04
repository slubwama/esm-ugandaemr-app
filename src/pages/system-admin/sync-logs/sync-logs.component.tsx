import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  DataTableSkeleton,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Button,
  DatePicker,
  DatePickerInput,
  Pagination,
  Select,
  SelectItem,
} from '@carbon/react';
import {
  ErrorState,
  usePagination,
} from '@openmrs/esm-framework';
import {
  Checkmark,
  Warning,
  Time,
  PartitionAuto,
} from '@carbon/react/icons';
import { useSyncLogs } from './sync-logs.resources';
import { type SyncTaskLog } from './sync-logs.types';
import styles from './sync-logs.scss';

const SyncLogsContent: React.FC = () => {
  const { t } = useTranslation();
  const { logs, isLoading, isError } = useSyncLogs();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSyncType, setSelectedSyncType] = useState('');
  const [tempFromDate, setTempFromDate] = useState<Date | null>(null);
  const [tempToDate, setTempToDate] = useState<Date | null>(null);
  const [selectedFromDate, setSelectedFromDate] = useState<Date | null>(null);
  const [selectedToDate, setSelectedToDate] = useState<Date | null>(null);

  const pageSizes = [10, 20, 30, 40, 50];
  const [currentPageSize, setPageSize] = useState(10);

  // Extract unique sync task types for the filter dropdown
  const syncTaskTypes = useMemo(() => {
    const types = new Set<string>();
    logs.forEach((log) => {
      if (log.syncTaskType?.name) {
        types.add(log.syncTaskType.name);
      }
    });
    return Array.from(types).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        !searchQuery ||
        log.syncTaskType?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.statusCode?.toLowerCase().includes(searchQuery.toLowerCase());

      const sentDate = new Date(log.dateSent);
      const matchesSyncType = !selectedSyncType || log.syncTaskType?.name === selectedSyncType;
      const matchesDateRange =
        (!selectedFromDate || sentDate >= selectedFromDate) &&
        (!selectedToDate ||
          sentDate <=
            new Date(
              selectedToDate.getFullYear(),
              selectedToDate.getMonth(),
              selectedToDate.getDate(),
              23,
              59,
              59,
              999
            ));

      return matchesSearch && matchesSyncType && matchesDateRange;
    });
  }, [logs, searchQuery, selectedSyncType, selectedFromDate, selectedToDate]);

  const {
    goTo,
    results: paginatedList,
    currentPage,
  } = usePagination(filteredLogs, currentPageSize);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <Checkmark size={16} className={styles.statusSuccess} />;
      case 'failed':
        return <Warning size={16} className={styles.statusFailed} />;
      default:
        return <Time size={16} className={styles.statusPending} />;
    }
  };

  const handleApplyFilters = () => {
    setSelectedFromDate(tempFromDate);
    setSelectedToDate(tempToDate);
  };

  const tableHeaders = useMemo(
    () => [
      {
        key: 'syncTaskType',
        header: t('syncTaskType', 'Sync Task Type'),
      },
      {
        key: 'status',
        header: t('status', 'Status'),
      },
      {
        key: 'statusCode',
        header: t('statusCode', 'Status Code'),
      },
      {
        key: 'requireAction',
        header: t('requireAction', 'Require Action'),
      },
      {
        key: 'actionCompleted',
        header: t('actionCompleted', 'Action Completed'),
      },
      {
        key: 'dateSent',
        header: t('dateSent', 'Date Sent'),
      },
    ],
    [t]
  );

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'success':
        return styles.statusSuccess;
      case 'failed':
        return styles.statusFailed;
      case 'in_progress':
        return styles.statusInProgress;
      default:
        return styles.statusPending;
    }
  };

  const tableRows = useMemo(
    () =>
      paginatedList.map((log: SyncTaskLog, index: number) => ({
        id: log.uuid || String(index),
        syncTaskType: log.syncTaskType?.name || '-',
        status: (
          <div className={`${styles.statusIndicator} ${getStatusClass(log.status)}`}>
            {getStatusIcon(log.status)}
            <span>{t(log.status || 'unknown', log.status || 'Unknown')}</span>
          </div>
        ),
        statusCode: log.statusCode || '-',
        requireAction: log.requireAction ? t('yes', 'Yes') : t('no', 'No'),
        actionCompleted: log.actionCompleted ? t('yes', 'Yes') : t('no', 'No'),
        dateSent: log.dateSent ? new Date(log.dateSent).toLocaleString() : '-',
      })),
    [paginatedList, t]
  );

  if (isLoading) {
    return <DataTableSkeleton className={styles.syncTable} />;
  }

  if (isError) {
    return (
      <ErrorState
        headerTitle={t('errorLoadingLogs', 'Error loading sync logs')}
        error={new Error(t('failedToLoadLogs', 'Failed to load sync logs'))}
      />
    );
  }

  return (
    <div className={styles.syncLogsContent}>
      {logs.length === 0 ? (
        <div className={styles.emptyState}>
          <Time size={48} className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>{t('noSyncLogs', 'No Sync Logs')}</h3>
          <p className={styles.emptyStateDescription}>
            {t('noSyncLogsDesc', 'No sync operation logs found')}
          </p>
        </div>
      ) : (
        <DataTable rows={tableRows} headers={tableHeaders}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer className={styles.syncTable}>
              <TableToolbar>
                <TableToolbarContent className={styles.toolbarContent}>
                  <TableToolbarSearch
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event ? event.toString() : '')}
                    placeholder={t('searchLogs', 'Search logs...')}
                  />
                  <Select
                    id="sync-task-type-filter"
                    labelText=""
                    defaultValue=""
                    onChange={(event) => setSelectedSyncType(event.target.value)}
                    className={styles.syncTypeFilter}
                  >
                    <SelectItem value="" text={t('allTaskTypes', 'All Task Types')}>
                      {t('allTaskTypes', 'All Task Types')}
                    </SelectItem>
                    {syncTaskTypes.map((type) => (
                      <SelectItem key={type} value={type} text={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </Select>
                  <div className={styles.datePicker}>
                    <DatePicker
                      datePickerType="range"
                      aria-label="Date Range Filter"
                      onChange={(dates) => {
                        const [from, to] = dates;
                        setTempFromDate(from);
                        setTempToDate(to);
                      }}
                      value={[tempFromDate, tempToDate]}
                      dateFormat="d/m/Y"
                    >
                      <DatePickerInput
                        id="date-picker-input-id-start"
                        placeholder="dd/mm/yyyy"
                        labelText="Start date"
                        size="sm"
                      />
                      <DatePickerInput
                        id="date-picker-input-id-end"
                        placeholder="dd/mm/yyyy"
                        labelText="End date"
                        size="sm"
                      />
                    </DatePicker>
                  </div>
                  <Button
                    kind="tertiary"
                    renderIcon={PartitionAuto}
                    onClick={handleApplyFilters}
                  >
                    {t('filter', 'Filter')}
                  </Button>
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
                forwardText="Next page"
                backwardText="Previous page"
                page={currentPage}
                pageSize={currentPageSize}
                pageSizes={pageSizes}
                totalItems={filteredLogs.length}
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
      )}
    </div>
  );
};

export default SyncLogsContent;
