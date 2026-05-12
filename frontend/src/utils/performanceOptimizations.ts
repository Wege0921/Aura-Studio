import React from 'react';

// Performance optimization utilities for PWA

// Lazy load components
export const lazyLoad = (importFunc: () => Promise<any>) => {
  return React.lazy(importFunc);
};

// Image optimization
export const optimizeImage = (src: string, width: number, quality: number = 80) => {
  // In production, this would use a CDN or image optimization service
  return `${src}?w=${width}&q=${quality}`;
};

// Debounce function for search and other input events
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
) => {
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
};

// Preload critical resources
export const preloadResource = (url: string, as: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  document.head.appendChild(link);
};

// Cache API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const cachedFetch = async (
  url: string,
  options: RequestInit = {},
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): Promise<Response> => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const cached = apiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await fetch(url, options);
    
    if (response.ok) {
      const data = await response.clone().json();
      apiCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl
      });
    }

    return response;
  } catch (error) {
    if (cached) {
      // Return cached data if network fails
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw error;
  }
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
};

// Detect network connection quality
export const getNetworkInfo = () => {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;

  if (connection) {
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }

  return null;
};

// Optimize images based on network quality
export const getOptimalImageQuality = () => {
  const networkInfo = getNetworkInfo();
  
  if (networkInfo) {
    if (networkInfo.saveData || networkInfo.effectiveType === 'slow-2g') {
      return 50; // Low quality for slow connections
    } else if (networkInfo.effectiveType === '2g') {
      return 60; // Medium-low quality
    } else if (networkInfo.effectiveType === '3g') {
      return 75; // Medium quality
    }
  }
  
  return 85; // High quality for fast connections
};

// Virtual scrolling helper for large lists
export const calculateVisibleItems = (
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number
) => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    totalItems
  );
  
  return {
    startIndex: Math.max(0, startIndex - 5), // Buffer
    endIndex: Math.min(totalItems, endIndex + 5), // Buffer
    offsetY: startIndex * itemHeight
  };
};

// Service Worker communication
export const sendMessageToSW = async (message: any) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      navigator.serviceWorker.controller?.postMessage(message, [messageChannel.port2]);
    });
  }
  throw new Error('Service Worker not available');
};

// Background sync registration
export const registerBackgroundSync = async (tag: string) => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    // Type assertion for background sync API
    const reg = registration as any;
    if (reg.sync) {
      return reg.sync.register(tag);
    }
  }
  return null;
};

// Push notification permission check
export const checkNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return Notification.permission;
};
