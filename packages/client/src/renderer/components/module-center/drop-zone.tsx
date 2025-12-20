/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FolderOpen, FileArchive } from "lucide-react";
import { useTheme } from "../theme-provider";
import { getGlassStyle } from "@/utils/glass-layers";

interface DropZoneProps {
  onDrop: (files: FileList) => void;
  onBrowse: () => void;
}

export function DropZone({ onDrop, onBrowse }: DropZoneProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onDrop(e.dataTransfer.files);
      }
    },
    [onDrop]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border-2 border-dashed p-12 transition-all duration-250 ${
        isDragging
          ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
          : isDark
          ? "border-white/20 hover:border-white/30 hover:bg-white/5"
          : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <motion.div
          animate={{
            scale: isDragging ? 1.1 : 1,
            rotate: isDragging ? 5 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div
            className={`rounded-2xl p-6 ${
              isDragging
                ? "bg-blue-500/20"
                : isDark
                ? "bg-white/5"
                : "bg-slate-100"
            }`}
          >
            <Upload
              className={`h-12 w-12 ${
                isDragging
                  ? "text-blue-500"
                  : isDark
                  ? "text-white/60"
                  : "text-slate-500"
              }`}
            />
          </div>
        </motion.div>

        <div>
          <h3
            className={`mb-2 text-lg font-semibold ${
              isDark ? "text-white" : "text-slate-800"
            }`}
          >
            {isDragging ? "松开鼠标添加工具" : "拖拽工具到这里"}
          </h3>
          <p
            className={`text-sm ${
              isDark ? "text-white/60" : "text-slate-600"
            }`}
          >
            支持工具文件夹或 .zip 压缩包
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <FolderOpen
              className={isDark ? "text-white/40" : "text-slate-400"}
              size={16}
            />
            <span className={isDark ? "text-white/60" : "text-slate-500"}>
              文件夹
            </span>
          </div>
          <span className={isDark ? "text-white/40" : "text-slate-400"}>
            或
          </span>
          <div className="flex items-center gap-2 text-xs">
            <FileArchive
              className={isDark ? "text-white/40" : "text-slate-400"}
              size={16}
            />
            <span className={isDark ? "text-white/60" : "text-slate-500"}>
              ZIP 文件
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onBrowse}
          className={`mt-2 rounded-lg border px-6 py-2 text-sm font-medium transition-all duration-250 ${
            isDark
              ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
          style={getGlassStyle("BUTTON", theme)}
        >
          或点击选择文件
        </button>
      </div>
    </motion.div>
  );
}
