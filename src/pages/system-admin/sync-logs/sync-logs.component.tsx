import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DatePicker, DatePickerInput, Select, SelectItem, InlineLoading } from '@carbon/react';
import { Checkmark, Warning, Time, PartitionAuto } from '@carbon/react/icons';
import { useSyncLogs } from './sync-logs.resources';
import { type SyncTaskLog } from './sync-logs.types';
import SystemAdminDataTable from '../shared-components/data-table';
import styles from './sync-logs.scss';

const SyncLogsContent: React.FC = () => {
  const { t } = useTranslation();
  const { logs, isLoading, isError } = useSyncLogs();

  const [selectedSyncType, setSelectedSyncType] = useState('');
  const [tempFromDate, setTempFromDate] = useState<Date | null>(null);
  const [tempToDate, setTempToDate] = useState<Date | null>(null);
  const [selectedFromDate, setSelectedFromDate] = useState<Date | null>(null);
  const [selectedToDate, setSelectedToDate] = useState<Date | null>(null);

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

      return matchesSyncType && matchesDateRange;
    });
  }, [logs, selectedSyncType, selectedFromDate, selectedToDate]);

  const handleApplyFilters = () => {
    setSelectedFromDate(tempFromDate);
    setSelectedToDate(tempToDate);
  };

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

  const columns = [
    { key: 'syncTaskType', header: t('syncTaskType', 'Sync Task Type') },
    { key: 'status', header: t('status', 'Status') },
    { key: 'statusCode', header: t('statusCode', 'Status Code') },
    { key: 'requireAction', header: t('requireAction', 'Require Action') },
    { key: 'actionCompleted', header: t('actionCompleted', 'Action Completed') },
    { key: 'dateSent', header: t('dateSent', 'Date Sent') },
  ];

  const renderCell = (columnKey: string, row: SyncTaskLog) => {
    switch (columnKey) {
      case 'syncTaskType':
        return row.syncTaskType?.name || '-';
      case 'status':
        return (
          <div className={`${styles.statusIndicator} ${getStatusClass(row.status)}`}>
            {getStatusIcon(row.status)}
            <span>{t(row.status || 'unknown', row.status || 'Unknown')}</span>
          </div>
        );
      case 'statusCode':
        return row.statusCode || '-';
      case 'requireAction':
        return row.requireAction ? t('yes', 'Yes') : t('no', 'No');
      case 'actionCompleted':
        return row.actionCompleted ? t('yes', 'Yes') : t('no', 'No');
      case 'dateSent':
        return row.dateSent ? new Date(row.dateSent).toLocaleString() : '-';
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.syncLogsContent}>
        <InlineLoading description={t('loadingSyncLogs', 'Loading sync logs...')} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.syncLogsContent}>
        <div className={styles.errorState}>
          <h3>{t('errorLoadingLogs', 'Error loading sync logs')}</h3>
          <p>{t('failedToLoadLogs', 'Failed to load sync logs')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.syncLogsContent}>
      <div className={styles.filterSection}>
        <div className={styles.filterRow}>
          <Select
            id="sync-task-type-filter"
            labelText={t('syncTaskType', 'Sync Task Type')}
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
              dateFormat="d/m/Y">
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
          <button className={styles.filterButton} type="button" onClick={handleApplyFilters}>
            <PartitionAuto size={16} />
            {t('filter', 'Filter')}
          </button>
        </div>
      </div>

      <SystemAdminDataTable
        columns={columns}
        data={filteredLogs}
        searchPlaceholder={t('searchLogs', 'Search logs...')}
        emptyState={{
          title: t('noSyncLogs', 'No Sync Logs'),
          description: t('noSyncLogsDesc', 'No sync operation logs found'),
          icon: <Time size={48} />,
        }}
        renderCell={renderCell}
      />
    </div>
  );
};

export default SyncLogsContent;
