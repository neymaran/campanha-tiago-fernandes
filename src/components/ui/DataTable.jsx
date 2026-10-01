import React, { useState, useMemo } from 'react';
import Skeleton from './Skeleton';
import './DataTable.css';

const DataTable = ({ columns, data, emptyMessage = 'Nenhum registro encontrado', isLoading = false, onRowClick }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  return (
    <div className="datatable-container">
      <div className="datatable-wrapper">
        <table className="datatable">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  onClick={() => handleSort(col.key)}
                  className={sortConfig.key === col.key ? 'active-sort' : ''}
                >
                  {col.label}
                  {sortConfig.key === col.key && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr key={`skeleton-${rowIdx}`}>
                  {columns.map((col, colIdx) => (
                    <td key={`skel-col-${colIdx}`} data-label={col.label}>
                      <Skeleton width="80%" height="20px" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length > 0 ? (
              sortedData.map((row, rowIdx) => (
                <tr 
                  key={rowIdx} 
                  onClick={(e) => {
                    // Evita disparar clique na linha ao clicar em ações/checkboxes
                    if (onRowClick && !e.target.closest('.action-buttons') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
                      onRowClick(row);
                    }
                  }}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} data-label={col.label}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="datatable-empty">
                  <div className="empty-state">
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
