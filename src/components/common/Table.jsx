import React from 'react';
import Spinner from './Spinner';

export const Table = ({
  columns = [],
  data = [],
  loading = false,
  keyField = 'id',
  emptyMessage = 'No data available',
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto rounded-xl border border-secondary-200 bg-white ${className}`}>
      <table className="min-w-full divide-y divide-secondary-200 text-left text-sm">
        <thead className="bg-secondary-50 text-xs font-semibold text-secondary-700 uppercase tracking-wider select-none">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-3.5 font-semibold">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody className="divide-y divide-secondary-100 bg-white text-secondary-600">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Spinner size="md" />
                  <span className="text-sm text-secondary-400">Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-secondary-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr 
                key={row[keyField] || index} 
                className="hover:bg-secondary-50/50 transition-premium"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                    {col.render ? col.render(row, index) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
