import React, { useState, useEffect, useRef, useMemo } from 'react';
import { throttle, calculateVisibleItems } from '../../utils/performanceOptimizations';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

function VirtualList<T>({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem, 
  overscan = 5 
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const { startIndex, endIndex, offsetY } = useMemo(
    () => calculateVisibleItems(scrollTop, containerHeight, itemHeight, items.length),
    [scrollTop, containerHeight, itemHeight, items.length]
  );

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const handleScroll = useMemo(
    () => throttle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, 16), // 60fps
    []
  );

  return (
    <div
      ref={scrollElementRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
      className="virtual-list"
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
              className="virtual-list-item"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualList;
