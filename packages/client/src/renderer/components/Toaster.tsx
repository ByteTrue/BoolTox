/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

"use client";

import { useToast } from "@/contexts/toast-context";
import { AnimatePresence, motion } from "framer-motion";

// --- Toaster 主组件 ---
export function Toaster() {
  const { toasts } = useToast();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- 单个 Toast 卡片组件 ---
function ToastCard({ toast }: { toast: import("../contexts/toast-context").Toast }) {
  const { removeToast } = useToast();

  const toastStyles = {
    background: "#333",
    color: "white",
    padding: "12px 20px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: "280px",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      style={toastStyles}
      onClick={() => removeToast(toast.id)}
    >
      <span>{toast.message}</span>
    </motion.div>
  );
}
