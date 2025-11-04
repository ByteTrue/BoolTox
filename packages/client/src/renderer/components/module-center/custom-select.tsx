import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useTheme } from "../theme-provider";
import { getGlassStyle } from "@/utils/glass-layers";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  icon?: ReactNode;
  placeholder?: string;
}

export function CustomSelect({
  value,
  options,
  onChange,
  icon,
  placeholder = "请选择",
}: CustomSelectProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 下拉菜单样式：降低透明度以提高可读性
  const dropdownStyle = {
    ...getGlassStyle('MODAL', theme),
    background: isDark
      ? 'rgba(15, 23, 42, 0.85)'  // 深色模式：深色背景 + 较低透明度
      : 'rgba(255, 255, 255, 0.85)',  // 浅色模式：白色背景 + 较低透明度
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    boxShadow: isDark
      ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
      : "0 8px 32px 0 rgba(101, 187, 233, 0.37)",
  };

  return (
    <div ref={selectRef} className="relative">
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-[background-color,box-shadow] duration-250 ease-swift focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
          isDark ? "text-white hover:bg-white/10" : "text-slate-800 hover:bg-white/80"
        }`}
        style={getGlassStyle('BUTTON', theme)}
      >
        {icon && <span className={isDark ? "text-white/60" : "text-slate-500"}>{icon}</span>}
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""} ${
            isDark ? "text-white/60" : "text-slate-500"
          }`}
        />
      </button>

      {/* 下拉列表 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-[9999] mt-2 min-w-[200px] rounded-2xl border"
            style={dropdownStyle}
          >
            <div className="max-h-[300px] overflow-y-auto p-2">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm transition-[background-color,box-shadow] duration-150 ease-swift ${
                      isSelected
                        ? "bg-blue-500/30 text-blue-500 font-semibold shadow-lg"
                        : isDark
                          ? "text-white hover:bg-white/15 hover:shadow-md"
                          : "text-slate-800 hover:bg-white/50 hover:shadow-md"
                    }`}
                    style={
                      !isSelected
                        ? {
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                          }
                        : undefined
                    }
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check size={16} className="animate-in fade-in zoom-in duration-200" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
