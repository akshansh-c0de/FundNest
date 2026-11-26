import { Link } from "@tanstack/react-router";

export function Logo({ to = "/", className = "" }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={`flex items-center gap-2.5 group ${className}`}>
      <span className="grid place-items-center h-8 w-8 rounded-xl btn-gradient text-sm font-bold text-white shadow-sm group-hover:scale-105 transition-transform">
        F
      </span>
      <span className="font-bold tracking-tight text-lg leading-none text-inherit">
        Fund<span className="text-gradient">Nest</span>
      </span>
    </Link>
  );
}
