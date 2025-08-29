"use client";

interface Props {
  size?: number;            // px
  stroke?: number;          // border kalınlığı
  variant?: "default" | "light"; // koyu zemin için "light"
  className?: string;
}

export default function Spinner({
                                  size = 44,
                                  stroke = 4,
                                  variant = "default",
                                  className = "",
                                }: Props) {
  const base = variant === "light" ? "border-slate-500" : "border-slate-300";
  const top = variant === "light" ? "border-t-white" : "border-t-blue-600";

  return (
    <div
      role="status"
      aria-label="Yükleniyor"
      className={`rounded-full animate-spin ${base} ${top} ${className}`}
      style={{width: size, height: size, borderWidth: stroke}}
    >
      <span className="sr-only">Yükleniyor</span>
    </div>
  );
}
