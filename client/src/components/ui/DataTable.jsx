import { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';
import { SkeletonTableRow } from '../common/Skeleton.jsx';
import EmptyState from '../common/EmptyState.jsx';

/**
 * Generic data table.
 *
 * columns: [{ key, header, render?(row), sortable?, width? }]
 * data: array of rows
 * selectable: enables checkbox column + bulk actions bar
 */
export default function DataTable({
  columns,
  data = [],
  isLoading,
  keyField = 'id',
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  sortKey,
  sortDir,
  onSortChange,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyIcon,
  onRowClick,
}) {
  const [internalSort, setInternalSort] = useState({ key: sortKey, dir: sortDir || 'asc' });
  const activeSort = onSortChange ? { key: sortKey, dir: sortDir } : internalSort;

  const toggleSort = (key) => {
    const nextDir = activeSort.key === key && activeSort.dir === 'asc' ? 'desc' : 'asc';
    if (onSortChange) onSortChange(key, nextDir);
    else setInternalSort({ key, dir: nextDir });
  };

  const allSelected = data.length > 0 && selectedKeys.length === data.length;
  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : data.map((r) => r[keyField]));
  };
  const toggleRow = (id) => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedKeys.includes(id) ? selectedKeys.filter((k) => k !== id) : [...selectedKeys, id]);
  };

  return (
    <div className="w-full overflow-x-auto rounded-card border border-border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-gray-50/60 sticky top-0">
            {selectable && (
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-border" />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className="text-left px-4 py-3 font-medium text-text-secondary whitespace-nowrap"
              >
                {col.sortable ? (
                  <button
                    className="inline-flex items-center gap-1 hover:text-text-primary"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.header}
                    {activeSort.key === col.key ? (
                      activeSort.dir === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTableRow key={i} cols={columns.length + (selectable ? 1 : 0)} />
            ))}

          {!isLoading &&
            data.map((row) => (
              <tr
                key={row[keyField]}
                onClick={() => onRowClick?.(row)}
                className={clsx('hover:bg-gray-50/70 transition-colors', onRowClick && 'cursor-pointer')}
              >
                {selectable && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedKeys.includes(row[keyField])}
                      onChange={() => toggleRow(row[keyField])}
                      className="rounded border-border"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 align-middle">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>

      {!isLoading && data.length === 0 && (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      )}
    </div>
  );
}
