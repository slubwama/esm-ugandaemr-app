import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  DataTable as CarbonDataTable,
  DataTableSkeleton,
  OverflowMenuItem,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  TableToolbarMenu,
  TableToolbarAction,
  Tile,
} from '@carbon/react';
import { isDesktop, useLayoutType, usePagination } from '@openmrs/esm-framework';
import { type DataTableProps } from './data-table.types';
import styles from './data-table.scss';

const SystemAdminDataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  pageSize = 10,
  searchPlaceholder,
  isLoading = false,
  error = null,
  emptyState,
  toolbarActions = [],
  exportActions = [],
  rowActions,
  onRowClick,
  renderCell,
}) => {
  const { t } = useTranslation();
  const layout = useLayoutType();
  const isTablet = useLayoutType() === 'tablet';
  const responsiveSize = isTablet ? 'lg' : 'sm';
  const pageSizes = [10, 20, 30, 40, 50];
  const [currentPageSize, setPageSize] = useState(pageSize);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();
    return data.filter((row) =>
      columns.some((column) => {
        const value = row[column.key];
        if (value === null || value === undefined) return false;
        if (typeof value === 'boolean') return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, columns]);

  const {
    goTo,
    results: paginatedData,
    currentPage,
  } = usePagination(filteredData, currentPageSize);

  const tableHeaders = useMemo(
    () => columns.map((col) => ({ key: col.key, header: col.header })),
    [columns]
  );

  const tableRows = useMemo(
    () =>
      paginatedData.map((row, index) => ({
        id: row.id || row.uuid || index,
        ...row,
      })),
    [paginatedData]
  );

  if (isLoading) {
    return <DataTableSkeleton className={styles.tableContainer} />;
  }

  if (error) {
    return (
      <div className={styles.tileContainer}>
        <Tile className={styles.tile}>
          <div className={styles.tileContent}>
            <p className={styles.content}>{error}</p>
          </div>
        </Tile>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className={styles.emptyState}>
        {emptyState.icon && <div className={styles.emptyStateIcon}>{emptyState.icon}</div>}
        <h3 className={styles.emptyStateTitle}>{emptyState.title}</h3>
        <p className={styles.emptyStateDescription}>{emptyState.description}</p>
        {toolbarActions.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            {toolbarActions.map((action, index) => (
              <Button
                key={index}
                kind={action.kind || 'primary'}
                onClick={action.onClick}
                renderIcon={action.icon}
                hasIconOnly={action.hasIconOnly}
                iconDescription={action.iconDescription}
              >
                {!action.hasIconOnly && action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <CarbonDataTable
      data-floating-menu-container
      rows={tableRows}
      headers={tableHeaders}
      overflowMenuOnHover={isDesktop(layout)}
      size={isTablet ? 'lg' : 'sm'}
      useZebraStyles
    >
      {({ rows, headers, getHeaderProps, getTableProps }) => (
        <TableContainer className={styles.tableContainer}>
          <div className={styles.toolbarWrapper}>
            <TableToolbar size={responsiveSize}>
              <TableToolbarContent className={styles.toolbarContent}>
                <TableToolbarSearch
                  className={styles.searchbox}
                  expanded
                  value={searchQuery}
                  onChange={(event, value) => setSearchQuery(value ?? '')}
                  placeholder={searchPlaceholder || t('searchThisList', 'Search this list')}
                  size={responsiveSize}
                />
                {exportActions.length > 0 && (
                  <TableToolbarMenu>
                    {exportActions
                      .filter((action) => !action.disabled)
                      .map((action, index) => (
                        <TableToolbarAction
                          key={index}
                          className={styles.toolbarAction}
                          onClick={action.onClick}
                        >
                          {action.label}
                        </TableToolbarAction>
                      ))}
                  </TableToolbarMenu>
                )}
                {toolbarActions.map((action, index) => (
                  <Button
                    key={index}
                    kind={action.kind || 'secondary'}
                    onClick={action.onClick}
                    renderIcon={action.icon}
                    hasIconOnly={action.hasIconOnly}
                    iconDescription={action.iconDescription}
                    disabled={action.disabled}
                    tooltipAlignment="end"
                  >
                    {!action.hasIconOnly && action.label}
                  </Button>
                ))}
              </TableToolbarContent>
            </TableToolbar>
          </div>
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
              {rows.map((row) => {
                const rowData = data.find((d) => (d.id || d.uuid) === row.id);
                if (!rowData) return null;
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => onRowClick && onRowClick(rowData)}
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {row.cells.map((cell) => {
                      const columnKey = cell.info?.header;
                      const cellValue = renderCell && columnKey
                        ? renderCell(columnKey, rowData)
                        : cell.value;
                      return <TableCell key={cell.id}>{cellValue}</TableCell>;
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {rows.length === 0 ? (
            <div className={styles.tileContainer}>
              <Tile className={styles.tile}>
                <div className={styles.tileContent}>
                  <p className={styles.content}>
                    {t('noMatchingResults', 'No matching results')}
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
            totalItems={filteredData.length}
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
    </CarbonDataTable>
  );
};

export default SystemAdminDataTable;
