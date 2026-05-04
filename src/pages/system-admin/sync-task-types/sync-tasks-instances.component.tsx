import React, { useState, useMemo, useCallback } from 'react';
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
  Tag,
  Pagination,
  Tile,
  Button,
  DatePicker,
  DatePickerInput,
  Select,
  SelectItem,
} from '@carbon/react';
import {
  Checkmark,
  Warning,
  ErrorFilled,
  Time,
  Renew,
  PartitionAuto,
} from '@carbon/react/icons';
import {
  ErrorState,
  usePagination,
} from '@openmrs/esm-framework';
import { useSyncTasks } from '../schedule-tasks/schedule-tasks.resources';
import { type SyncTask } from '../schedule-tasks/schedule-tasks.types';
import styles from './sync-task-types.scss';

interface SyncTasksInstancesProps {
  // Add any props if needed
}

const SyncTasksInstances: React.FC<SyncTasksInstancesProps> = () => {
  const { t } = useTranslation();
  const { syncTasks, isLoading, isError } = useSyncTasks();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSyncType, setSelectedSyncType] = useState('');
  const [tempFromDate, setTempFromDate] = useState<Date | null>(null);
  const [tempToDate, setTempToDate] = useState<Date | null>(null);
  const [selectedFromDate, setSelectedFromDate] = useState<Date | null>(null);
  const [selectedToDate, setSelectedToDate] = useState<Date | null>(null);

  // Extract unique sync task types for the filter dropdown
  const syncTaskTypes = useMemo(() => {
    const types = new Set<string>();
    syncTasks.forEach((task) => {
      if (task.syncTaskType?.name) {
        types.add(task.syncTaskType.name);
      }
    });
    return Array.from(types).sort();
  }, [syncTasks]);

  const filteredTasks = useMemo(() => {
    return syncTasks.filter((task) => {
      const matchesSearch =
        !searchQuery ||
        task.syncTask?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.syncTaskType?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.status?.toLowerCase().includes(searchQuery.toLowerCase());

      const sentDate = new Date(task.dateSent);
      const matchesSyncType = !selectedSyncType || task.syncTaskType?.name === selectedSyncType;
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
  }, [syncTasks, searchQuery, selectedSyncType, selectedFromDate, selectedToDate]);

  // Pagination setup
  const pageSizes = [10, 20, 30, 40, 50];
  const [currentPageSize, setPageSize] = useState(10);

  const {
    goTo,
    results: paginatedTasks,
    currentPage,
  } = usePagination(filteredTasks, currentPageSize);

  const handleApplyFilters = () => {
    setSelectedFromDate(tempFromDate);
    setSelectedToDate(tempToDate);
  };

  const getStatusIcon = useCallback((statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Checkmark size={16} className={styles.statusSuccess} />;
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Warning size={16} className={styles.statusWarning} />;
    } else if (statusCode >= 500) {
      return <ErrorFilled size={16} className={styles.statusError} />;
    } else {
      return <Time size={16} className={styles.statusPending} />;
    }
  }, []);

  const getStatusTag = useCallback((statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Tag type="green">{t('success', 'Success')}</Tag>;
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Tag type="red">{t('clientError', 'Client Error')}</Tag>;
    } else if (statusCode >= 500) {
      return <Tag type="red">{t('serverError', 'Server Error')}</Tag>;
    } else {
      return <Tag type="gray">{t('unknown', 'Unknown')}</Tag>;
    }
  }, [t]);

  const getActionRequiredTag = useCallback((requireAction: boolean, actionCompleted: boolean) => {
    if (actionCompleted) {
      return <Tag type="blue">{t('actionCompleted', 'Action Completed')}</Tag>;
    } else if (requireAction) {
      return <Tag type="red">{t('actionRequired', 'Action Required')}</Tag>;
    } else {
      return null;
    }
  }, [t]);

  const tableHeaders = useMemo(
    () => [
      { key: 'taskType', header: t('taskType', 'Task Type') },
      { key: 'taskName', header: t('taskName', 'Task Name') },
      { key: 'status', header: t('status', 'Status') },
      { key: 'statusCode', header: t('statusCode', 'Status Code') },
      { key: 'dateSent', header: t('dateSent', 'Date Sent') },
      { key: 'actionRequired', header: t('actionRequired', 'Action Required') },
      { key: 'details', header: t('details', 'Details') },
    ],
    [t]
  );

  const tableRows = useMemo(
    () =>
      paginatedTasks.map((task) => ({
        id: task.links.find(link => link.rel === 'self')?.uri || task.syncTask,
        taskType: task.syncTaskType?.name || '-',
        taskName: task.syncTask || '-',
        status: (
          <div className={styles.statusWithIcon}>
            {getStatusIcon(task.statusCode)}
            <span className={styles.statusText}>
              {task.status?.length > 50
                ? `${task.status.substring(0, 50)}...`
                : task.status || '-'}
            </span>
          </div>
        ),
        statusCode: getStatusTag(task.statusCode),
        dateSent: task.dateSent ? new Date(task.dateSent).toLocaleString() : '-',
        actionRequired: getActionRequiredTag(task.requireAction, task.actionCompleted),
        details: (
          <div className={styles.taskDetails}>
            <div className={styles.detailRow}>
              <strong>{t('url', 'URL')}:</strong> {task.sentToUrl || '-'}
            </div>
            <div className={styles.detailRow}>
              <strong>{t('syncType', 'Sync Type')}:</strong> {task.syncTaskType?.dataType || 'N/A'}
            </div>
          </div>
        ),
      })),
    [paginatedTasks, t, getStatusIcon, getStatusTag, getActionRequiredTag]
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const total = syncTasks.length;
    const successful = syncTasks.filter(task => task.statusCode >= 200 && task.statusCode < 300).length;
    const failed = syncTasks.filter(task => task.statusCode >= 400).length;
    const actionRequired = syncTasks.filter(task => task.requireAction && !task.actionCompleted).length;

    return { total, successful, failed, actionRequired };
  }, [syncTasks]);

  if (isLoading) {
    return <DataTableSkeleton className={styles.tasksTable} />;
  }

  if (isError) {
    return (
      <ErrorState
        headerTitle={t('errorLoadingSyncTasks', 'Error loading sync tasks')}
        error={new Error(t('failedToLoadSyncTasks', 'Failed to load sync tasks'))}
      />
    );
  }

  return (
    <div className={styles.syncTasksInstancesContent}>
      {/* Statistics Tiles */}
      <div className={styles.statsGrid}>
        <Tile className={styles.statTile}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>{t('totalSyncTasks', 'Total Sync Tasks')}</div>
        </Tile>
        <Tile className={styles.statTile}>
          <div className={styles.statValue}>{stats.successful}</div>
          <div className={styles.statLabel}>{t('successful', 'Successful')}</div>
          <Checkmark size={20} className={styles.statIconSuccess} />
        </Tile>
        <Tile className={styles.statTile}>
          <div className={styles.statValue}>{stats.failed}</div>
          <div className={styles.statLabel}>{t('failed', 'Failed')}</div>
          <ErrorFilled size={20} className={styles.statIconError} />
        </Tile>
        <Tile className={styles.statTile}>
          <div className={styles.statValue}>{stats.actionRequired}</div>
          <div className={styles.statLabel}>{t('actionRequired', 'Action Required')}</div>
          <Warning size={20} className={styles.statIconWarning} />
        </Tile>
      </div>

      {syncTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <Renew size={48} className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>{t('noSyncTasks', 'No Sync Tasks')}</h3>
          <p className={styles.emptyStateDescription}>
            {t('noSyncTasksDesc', 'No synchronization tasks found in the system')}
          </p>
        </div>
      ) : (
        <DataTable rows={tableRows} headers={tableHeaders}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer className={styles.tasksTable}>
              <TableToolbar>
                <TableToolbarContent className={styles.toolbarContent}>
                  <TableToolbarSearch
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event ? event.toString() : '')}
                    placeholder={t('searchSyncTasks', 'Search sync tasks...')}
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
                    <span className={styles.dateLabel}>{t('from', 'From')}:</span>
                    <DatePicker
                      datePickerType="single"
                      aria-label="Start date filter"
                      onChange={(date) => {
                        setTempFromDate(date.length > 0 ? date[0] : null);
                      }}
                      value={tempFromDate ? [tempFromDate] : null}
                      dateFormat="d/m/Y"
                    >
                      <DatePickerInput
                        id="date-picker-input-id-start"
                        placeholder="dd/mm/yyyy"
                        labelText=""
                        size="sm"
                      />
                    </DatePicker>
                    <span className={styles.dateLabel}>{t('to', 'To')}:</span>
                    <DatePicker
                      datePickerType="single"
                      aria-label="End date filter"
                      onChange={(date) => {
                        setTempToDate(date.length > 0 ? date[0] : null);
                      }}
                      value={tempToDate ? [tempToDate] : null}
                      dateFormat="d/m/Y"
                    >
                      <DatePickerInput
                        id="date-picker-input-id-end"
                        placeholder="dd/mm/yyyy"
                        labelText=""
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
                      <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
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
                totalItems={filteredTasks.length}
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

export default SyncTasksInstances;