import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Clock,
  Euro,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Users,
  Star,
  Upload,
  AlertTriangle,
  Zap,
  Shield,
  Gift,
  Calculator,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { RoiCalculatorModal } from "@/components/RoiCalculatorModal";

// Dynamisches Icon
const DynamicIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.FileText;
  return <IconComponent className={className} style={style} />;
};

export default function TaskPreview() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [showRoiCalculator, setShowRoiCalculator] = useState(false);

  // Lade öffentliche Template-Daten
  const { data: template, isLoading, error } = trpc.template.getPublicPreview.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  // Wenn eingeloggt, zur Ausführungsseite weiterleiten
  if (user && !authLoading) {
    navigate(`/aufgabe/${slug}`);
    return null;
  }

  // Loading State
  if (isLoading || authLoading) {
    return (
      <div className="container max-w-5xl py-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Error State
  if (error || !template) {
    return (
      <div className="container max-w-4xl py-16 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive/50 mb-6" />
        <h1 className="text-2xl font-bold mb-4">Aufgabe nicht gefunden</h1>
        <p className="text-muted-foreground mb-8">
          Diese Aufgabe existiert nicht oder ist nicht öffentlich zugänglich.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zur Startseite
        </Button>
      </div>
    );
  }

  const loginUrl = `${import.meta.env.VITE_OAUTH_PORTAL_URL}?app_id=${import.meta.env.VITE_APP_ID}&redirect=${encodeURIComponent(window.location.href)}`;

  return (
    <>
      <PageHeader
        title={template.marketingHeadline || template.title}
        metaDescription={template.marketingMetaDescription || template.shortDescription || undefined}
        canonicalUrl={`https://ki2go.at/aufgabe/${template.slug}`}
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <div className="container max-w-5xl py-8">
          {/* Zurück Button */}
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Übersicht
          </Button>

          {/* Header */}
          <div className="flex items-start gap-6 mb-8">
            <div
              className="p-4 rounded-2xl shrink-0"
              style={{ backgroundColor: `${template.color}20` }}
            >
              <DynamicIcon
                name={template.icon || "FileText"}
                className="h-12 w-12"
                style={{ color: template.color ?? undefined }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {template.categoryName && (
                  <Badge variant="secondary" className="text-xs">
                    {template.categoryName}
                  </Badge>
                )}
                {template.businessAreaName && (
                  <Badge variant="outline" className="text-xs">
                    {template.businessAreaName}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                {template.marketingHeadline || template.title}
              </h1>
              {template.marketingSubheadline && (
                <p className="text-xl text-muted-foreground">
                  {template.marketingSubheadline}
                </p>
              )}
              {!template.marketingSubheadline && template.shortDescription && (
                <p className="text-xl text-muted-foreground">
                  {template.shortDescription}
                </p>
              )}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* ROI Kalkulation */}
              <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <TrendingUp className="h-5 w-5" />
                    Ihre Zeitersparnis
                  </CardTitle>
                  <CardDescription>
                    Berechnet auf Basis von {template.roi.hourlyRate}€/Stunde
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* 1 Dokument */}
                    <div className="p-4 rounded-xl bg-white/50 dark:bg-black/20">
                      <div className="text-sm text-muted-foreground mb-2">Pro Aufgabe (1 Dokument)</div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold text-green-600">
                          {template.roi.oneDocument.savedTimeMinutes} Min
                        </span>
                        <span className="text-muted-foreground">gespart</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="line-through text-muted-foreground">
                          {template.roi.oneDocument.manualTimeMinutes} Min manuell
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium text-green-600">
                          {template.roi.oneDocument.ki2goTimeMinutes} Min mit KI2GO
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-2">
                        <Euro className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-600">
                          {template.roi.oneDocument.savedMoneyEuros.toFixed(2)}€ Ersparnis
                        </span>
                      </div>
                    </div>

                    {/* 3 Dokumente */}
                    <div className="p-4 rounded-xl bg-white/50 dark:bg-black/20">
                      <div className="text-sm text-muted-foreground mb-2">Pro Aufgabe (3 Dokumente)</div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold text-green-600">
                          {template.roi.threeDocuments.savedTimeMinutes} Min
                        </span>
                        <span className="text-muted-foreground">gespart</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="line-through text-muted-foreground">
                          {template.roi.threeDocuments.manualTimeMinutes} Min manuell
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium text-green-600">
                          {template.roi.threeDocuments.ki2goTimeMinutes} Min mit KI2GO
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-2">
                        <Euro className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-600">
                          {template.roi.threeDocuments.savedMoneyEuros.toFixed(2)}€ Ersparnis
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Jahresersparnis-Highlight */}
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 border border-purple-200 dark:border-purple-800">
                    <div className="text-center">
                      <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Bei nur {template.roi.tasksPerMonth} Aufgaben pro Monat:</div>
                      <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                        € {Math.round(template.roi.oneDocument.savedMoneyEuros * template.roi.tasksPerMonth * 12).toLocaleString('de-DE')} / Jahr
                      </div>
                      <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                        {Math.round(template.roi.oneDocument.savedTimeMinutes * template.roi.tasksPerMonth * 12 / 60)} Stunden Zeitersparnis pro Jahr
                      </div>
                    </div>
                  </div>
                  
                  {/* ROI Disclaimer */}
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    * Die dargestellte Zeitersparnis basiert auf Erfahrungswerten und kann je nach Komplexität der Aufgabe, 
                    Dokumentenqualität und individuellen Anforderungen variieren. Der angegebene Stundensatz dient als 
                    Berechnungsgrundlage und entspricht nicht zwingend Ihren tatsächlichen Kosten.
                  </p>
                  
                  {/* ROI-Rechner Button */}
                  <div className="mt-6">
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all py-6 border-2 border-orange-400"
                      onClick={() => setShowRoiCalculator(true)}
                    >
                      <Calculator className="h-6 w-6 mr-3" />
                      <span className="text-lg">Berechnen Sie Ihren individuellen ROI</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Marketing USPs */}
              {template.marketingUsps && template.marketingUsps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Ihre Vorteile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {template.marketingUsps.map((usp: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{usp}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Beschreibung */}
              {template.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Über diese Aufgabe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {template.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Beispiel-Output */}
              {template.exampleOutput && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Beispiel-Ergebnis
                    </CardTitle>
                    <CardDescription>
                      So könnte Ihr Ergebnis aussehen (anonymisiert)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {template.exampleOutput.length > 500 
                          ? template.exampleOutput.substring(0, 500) + "..."
                          : template.exampleOutput}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Benötigte Eingaben */}
              {template.publicVariables && template.publicVariables.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5 text-primary" />
                      Benötigte Eingaben
                    </CardTitle>
                    <CardDescription>
                      Diese Informationen werden für die Aufgabe benötigt
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {template.publicVariables.map((variable: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          {variable.type === "file" ? (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ) : variable.type === "textarea" ? (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <span className="h-4 w-4 rounded bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                              {index + 1}
                            </span>
                          )}
                          <span className="flex-1">{variable.label}</span>
                          {variable.required && (
                            <Badge variant="secondary" className="text-xs">
                              Pflicht
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    {template.documentRequired === 1 && (
                      <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                          <Upload className="h-4 w-4" />
                          <span className="font-medium">
                            {template.documentCount || 1} Dokument(e) erforderlich
                          </span>
                        </div>
                        {template.documentDescription && (
                          <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                            {template.documentDescription}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - CTA Sidebar */}
            <div className="space-y-6">
              {/* Haupt-CTA Card */}
              <Card className="border-2 border-primary sticky top-4">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10">
                    <Gift className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">14 Tage kostenlos testen</CardTitle>
                  <CardDescription>
                    Keine Kreditkarte erforderlich
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild size="lg" className="w-full text-lg h-14">
                    <a href={loginUrl}>
                      {template.marketingCtaText || "Jetzt kostenlos starten"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>

                  <Separator />

                  {/* Was im Test enthalten ist */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-center">Im Testzeitraum enthalten:</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>10 kostenlose Aufgaben</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Alle Aufgaben-Typen verfügbar</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Ergebnisse als PDF/Word exportieren</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Dokument-Upload bis 10 MB</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Verlauf & Dokumenten-Verwaltung</span>
                      </li>
                    </ul>
                  </div>

                  <Separator />

                  {/* Vertrauens-Elemente */}
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      <span>DSGVO-konform</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      <span>Sofort startklar</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistiken */}
              {((template.usageCount ?? 0) > 0 || template.avgRating) && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      {(template.usageCount ?? 0) > 0 && (
                        <div>
                          <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                            <Users className="h-5 w-5 text-primary" />
                            {template.usageCount}
                          </div>
                          <p className="text-xs text-muted-foreground">Mal genutzt</p>
                        </div>
                      )}
                      {template.avgRating && (
                        <div>
                          <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            {Number(template.avgRating).toFixed(1)}
                          </div>
                          <p className="text-xs text-muted-foreground">Bewertung</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sekundärer CTA */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Bereits registriert?
                  </p>
                  <Button variant="outline" asChild className="w-full">
                    <a href={loginUrl}>
                      Anmelden
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ROI-Rechner Modal */}
      {template && (
        <RoiCalculatorModal
          open={showRoiCalculator}
          onOpenChange={setShowRoiCalculator}
          defaultValues={{
            hourlyRate: template.roi.hourlyRate || 80,
            tasksPerMonth: template.roi.tasksPerMonth || 10,
            documentsPerTask: template.documentCount || 1,
            manualBaseTime: template.roiBaseTimeMinutes || 30,
            timePerDocument: template.roiTimePerDocumentMinutes || 15,
            ki2goBaseTime: template.roiKi2goTimeMinutes || 3,
            ki2goTimePerDocument: template.roiKi2goTimePerDocument || 1,
          }}
          sources={template.roi.sources || []}
          templateName={template.title}
        />
      )}
    </>
  );
}
