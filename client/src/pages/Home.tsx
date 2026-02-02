import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowRight, Sparkles, Shield, Zap, Settings, LogOut, 
  LayoutDashboard, FileText, Send, Calendar, Clock, CheckCircle2, Cookie,
  FlaskConical, Square
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { getLoginUrl } from "@/const";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dynamisches Icon basierend auf Namen
const DynamicIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => {
  const IconComponent = (LucideIcons as any)[name] || FileText;
  return <IconComponent className={className} style={style} />;
};

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const { openSettings: openCookieSettings } = useCookieConsent();
  
  // Lade Kundenraum-Info für personalisiertes Branding
  const { data: kundenraumInfo } = trpc.organization.getKundenraumInfo.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  // Test-Modus abfragen (nur für Owner)
  const isOwner = user?.role === 'owner';
  const { data: testModeData } = trpc.testroom.getCurrentMode.useQuery(
    undefined,
    { enabled: isOwner }
  );
  
  const exitTestMode = trpc.testroom.exitTestMode.useMutation({
    onSuccess: () => {
      window.location.reload();
    }
  });
  
  const isInTestMode = isOwner && testModeData?.isInTestMode;
  const testSession = testModeData?.session;
  // toast wird direkt von sonner importiert
  
  // Anfrage-Formular State
  const [requestDescription, setRequestDescription] = useState("");
  const [requestCategory, setRequestCategory] = useState<string>("");
  const [requestBusinessArea, setRequestBusinessArea] = useState<string>("");
  const [requestDeadline, setRequestDeadline] = useState("");
  const [requestUrgency, setRequestUrgency] = useState<"normal" | "urgent" | "asap">("normal");
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Lade aktive Templates für die Landing Page
  const { data: activeTemplates, isLoading: templatesLoading } = trpc.template.listActive.useQuery({
    featured: false,
  });

  // Lade Kategorien und Bereiche aus der Datenbank
  const { data: categories } = trpc.category.list.useQuery();
  const { data: businessAreas } = trpc.businessArea.list.useQuery();

  // Anfrage-Mutation
  const createRequest = trpc.taskRequest.create.useMutation({
    onSuccess: (data) => {
      setSubmitSuccess(true);
      setIsSubmitting(false);
      toast.success("Anfrage gesendet!", {
        description: data.message,
      });
      // Formular zurücksetzen
      setRequestDescription("");
      setRequestCategory("");
      setRequestBusinessArea("");
      setRequestDeadline("");
      setRequestUrgency("normal");
      setContactEmail("");
      setContactName("");
      setCompanyName("");
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error("Fehler", {
        description: error.message,
      });
    },
  });

  const handleQuickAction = (slug: string) => {
    window.location.href = `/aufgabe/${slug}`;
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDescription.trim()) {
      toast.error("Bitte beschreiben Sie Ihre Aufgabe");
      return;
    }

    setIsSubmitting(true);
    createRequest.mutate({
      description: requestDescription,
      categoryId: requestCategory ? parseInt(requestCategory) : undefined,
      businessAreaId: requestBusinessArea ? parseInt(requestBusinessArea) : undefined,
      deadline: requestDeadline || undefined,
      urgency: requestUrgency,
      contactEmail: !isAuthenticated ? contactEmail : undefined,
      contactName: !isAuthenticated ? contactName : undefined,
      companyName: companyName || undefined,
    });
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'owner': return 'Owner';
      case 'admin': return 'Administrator';
      default: return 'Benutzer';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Test-Modus Banner */}
      {isInTestMode && testSession && (
        <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-[60]">
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
      
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src="/Ki2GoSymbol.jpg" alt="KI2GO" className="h-10 w-10 rounded-lg" />
            <span className="text-xl font-bold text-primary">KI2GO - Ergebnisse statt chatten!</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#aufgaben" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Aufgaben</a>
            <a href="#anfrage" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Anfrage stellen</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Avatar className="h-8 w-8 border">
                        <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:flex flex-col items-start">
                        <span className="text-sm font-medium">{user.name || 'Benutzer'}</span>
                        <span className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</span>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-2 border-b">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuItem onClick={() => window.location.href = '/dashboard'} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/profile'} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profil-Einstellungen</span>
                    </DropdownMenuItem>
                    {(user.role === 'admin' || user.role === 'owner') && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => window.location.href = '/admin'} className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin-Bereich</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Abmelden</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button variant="ghost" onClick={() => window.location.href = getLoginUrl()}>
                  Anmelden
                </Button>
                <Button variant="default" onClick={() => window.location.href = '/onboarding'}>
                  Kostenlos starten
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - Personalisiert für Kundenraum */}
      <section className="ki2go-hero-bg py-16 md:py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            {/* Kundenraum-Branding oder Standard-Logo */}
            {isAuthenticated && kundenraumInfo ? (
              <>
                {/* Personalisierte Willkommensnachricht für Kunden mit Datenraum */}
                <div className="mb-8">
                  {kundenraumInfo.logoUrl && (
                    <div className="flex justify-center mb-6">
                      <img 
                        src={kundenraumInfo.logoUrl} 
                        alt={kundenraumInfo.name} 
                        className="h-16 md:h-20 object-contain" 
                      />
                    </div>
                  )}
                  <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                    <span className="text-foreground">Willkommen im</span>
                    <br />
                    <span className="ki2go-gradient-text">KI Dataroom</span>
                    <br />
                    <span className="text-foreground">von {kundenraumInfo.name}</span>
                  </h1>
                </div>
                
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Ihr exklusiver Zugang zu maßgeschneiderten KI-Lösungen.
                  Wählen Sie eine Aufgabe oder stellen Sie eine individuelle Anfrage.
                </p>
              </>
            ) : (
              <>
                {/* Standard KI2GO Branding für Besucher ohne Datenraum */}
                <div className="flex justify-center mb-6">
                  <img src="/logoKi2Go.jpg" alt="KI2GO - Wir liefern Ergebnisse" className="h-20 md:h-28" />
                </div>
                
                <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                  <span className="ki2go-gradient-text">Zuverlässige Ergebnisse</span>
                  <br />
                  <span className="text-foreground">für Ihre Aufgaben</span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Wählen Sie eine fertige Aufgabe oder beschreiben Sie Ihre individuelle Anforderung – 
                  wir liefern Ihnen ein professionelles Ergebnis.
                </p>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="ki2go-button-accent"
                onClick={() => document.getElementById('aufgaben')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Verfügbare Aufgaben
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => document.getElementById('anfrage')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Individuelle Anfrage
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Verfügbare Aufgaben */}
      <section id="aufgaben" className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Sofort verfügbare Aufgaben
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Diese KI-Aufgaben sind bereits optimiert und können sofort ausgeführt werden.
            </p>
          </div>
          
          {templatesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : activeTemplates && activeTemplates.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {activeTemplates.slice(0, 8).map((template) => (
                <Card 
                  key={template.id}
                  className="ki2go-card cursor-pointer group hover:shadow-lg transition-all"
                  onClick={() => handleQuickAction(template.slug)}
                >
                  <CardContent className="p-6 text-center">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: template.color ? `${template.color}20` : 'rgb(var(--accent) / 0.1)' }}
                    >
                      <DynamicIcon 
                        name={template.icon || "FileText"} 
                        className="h-6 w-6" 
                        style={{ color: template.color || 'rgb(var(--accent))' }}
                      />
                    </div>
                    <h3 className="font-medium text-sm mb-1">{template.title}</h3>
                    {template.shortDescription && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.shortDescription}
                      </p>
                    )}
                    {template.categoryName && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-muted rounded-full">
                        {template.categoryName}
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Aktuell sind keine fertigen Aufgaben verfügbar. Stellen Sie unten eine individuelle Anfrage!
              </p>
            </div>
          )}
          
          {activeTemplates && activeTemplates.length > 8 && (
            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/aufgaben'}
              >
                Alle {activeTemplates.length} Aufgaben anzeigen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Anfrage-Formular */}
      <section id="anfrage" className="py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Für welche Aufgabe dürfen wir Ihnen ein zuverlässiges Ergebnis liefern?
              </h2>
              <p className="text-muted-foreground">
                Beschreiben Sie Ihre Aufgabe – wir erstellen Ihnen ein unverbindliches Angebot.
              </p>
            </div>

            {submitSuccess ? (
              <Card className="ki2go-card">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Anfrage erfolgreich gesendet!</h3>
                  <p className="text-muted-foreground mb-6">
                    Vielen Dank für Ihre Anfrage. Wir melden uns in Kürze mit einem Angebot bei Ihnen.
                  </p>
                  <Button onClick={() => setSubmitSuccess(false)}>
                    Weitere Anfrage stellen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="ki2go-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-accent" />
                    Ihre Anfrage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitRequest} className="space-y-6">
                    {/* Aufgaben-Beschreibung */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-base font-medium">
                        Was möchten Sie erledigen? *
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Beschreiben Sie Ihre Aufgabe so detailliert wie möglich, z.B. 'Ich benötige eine Analyse meines Mietvertrags auf versteckte Klauseln und Risiken' oder 'Erstellen Sie mir eine Marktanalyse für den deutschen E-Commerce-Markt 2026'"
                        value={requestDescription}
                        onChange={(e) => setRequestDescription(e.target.value)}
                        className="min-h-[120px] resize-y"
                        required
                      />
                    </div>

                    {/* Kategorie und Bereich */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Kategorie</Label>
                        <Select value={requestCategory} onValueChange={setRequestCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategorie wählen (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessArea">Unternehmensbereich</Label>
                        <Select value={requestBusinessArea} onValueChange={setRequestBusinessArea}>
                          <SelectTrigger>
                            <SelectValue placeholder="Bereich wählen (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {businessAreas?.map((area) => (
                              <SelectItem key={area.id} value={area.id.toString()}>
                                {area.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Deadline und Dringlichkeit */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deadline" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Bis wann benötigen Sie das Ergebnis?
                        </Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={requestDeadline}
                          onChange={(e) => setRequestDeadline(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="urgency" className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Dringlichkeit
                        </Label>
                        <Select value={requestUrgency} onValueChange={(v) => setRequestUrgency(v as any)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal (Standard)</SelectItem>
                            <SelectItem value="urgent">Dringend (Aufpreis möglich)</SelectItem>
                            <SelectItem value="asap">So schnell wie möglich</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Kontaktdaten für nicht eingeloggte User */}
                    {!isAuthenticated && (
                      <div className="border-t pt-6 mt-6">
                        <h4 className="font-medium mb-4">Ihre Kontaktdaten</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contactName">Ihr Name</Label>
                            <Input
                              id="contactName"
                              placeholder="Max Mustermann"
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contactEmail">E-Mail-Adresse *</Label>
                            <Input
                              id="contactEmail"
                              type="email"
                              placeholder="max@firma.de"
                              value={contactEmail}
                              onChange={(e) => setContactEmail(e.target.value)}
                              required={!isAuthenticated}
                            />
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <Label htmlFor="companyName">Unternehmen (optional)</Label>
                          <Input
                            id="companyName"
                            placeholder="Musterfirma GmbH"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full ki2go-button-accent"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                            Wird gesendet...
                          </>
                        ) : (
                          <>
                            Unverbindliches Angebot anfordern
                            <Send className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        Wir melden uns innerhalb von 24 Stunden mit einem individuellen Angebot bei Ihnen.
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Warum KI2GO?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Die Plattform für Unternehmen, die KI nutzen wollen – ohne komplizierte Einrichtung.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="ki2go-card">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Sofort einsatzbereit</h3>
                <p className="text-muted-foreground">
                  Keine Einrichtung, keine Schulung. Wählen Sie eine Aufgabe und starten Sie sofort.
                </p>
              </CardContent>
            </Card>

            <Card className="ki2go-card">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                  <Sparkles className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Perfekte Ergebnisse</h3>
                <p className="text-muted-foreground">
                  Von Experten optimierte Workflows für konsistent hochwertige Ergebnisse.
                </p>
              </CardContent>
            </Card>

            <Card className="ki2go-card">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-6">
                  <Shield className="h-7 w-7 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">DSGVO-konform</h3>
                <p className="text-muted-foreground">
                  Ihre Daten bleiben sicher. Hosting in der EU mit höchsten Sicherheitsstandards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">
            Bereit, Ihre Arbeit zu revolutionieren?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Starten Sie jetzt kostenlos und erleben Sie, wie KI2GO Ihre Produktivität steigert.
          </p>
          <Button 
            size="lg" 
            className="ki2go-button-accent text-lg px-8 py-6"
            onClick={() => window.location.href = '/onboarding'}
          >
            Kostenlos starten
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/50 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/Ki2GoSymbol.jpg" alt="KI2GO" className="h-8 w-8 rounded-lg" />
              <div className="flex flex-col">
                <span className="font-semibold">KI2GO</span>
                <span className="text-xs text-muted-foreground">Ergebnisse statt chatten!</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 KI2GO. Alle Rechte vorbehalten.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="/kontakt" className="hover:text-foreground transition-colors">Kontakt</a>
              <a href="/impressum" className="hover:text-foreground transition-colors">Impressum</a>
              <a href="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</a>
              <a href="/agb" className="hover:text-foreground transition-colors">AGB</a>
              <button 
                onClick={() => openCookieSettings()}
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Cookie className="h-3 w-3" />
                Cookie-Einstellungen
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
