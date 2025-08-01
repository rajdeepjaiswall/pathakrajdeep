import { useState, useEffect, useMemo } from 'react';

interface UseVirtualGridOptions {
  itemHeight: number;
  containerHeight: number;
  itemsPerRow: number;
  overscan?: number;
}

export function useVirtualGrid<T>(
  items: T[], 
  { itemHeight, containerHeight, itemsPerRow, overscan = 5 }: UseVirtualGridOptions
) {
  const [scrollTop, setScrollTop] = useState(0);

  const rowHeight = itemHeight;
  const totalRows = Math.ceil(items.length / itemsPerRow);
  const totalHeight = totalRows * rowHeight;

  const visibleRows = Math.ceil(containerHeight / rowHeight);
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRow = Math.min(totalRows, startRow + visibleRows + overscan * 2);

  const visibleItems = useMemo(() => {
    const startIndex = startRow * itemsPerRow;
    const endIndex = Math.min(items.length, endRow * itemsPerRow);
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      row: Math.floor((startIndex + index) / itemsPerRow),
      col: (startIndex + index) % itemsPerRow
    }));
  }, [items, startRow, endRow, itemsPerRow]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    startRow,
    endRow
  };
}