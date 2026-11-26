import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth, homeForRole } from "@/lib/auth";
import { ThemeToggle } from "./ThemeToggle";

export function PublicNav() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-card/75 border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#investors" className="hover:text-foreground transition-colors">For investors</a>
          <a href="#founders" className="hover:text-foreground transition-colors">For founders</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          {user ? (
            <Link to={homeForRole(user.role)}>
              <Button className="btn-gradient shadow-md">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
              <Link to="/register"><Button className="btn-gradient shadow-md">Get started</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
