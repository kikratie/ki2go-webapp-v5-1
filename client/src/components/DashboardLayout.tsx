import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, LogOut, PanelLeft, FileText, History, 
  Settings, Target, BarChart3, Users, Shield, Home, FolderOpen,
  Building2, UserCog, Activity, Database, Layers, Tags, Euro,
  ChevronDown, ChevronRight, Zap, Wand2, Sparkles, FileSearch,
  Inbox, Eye, ClipboardList, DollarSign, GitPullRequest, Factory,
  FlaskConical as Beaker, FlaskConical, Square
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

// ============================================
// NAVIGATION NACH ROLLEN
// ============================================

// USER Navigation - Für alle eingeloggten Benutzer
const userNavItems = [
  { icon: Home, label: "Startseite", path: "/" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Target, label: "Neue Aufgabe", path: "/aufgaben" },
  { icon: Layers, label: "Meine Templates", path: "/meine-templates" },
  { icon: FolderOpen, label: "Meine Dokumente", path: "/meine-dokumente" },
  { icon: History, label: "Verlauf", path: "/verlauf" },
  { icon: DollarSign, label: "Mein Abo", path: "/mein-abo" },
];

// ADMIN Navigation - Für Firmen-Administratoren (role === 'admin')
const adminNavItems = [
  { icon: Building2, label: "Firmen-Dashboard", path: "/firma/dashboard" },
  { icon: BarChart3, label: "Nutzungs-Statistiken", path: "/firma/nutzung" },
  { icon: UserCog, label: "Mitarbeiter", path: "/firma/users" },
];

// ============================================
// OWNER NAVIGATION - Gruppiert nach Bereichen
// ============================================

interface NavGroup {
  id: string;
  title: string;
  emoji: string;
  color: string;
  bgColor: string;
  items: { icon: typeof Shield; label: string; path: string; badge?: string }[];
}

