import type React from 'react';
import type { CarbonIconType } from '@carbon/react/icons';

export interface DataTableColumn {
  key: string;
  header: string | React.ReactNode;
}

export interface DataTableAction {
  itemText: string;
  onClick: (row: any) => void;
  isDelete?: boolean;
  disabled?: boolean;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  data: Array<any>;
  pageSize?: number;
  searchPlaceholder?: string;
  isLoading?: boolean;
  error?: string | null;
  emptyState?: {
    title: string;
    description: string;
    icon?: React.ReactNode;
  };
  toolbarActions?: Array<{
    label: string;
    onClick: () => void | Promise<void>;
    icon?: CarbonIconType | React.ComponentType<any>;
    hasIconOnly?: boolean;
    iconDescription?: string;
    kind?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
    disabled?: boolean;
  }>;
  exportActions?: Array<{
    label: string;
    onClick: () => void | Promise<void>;
    disabled?: boolean;
  }>;
  rowActions?: (row: any) => DataTableAction[];
  onRowClick?: (row: any) => void;
  renderCell?: (columnKey: string, row: any) => React.ReactNode;
}
