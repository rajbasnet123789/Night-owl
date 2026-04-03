/**
 * Client-side memory monitoring for development/debugging
 * Reports if browser memory usage gets too high
 */

export function initMemoryMonitor() {
  if (typeof window === "undefined" || !("memory" in performance)) return;

  const checkInterval = setInterval(() => {
    try {
      const mem = (performance as any).memory;
      const usedMB = mem.usedJSHeapSize / 1024 / 1024;
      const limitMB = mem.jsHeapSizeLimit / 1024 / 1024;
      const percentUsed = (usedMB / limitMB) * 100;

      // Warn if using >500MB or >80% of heap
      if (usedMB > 500 || percentUsed > 80) {
        console.warn(
          `[MEMORY WARNING] Heap: ${usedMB.toFixed(0)}MB / ${limitMB.toFixed(0)}MB (${percentUsed.toFixed(1)}%)`
        );
      }

      // Critical warning if >1GB
      if (usedMB > 1000) {
        console.error(
          `[MEMORY CRITICAL] Heap: ${usedMB.toFixed(0)}MB / ${limitMB.toFixed(0)}MB - Check for memory leaks!`
        );
      }
    } catch (err) {
      // Performance API not available
    }
  }, 5000);

  return () => clearInterval(checkInterval);
}
