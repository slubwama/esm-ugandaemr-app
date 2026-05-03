import React, { useState, useMemo, useEffect } from 'react';
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
  Tile,
  Pagination,
} from '@carbon/react';
import {
  ErrorState,
  useLayoutType,
  usePagination,
} from '@openmrs/esm-framework';
import {
  Renew,
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
  const isTablet = useLayoutType() === 'tablet';
  const responsiveSize = isTablet ? 'lg' : 'sm';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSyncType, setSelectedSyncType] = useState('');
  const [tempFromDate, setTempFromDate] = useState<Date | null>(null);
  const [tempToDate, setTempToDate] = useState<Date | null>(null);
  const [selectedFromDate, setSelectedFromDate] = useState<Date | null>(null);
  const [selectedToDate, setSelectedToDate] = useState<Date | null>(null);

  const pageSizes = [10, 20, 30, 40, 50];
  const [currentPageSize, setPageSize] = useState(10);

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
      case 'in_progress':
        return <Renew size={16} className={styles.statusInProgress} />;
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

  const tableRows = useMemo(
    () =>
      paginatedList.map((log: SyncTaskLog, index: number) => ({
        id: log.uuid || String(index),
        syncTaskType: log.syncTaskType?.name || '-',
        status: (
          <div className={`${styles.statusIndicator} ${styles['status_' + log.status]}`}>
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
        <DataTable
          rows={tableRows}
          headers={tableHeaders}
          size={isTablet ? 'lg' : 'sm'}
          useZebraStyles
        >
          {({ rows, headers, getTableProps, getHeaderProps }) => (
            <TableContainer className={styles.syncTable}>
              <TableToolbar>
                <TableToolbarContent className={styles.toolbarContent}>
                  <TableToolbarSearch
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event ? event.toString() : '')}
                    placeholder={t('searchLogs', 'Search logs...')}
                  />
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
                    <TableRow key={row.id}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length === 0 ? (
                <div className={styles.tileContainer}>
                  <Tile className={styles.tile}>
                    <div className={styles.tileContent}>
                      <p className={styles.content}>
                        {t('noLogsToDisplay', 'No logs to display')}
                      </p>
                      <p className={styles.helper}>
                        {t('checkFilter', 'Check the filter above')}
                      </p>
                    </div>
                  </Tile>
                </div>
              ) : null}
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
