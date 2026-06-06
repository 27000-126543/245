import React from 'react';
import { cn } from '../../lib/utils';

interface Column<T> {
  key: string;
  title: string;
  dataIndex: keyof T;
  render?: (value: any, record: T) => React.ReactNode;
  width?: string;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  dataSource: T[];
  rowKey?: keyof T;
  loading?: boolean;
  onRowClick?: (record: T) => void;
  className?: string;
  emptyText?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  dataSource,
  rowKey = 'id' as keyof T,
  loading = false,
  onRowClick,
  className = '',
  emptyText = '暂无数据',
}: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  'text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400',
                  col.width && `w-[${col.width}]`,
                  col.className
                )}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">加载中...</span>
                </div>
              </td>
            </tr>
          ) : dataSource.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>
              </td>
            </tr>
          ) : (
            dataSource.map(record => (
              <tr
                key={String(record[rowKey])}
                onClick={() => onRowClick?.(record)}
                className={cn(
                  'border-b border-gray-100 dark:border-gray-800 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={cn(
                      'py-3 px-4 text-sm text-gray-600 dark:text-gray-300',
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(record[col.dataIndex], record)
                      : String(record[col.dataIndex] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
