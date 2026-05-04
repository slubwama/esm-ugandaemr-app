import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  InlineLoading,
  Pagination,
  Button,
  Tag,
} from '@carbon/react';
import { Renew, Mobile } from '@carbon/react/icons';
import { showNotification } from '@openmrs/esm-framework';
import { useSmsLogs } from './sms-logs.resources';
import { type SmsLog } from './sms-logs.types';
import styles from './sms-settings.scss';

const SmsLogsContent: React.FC = () => {
  const { t } = useTranslation();
  const { fetchSmsLogs } = useSmsLogs();

  const [logs, setLogs] = useState<Array<SmsLog>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination setup
  const pageSizes = [10, 20, 30, 40, 50];
  const [currentPageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSmsLogs();
      setLogs(data);
    } catch (err) {
      setError(err.message);
      showNotification({
        title: t('errorLoadingSmsLogs', 'Error loading SMS logs'),
        kind: 'error',
        critical: true,
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchSmsLogs, t]);

  useEffect(() => {
    loadLogs();
    // Only load once on mount, not when fetchSmsLogs or t changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(logs.length / currentPageSize);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * currentPageSize;
    const endIndex = startIndex + currentPageSize;
    return logs.slice(startIndex, endIndex);
  }, [logs, currentPage, currentPageSize]);

  const tableHeaders = useMemo(
    () => [
      { key: 'mobileNo', header: t('mobileNo', 'Mobile No') },
      { key: 'message', header: t('message', 'Message') },
      { key: 'dateSent', header: t('dateSent', 'Date Sent') },
    ],
    [t]
  );

  const tableRows = useMemo(
    () =>
      paginatedLogs.map((log) => ({
        id: log.uuid || `${log.mobileNo}-${log.dateCreated}`,
        mobileNo: log.mobileNo || '-',
        message: log.message || '-',
        dateSent: log.dateCreated ? new Date(log.dateCreated).toLocaleString() : '-',
      })),
    [paginatedLogs]
  );

  if (isLoading && logs.length === 0) {
    return (
      <div className={styles.smsLogsContent}>
        <InlineLoading description={t('loadingSmsLogs', 'Loading SMS logs...')} />
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className={styles.smsLogsContent}>
        <div className={styles.errorState}>
          <Mobile size={48} className={styles.errorIcon} />
          <h3>{t('errorLoadingLogs', 'Error Loading Logs')}</h3>
          <p>{error}</p>
          <Button kind="tertiary" renderIcon={Renew} onClick={loadLogs}>
            {t('retry', 'Retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.smsLogsContent}>
      <div className={styles.logsHeader}>
        <h2 className={styles.pageTitle}>{t('sentSmsMessages', 'Sent SMS Messages')}</h2>
        <Button kind="tertiary" renderIcon={Renew} onClick={loadLogs} disabled={isLoading}>
          {isLoading ? t('loading', 'Loading...') : t('refresh', 'Refresh')}
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className={styles.emptyState}>
          <Mobile size={48} className={styles.emptyStateIcon} />
          <h3>{t('noSmsLogs', 'No SMS Logs')}</h3>
          <p>{t('noSmsLogsDesc', 'No SMS messages have been sent yet')}</p>
        </div>
      ) : (
        <>
          <DataTable rows={tableRows} headers={tableHeaders}>
            {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
              <TableContainer>
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader key={header.key} {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>

          <Pagination
            forwardText="Next page"
            backwardText="Previous page"
            page={currentPage}
            pageSize={currentPageSize}
            pageSizes={pageSizes}
            totalItems={logs.length}
            className={styles.pagination}
            onChange={({ pageSize, page }) => {
              if (pageSize !== currentPageSize) {
                setPageSize(pageSize);
              }
              if (page !== currentPage) {
                setCurrentPage(page);
              }
            }}
          />
        </>
      )}
    </div>
  );
};

export default SmsLogsContent;
