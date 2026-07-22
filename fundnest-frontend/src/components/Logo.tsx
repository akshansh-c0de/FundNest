import { Link } from "@tanstack/react-router";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 group">
      <span className="grid place-items-center h-8 w-8 rounded-lg btn-gradient text-sm font-bold">F</span>
      <span className="font-semibold tracking-tight text-lg">
        Fund<span className="text-gradient">Nest</span>
      </span>
    </Link>
  );
}
