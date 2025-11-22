import React, { useEffect, useRef } from 'react';

interface PluginPlaceholderProps {
  pluginId: string;
  className?: string;
}

// Define window.ipc type if not globally available
declare global {
  interface Window {
    ipc: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, listener: (...args: any[]) => void) => void;
      off: (channel: string, listener: (...args: any[]) => void) => void;
    };
  }
}

export const PluginPlaceholder: React.FC<PluginPlaceholderProps> = ({ pluginId, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    // Start the plugin when component mounts
    console.log(`[PluginPlaceholder] Starting plugin ${pluginId}`);
    window.ipc.invoke('plugin:start', pluginId).catch(console.error);

    return () => {
      mounted = false;
      // Stop the plugin when component unmounts
      console.log(`[PluginPlaceholder] Stopping plugin ${pluginId}`);
      window.ipc.invoke('plugin:stop', pluginId).catch(console.error);
    };
  }, [pluginId]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rect = entry.target.getBoundingClientRect();
        console.log('[PluginPlaceholder] Resize:', rect);
        
        const bounds = {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
        
        if (bounds.width > 0 && bounds.height > 0) {
            window.ipc.invoke('plugin:resize', pluginId, bounds).catch(console.error);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [pluginId]);

  return <div ref={containerRef} className={`w-full h-full bg-gray-100/50 ${className}`} />;
};