const ownerNavGroups: NavGroup[] = [
  {
    id: "uebersicht",
    title: "ÜBERSICHT",
    emoji: "📊",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    items: [
      { icon: Shield, label: "Dashboard", path: "/admin" },
      { icon: Zap, label: "Echtzeit-Monitor", path: "/admin/realtime" },
    ],
  },
  {
    id: "produktion",
    title: "PRODUKTION",
    emoji: "🏭",
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    items: [
      { icon: Layers, label: "Owner-Templates", path: "/admin/templates" },
      { icon: Wand2, label: "Superprompt-Generator", path: "/admin/generator" },
      { icon: Sparkles, label: "Metaprompts", path: "/admin/metaprompts" },
      { icon: FileSearch, label: "Custom-Templates", path: "/admin/custom-templates" },
      { icon: Inbox, label: "Kundenanfragen", path: "/admin/anfragen", badge: "neu" },
    ],
  },
  {
    id: "kunden",
    title: "KUNDEN",
    emoji: "👥",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    items: [
      { icon: Building2, label: "Kunden-Management", path: "/admin/kunden" },
      { icon: Users, label: "Alle Benutzer", path: "/admin/all-users" },
      { icon: GitPullRequest, label: "Änderungsanfragen", path: "/admin/change-requests" },
    ],
  },
  {
    id: "analyse",
    title: "ANALYSE",
    emoji: "📈",
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    items: [
      { icon: Euro, label: "Kosten-Übersicht", path: "/admin/manus-kosten" },
      { icon: DollarSign, label: "Kosten-Analytics", path: "/admin/cost-analytics" },
      { icon: Eye, label: "Ergebnis-Prüfung", path: "/admin/ergebnisse" },
      { icon: ClipboardList, label: "Prozess-Protokoll", path: "/admin/process-log" },
      { icon: FolderOpen, label: "Dokument-Übersicht", path: "/admin/documents" },
    ],
  },
  {
    id: "system",
    title: "SYSTEM",
    emoji: "🔧",
    color: "text-slate-600",
    bgColor: "bg-slate-500/10",
    items: [
      { icon: Factory, label: "Pakete", path: "/admin/pakete" },
      { icon: Tags, label: "Kategorien", path: "/admin/categories" },
      { icon: Building2, label: "Unternehmensbereiche", path: "/admin/business-areas" },
      { icon: Beaker, label: "Testraum", path: "/admin/testraum" },
      { icon: Settings, label: "Einstellungen", path: "/admin/settings" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const COLLAPSED_GROUPS_KEY = "sidebar-collapsed-groups";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Prüfe ob Profil vollständig ist
  const { data: profileCheck, isLoading: profileLoading } = trpc.user.checkProfileComplete.useQuery(
    undefined,
    { enabled: !!user } // Nur abfragen wenn User eingeloggt
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);
  
  // Redirect zu Profil-Vervollständigung wenn nicht vollständig
  useEffect(() => {
    if (user && profileCheck && !profileCheck.complete) {
      setLocation("/complete-profile");
    }
  }, [user, profileCheck, setLocation]);

  if (loading || (user && profileLoading)) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen ki2go-hero-bg">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <img src="/Ki2GoSymbol.jpg" alt="KI2GO" className="h-16 w-16 rounded-xl" />
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Anmelden um fortzufahren
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Der Zugriff auf diesen Bereich erfordert eine Anmeldung.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full ki2go-button-primary"
          >
            Anmelden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Einklappbare Gruppen State
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(COLLAPSED_GROUPS_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  // Speichere collapsed state
  useEffect(() => {
    localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(Array.from(collapsedGroups)));
  }, [collapsedGroups]);
  
  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };
  
  // Rollen-Check (echte Rolle)
  const realIsOwner = user?.role === 'owner';
  const realIsAdmin = user?.role === 'admin';
  
  // Test-Modus abfragen (nur für Owner)
  const { data: testModeData } = trpc.testroom.getCurrentMode.useQuery(
    undefined,
    { enabled: realIsOwner }
  );
  
  const exitTestMode = trpc.testroom.exitTestMode.useMutation({
    onSuccess: () => {
      window.location.reload(); // Seite neu laden um Test-Modus zu beenden
    }
  });
  
  // Simulierte Rolle basierend auf Test-Modus
  const isInTestMode = realIsOwner && testModeData?.isInTestMode;
  const testSession = testModeData?.session;
  
  // Effektive Rolle: Im Test-Modus die simulierte Rolle verwenden
  let effectiveRole: 'owner' | 'admin' | 'user' = user?.role || 'user';
  if (isInTestMode && testSession) {
    if (testSession.testMode === 'firma_admin') {
      effectiveRole = 'admin';
    } else if (testSession.testMode === 'firma_member' || testSession.testMode === 'user') {
      effectiveRole = 'user';
    }
  }
  
  const isOwner = effectiveRole === 'owner';
  const isAdmin = effectiveRole === 'admin';
  
  // Kundenraum-Info laden (Firmenlogo und -name)
  const { data: kundenraumInfo } = trpc.organization.getKundenraumInfo.useQuery(
    undefined,
    { enabled: !!user && !realIsOwner } // Nicht für Owner laden (auch nicht im Test-Modus)
  );
  
  // Alle Navigation Items für aktives Menü-Highlighting
  const allOwnerItems = ownerNavGroups.flatMap(g => g.items);
  const allNavItems = [
    ...userNavItems,
    ...(isAdmin ? adminNavItems : []),
    ...(isOwner ? allOwnerItems : []),
  ];
  const activeMenuItem = allNavItems.find(item => 
    location === item.path || location.startsWith(item.path + '/')
  );

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  // Navigation Section Renderer für User/Admin
  const renderNavSection = (
    items: typeof userNavItems, 
    title?: string, 
    showDivider?: boolean
  ) => (
    <>
      {showDivider && (
        <div className="px-4 py-2">
          <div className="h-px bg-border" />
        </div>
      )}
      {title && (
        <div className="px-4 py-1">
          {!isCollapsed && (
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </span>
          )}
        </div>
      )}
      <SidebarMenu className="px-2 py-1">
        {items.map(item => {
          const isActive = location === item.path || location.startsWith(item.path + '/');
          return (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                isActive={isActive}
                onClick={() => setLocation(item.path)}
                tooltip={item.label}
                className="h-10 transition-all font-normal"
              >
                <item.icon
                  className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </>
  );

  // Owner Navigation mit einklappbaren Gruppen
  const renderOwnerNavGroups = () => (
    <>
      <div className="px-4 py-2">
        <div className="h-px bg-border" />
      </div>
      {ownerNavGroups.map((group) => {
        const isGroupCollapsed = collapsedGroups.has(group.id);
        const hasActiveItem = group.items.some(
          item => location === item.path || location.startsWith(item.path + '/')
        );
        
        return (
          <div key={group.id} className="mb-1">
            {/* Gruppen-Header mit Mockup-Badge */}
            <button
              onClick={() => toggleGroup(group.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 mx-2 rounded-lg transition-all",
                "hover:bg-accent/50 text-left",
                hasActiveItem && !isGroupCollapsed && "bg-accent/30"
              )}
            >
              {isGroupCollapsed ? (
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              
              {/* Mockup-Badge für den Bereich */}
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] font-bold tracking-wider px-2 py-0.5 border-0",
                  group.bgColor,
                  group.color
                )}
              >
                <span className="mr-1">{group.emoji}</span>
                {group.title}
              </Badge>
              
              {/* Anzahl der Items */}
              {!isCollapsed && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {group.items.length}
                </span>
              )}
            </button>
            
            {/* Gruppen-Items */}
            {!isGroupCollapsed && (
              <SidebarMenu className="px-2 py-1 ml-2">
                {group.items.map(item => {
                  const isActive = location === item.path || location.startsWith(item.path + '/');
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                        className="h-9 transition-all font-normal text-sm"
                      >
                        <item.icon
                          className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4">
                            {item.badge}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </div>
        );
      })}
    </>
  );

  // Bestimme Logo und Name für den Header
  const hasKundenraum = !!kundenraumInfo;
  const headerLogoUrl = hasKundenraum && kundenraumInfo.logoUrl 
    ? kundenraumInfo.logoUrl 
    : "/Ki2GoSymbol.jpg";
  const headerTitle = hasKundenraum 
    ? kundenraumInfo.name 
    : "KI2GO";
  const headerSubtitle = hasKundenraum ? "Kundenraum" : null;

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Navigation umschalten"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <img 
                    src={headerLogoUrl} 
                    alt={headerTitle} 
                    className="h-8 w-8 rounded-lg object-cover"
                    onError={(e) => {
                      // Fallback zu KI2GO Logo wenn Firmenlogo nicht lädt
                      (e.target as HTMLImageElement).src = "/Ki2GoSymbol.jpg";
                    }}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold tracking-tight truncate text-primary text-sm leading-tight">
                      {headerTitle}
                    </span>
                    {headerSubtitle && (
                      <span className="text-xs text-muted-foreground truncate leading-tight">
                        {headerSubtitle}
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
              {/* Home Button - Zurück zur Startseite */}
              <button
                onClick={() => setLocation("/")}
                className="h-8 w-8 flex items-center justify-center hover:bg-primary/10 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Zur Startseite"
                title="Zur Startseite"
              >
                <Home className="h-4 w-4 text-primary" />
              </button>
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto">
            {/* USER Navigation - Für alle */}
            {renderNavSection(userNavItems)}
            
            {/* ADMIN Navigation - Für Firmen-Admins */}
            {isAdmin && renderNavSection(adminNavItems, "Firma", true)}
            
            {/* OWNER Navigation - Für Plattform-Betreiber (mit Gruppen) */}
            {isOwner && renderOwnerNavGroups()}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {isOwner ? 'Owner' : isAdmin ? 'Admin' : 'Benutzer'}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setLocation('/profile')}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation('/')}
                  className="cursor-pointer"
                >
                  <Home className="mr-2 h-4 w-4" />
                  <span>Zur Startseite</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Abmelden</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <img 
                  src={headerLogoUrl} 
                  alt={headerTitle} 
                  className="h-8 w-8 rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/Ki2GoSymbol.jpg";
                  }}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="tracking-tight text-foreground font-medium text-sm">
                    {hasKundenraum ? headerTitle : (activeMenuItem?.label ?? "KI2GO")}
                  </span>
                  {hasKundenraum && (
                    <span className="text-xs text-muted-foreground">
                      Kundenraum
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Test-Modus Banner */}
        {isInTestMode && testSession && (
          <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <FlaskConical className="h-5 w-5" />
              <div>
                <span className="font-medium">Test-Modus aktiv:</span>
                <span className="ml-2">
                  {testSession.testMode === 'user' && 'Normaler User'}
                  {testSession.testMode === 'firma_admin' && 'Firmen-Admin'}
                  {testSession.testMode === 'firma_member' && 'Firmen-Mitarbeiter'}
                </span>
                <span className="ml-2 text-purple-200 text-sm">
                  (Szenario: {testSession.simulatedScenario || 'Normal'})
                </span>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exitTestMode.mutate()}
              disabled={exitTestMode.isPending}
              className="bg-white text-purple-700 hover:bg-purple-100"
            >
              <Square className="h-4 w-4 mr-2" />
              Test beenden
            </Button>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
