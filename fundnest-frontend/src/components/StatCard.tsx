import { ReactNode } from "react";

export function StatCard({
  label, value, change, icon, accent,
}: {
  label: string;
  value: ReactNode;
  change?: string;
  icon?: ReactNode;
  accent?: "primary" | "success" | "warning" | "destructive";
}) {
  const accentClass =
    accent === "success" ? "text-success" :
    accent === "warning" ? "text-warning" :
    accent === "destructive" ? "text-destructive" : "text-gradient";
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className={`text-2xl font-semibold ${accentClass}`}>{value}</div>
      {change && <p className="text-xs text-muted-foreground">{change}</p>}
    </div>
  );
}
