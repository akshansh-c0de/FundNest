import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth, homeForRole } from "@/lib/auth";

export function PublicNav() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">How it works</a>
          <a href="#investors" className="hover:text-foreground">For investors</a>
          <a href="#founders" className="hover:text-foreground">For founders</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to={homeForRole(user.role)}>
              <Button className="btn-gradient">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
              <Link to="/register"><Button className="btn-gradient">Get started</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
