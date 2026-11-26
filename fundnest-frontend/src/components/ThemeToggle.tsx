import { Sun, Moon, Contrast } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case "dark":
        return <Moon className="h-4 w-4 text-indigo-400" />;
      case "light":
        return <Sun className="h-4 w-4 text-amber-500" />;
      default:
        return <Contrast className="h-4 w-4 text-primary" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "dark":
        return "Dark";
      case "light":
        return "Light";
      default:
        return "Mixed";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 px-2.5 flex items-center gap-2 rounded-lg border border-border/60 hover:bg-accent/40 transition-colors text-xs font-medium cursor-pointer ${className || ""}`}
          title={`Theme: ${getLabel()}`}
        >
          {getIcon()}
          <span className="hidden sm:inline capitalize">{getLabel()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 bg-popover/95 backdrop-blur-xl border border-border">
        <DropdownMenuItem
          onClick={() => setTheme("mixed")}
          className={`flex items-center gap-2 cursor-pointer text-xs ${theme === "mixed" ? "font-semibold text-primary" : ""}`}
        >
          <Contrast className="h-3.5 w-3.5" />
          <span>Mixed (Hybrid)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-2 cursor-pointer text-xs ${theme === "dark" ? "font-semibold text-primary" : ""}`}
        >
          <Moon className="h-3.5 w-3.5" />
          <span>Dark Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`flex items-center gap-2 cursor-pointer text-xs ${theme === "light" ? "font-semibold text-primary" : ""}`}
        >
          <Sun className="h-3.5 w-3.5" />
          <span>Light Mode</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
