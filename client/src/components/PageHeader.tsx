import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, Settings, LogOut, LayoutDashboard, User, Menu } from "lucide-react";
import { getLoginUrl } from "@/const";

interface PageHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
  // SEO Meta-Tags
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
}

export function PageHeader({ title, showBackButton, backUrl, metaDescription, metaKeywords, canonicalUrl }: PageHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // SEO Meta-Tags dynamisch setzen
  React.useEffect(() => {
    // Title
    if (title) {
      document.title = `${title} | KI2GO - Wir liefern Ergebnisse`;
    }
    
    // Meta Description
    let metaDescTag = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      if (!metaDescTag) {
        metaDescTag = document.createElement('meta');
        metaDescTag.setAttribute('name', 'description');
        document.head.appendChild(metaDescTag);
      }
      metaDescTag.setAttribute('content', metaDescription);
    }
    
    // Meta Keywords
    let metaKeywordsTag = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && metaKeywords.length > 0) {
      if (!metaKeywordsTag) {
        metaKeywordsTag = document.createElement('meta');
        metaKeywordsTag.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywordsTag);
      }
      metaKeywordsTag.setAttribute('content', metaKeywords.join(', '));
    }
    
    // Canonical URL
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (canonicalUrl) {
      if (!canonicalTag) {
        canonicalTag = document.createElement('link');
        canonicalTag.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalTag);
      }
      canonicalTag.setAttribute('href', canonicalUrl);
    }
    
    // Cleanup
    return () => {
      // Reset title on unmount
      document.title = 'KI2GO - Wir liefern Ergebnisse';
    };
  }, [title, metaDescription, metaKeywords, canonicalUrl]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Left: Logo/Home + Title */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Home className="h-4 w-4 text-primary" />
            </div>
            <span className="hidden sm:inline">KI2GO</span>
          </Link>
          
          {title && (
            <>
              <span className="text-muted-foreground hidden sm:inline">/</span>
              <span className="font-medium hidden sm:inline">{title}</span>
            </>
          )}
        </div>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/aufgaben" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location === "/aufgaben" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Aufgaben
          </Link>
          <Link 
            href="/#anfrage" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Anfrage stellen
          </Link>
          {user?.role === "owner" && (
            <Link 
              href="/admin" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.startsWith("/admin") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Right: User Menu */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-0.5 leading-none">
                    <p className="font-medium text-sm">{user.name || "Benutzer"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/")}>
                  <Home className="mr-2 h-4 w-4" />
                  Startseite
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/aufgaben")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Meine Aufgaben
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </DropdownMenuItem>
                {user.role === "owner" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Admin-Bereich
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <a href={getLoginUrl()}>Anmelden</a>
              </Button>
              <Button asChild>
                <a href={getLoginUrl()}>Kostenlos starten</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default PageHeader;
