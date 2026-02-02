import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  ArrowLeft,
  FileText,
  Clock,
  Star,
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Sparkles,
  Calendar,
  User,
  File,
  FileImage,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  Eye,
  SplitSquareHorizontal,
  PanelLeftClose,
  PanelRightClose,
  ExternalLink,
} from "lucide-react";
import * as LucideIcons from "lucide-react";

// Dynamisches Icon
const DynamicIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.FileText;
  return <IconComponent className={className} style={style} />;
};

// Datei-Icon basierend auf Typ
const getFileIcon = (fileType: string) => {
  if (fileType.includes("pdf")) return FileText;
  if (fileType.includes("image")) return FileImage;
  if (fileType.includes("spreadsheet") || fileType.includes("excel")) return FileSpreadsheet;
  return File;
};

// Dateigröße formatieren
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function TaskResult() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  // View State
  const [viewMode, setViewMode] = useState<"split" | "document" | "result">("split");
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  
  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState<"positive" | "negative" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [improvementSuggestion, setImprovementSuggestion] = useState("");
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Export Queries
  const txtExport = trpc.export.exportTxt.useQuery(
    { executionId: parseInt(id || "0") },
    { enabled: false }
  );
  const htmlExport = trpc.export.exportHtml.useQuery(
    { executionId: parseInt(id || "0") },
    { enabled: false }
  );
  const pdfExport = trpc.export.exportPdf.useQuery(
    { executionId: parseInt(id || "0") },
    { enabled: false }
  );

  // Download-Funktionen
  const downloadTxt = async () => {
    setIsDownloading(true);
    try {
      const result = await txtExport.refetch();
      if (result.data) {
        const blob = new Blob([result.data.content], { type: result.data.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Download gestartet!");
      }
    } catch (error) {
      toast.error("Download fehlgeschlagen");
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadHtml = async () => {
    setIsDownloading(true);
    try {
      const result = await htmlExport.refetch();
      if (result.data) {
        const blob = new Blob([result.data.content], { type: result.data.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Download gestartet!");
      }
    } catch (error) {
      toast.error("Download fehlgeschlagen");
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadPdf = async () => {
    setIsDownloading(true);
    try {
      const result = await pdfExport.refetch();
      if (result.data) {
        // Öffne HTML in neuem Tab und nutze Browser-Druckfunktion für PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.data.htmlContent);
          printWindow.document.close();
          // Warte bis Inhalt geladen ist, dann Druckdialog öffnen
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 250);
          };
          toast.success("PDF-Druckdialog geöffnet - Wählen Sie 'Als PDF speichern'");
        } else {
          toast.error("Pop-up wurde blockiert. Bitte erlauben Sie Pop-ups für diese Seite.");
        }
      }
    } catch (error) {
      toast.error("PDF-Export fehlgeschlagen");
    } finally {
      setIsDownloading(false);
    }
  };

  // Lade Ausführungs-Daten
  const { data: execution, isLoading, error } = trpc.workflow.getExecution.useQuery(
    { executionId: parseInt(id || "0") },
    { enabled: !!id && !!user }
  );

  // Feedback Mutation
  const feedbackMutation = trpc.workflow.submitFeedback.useMutation({
    onSuccess: () => {
      toast.success("Vielen Dank für Ihr Feedback!");
      setShowFeedbackForm(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Kopiere Ergebnis
  const copyResult = async () => {
    if (!execution?.result) return;
    try {
      await navigator.clipboard.writeText(execution.result);
      setCopied(true);
      toast.success("Ergebnis kopiert!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  };

  // Feedback absenden
  const submitFeedback = () => {
    if (!execution || feedbackRating === null) {
      toast.error("Bitte geben Sie eine Bewertung ab");
      return;
    }

    feedbackMutation.mutate({
      executionId: execution.id,
      rating: feedbackRating,
      comment: feedbackText || undefined,
      improvementSuggestion: improvementSuggestion || undefined,
    });
  };

  // Loading State
  if (authLoading || isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-[600px] rounded-xl" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    );
  }

  // Nicht angemeldet
  if (!user) {
    return (
      <div className="container max-w-4xl py-16 text-center">
        <Sparkles className="mx-auto h-16 w-16 text-primary/50 mb-6" />
        <h1 className="text-2xl font-bold mb-4">Anmeldung erforderlich</h1>
        <p className="text-muted-foreground mb-8">
          Bitte melden Sie sich an, um Ihre Ergebnisse anzuzeigen.
        </p>
        <Button asChild>
          <a href={`${import.meta.env.VITE_OAUTH_PORTAL_URL}?app_id=${import.meta.env.VITE_APP_ID}`}>
            Anmelden
          </a>
        </Button>
      </div>
    );
  }

  // Ergebnis nicht gefunden
  if (error || !execution) {
    return (
      <div className="container max-w-4xl py-16 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive/50 mb-6" />
        <h1 className="text-2xl font-bold mb-4">Ergebnis nicht gefunden</h1>
        <p className="text-muted-foreground mb-8">
          Dieses Ergebnis existiert nicht oder Sie haben keinen Zugriff darauf.
        </p>
        <Button variant="outline" onClick={() => navigate("/aufgaben")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Aufgaben
        </Button>
      </div>
    );
  }

  const template = execution.template;
  const documents = execution.documents || [];
  const selectedDoc = documents[selectedDocIndex];
  const hasDocuments = documents.length > 0;

  // Dokument-Viewer Komponente
  const DocumentViewer = () => {
    if (!hasDocuments) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
          <File className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Kein Dokument vorhanden</p>
          <p className="text-sm text-center">
            Diese Aufgabe wurde ohne Dokument-Upload ausgeführt.
          </p>
        </div>
      );
    }

    const FileIcon = getFileIcon(selectedDoc?.fileType || "");

    return (
      <div className="h-full flex flex-col">
        {/* Dokument-Tabs wenn mehrere */}
        {documents.length > 1 && (
          <div className="flex gap-2 p-3 border-b bg-muted/30 overflow-x-auto">
            {documents.map((doc, index) => (
              <Button
                key={doc.id}
                variant={selectedDocIndex === index ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDocIndex(index)}
                className="shrink-0"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                {doc.fileName.length > 20 ? doc.fileName.slice(0, 20) + "..." : doc.fileName}
              </Button>
            ))}
          </div>
        )}

        {/* Dokument-Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{selectedDoc?.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedDoc?.fileSize || 0)} • {selectedDoc?.fileType}
              </p>
            </div>
          </div>
          {selectedDoc?.fileUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={selectedDoc.fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Original öffnen
              </a>
            </Button>
          )}
        </div>

        {/* Dokument-Inhalt */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {selectedDoc?.fileType?.includes("pdf") && selectedDoc?.fileUrl ? (
              <div className="space-y-4">
                {/* PDF Embed */}
                <div className="border rounded-lg overflow-hidden bg-white">
                  <iframe
                    src={`${selectedDoc.fileUrl}#toolbar=0`}
                    className="w-full h-[500px]"
                    title={selectedDoc.fileName}
                  />
                </div>
                
                {/* Extrahierter Text */}
                {selectedDoc.extractedText && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Extrahierter Text
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg border">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {selectedDoc.extractedText}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedDoc?.fileType?.includes("image") && selectedDoc?.fileUrl ? (
              <div className="flex justify-center">
                <img
                  src={selectedDoc.fileUrl}
                  alt={selectedDoc.fileName}
                  className="max-w-full max-h-[600px] rounded-lg border"
                />
              </div>
            ) : selectedDoc?.extractedText ? (
              <div className="p-4 bg-muted/30 rounded-lg border">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {selectedDoc.extractedText}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Vorschau nicht verfügbar</p>
                {selectedDoc?.fileUrl && (
                  <Button variant="link" asChild className="mt-2">
                    <a href={selectedDoc.fileUrl} target="_blank" rel="noopener noreferrer">
                      Datei herunterladen
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // Ergebnis-Viewer Komponente
  const ResultViewer = () => (
    <div className="h-full flex flex-col">
      {/* Ergebnis-Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="font-medium text-sm">Generiertes Ergebnis</p>
            <p className="text-xs text-muted-foreground">
              {execution.executionTimeMs 
                ? `Generiert in ${(execution.executionTimeMs / 1000).toFixed(1)}s`
                : "Generiert"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyResult}>
            {copied ? (
              <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 mr-1.5" />
            )}
            {copied ? "Kopiert!" : "Kopieren"}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTxt} disabled={isDownloading}>
            <Download className="h-4 w-4 mr-1.5" />
            TXT
          </Button>
          <Button variant="outline" size="sm" onClick={downloadHtml} disabled={isDownloading}>
            <Download className="h-4 w-4 mr-1.5" />
            HTML
          </Button>
          <Button variant="default" size="sm" onClick={downloadPdf} disabled={isDownloading} className="bg-primary">
            <Download className="h-4 w-4 mr-1.5" />
            PDF
          </Button>
        </div>
      </div>

      {/* ROI-Banner - Zeitersparnis */}
      {template?.roiBaseTimeMinutes && (
        <div className="mx-3 mt-3 p-4 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/20">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                🎉 Sie haben gerade Zeit gespart!
              </p>
              {(() => {
                const docCount = documents.length || 1;
                const baseTime = template.roiBaseTimeMinutes || 30;
                const timePerDoc = template.roiTimePerDocumentMinutes || 15;
                const ki2goTime = template.roiKi2goTimeMinutes || 3;
                const hourlyRate = parseFloat(String(template.roiHourlyRate || "80"));
                
                const manualTime = baseTime + (docCount * timePerDoc);
                const savedMinutes = manualTime - ki2goTime;
                const savedMoney = (savedMinutes / 60) * hourlyRate;
                
                return (
                  <p className="text-xs text-muted-foreground">
                    Geschätzte Ersparnis: <span className="font-semibold text-green-600">{savedMinutes} Minuten</span>
                    {" "}≈{" "}
                    <span className="font-semibold text-green-600">€{savedMoney.toFixed(0)}</span>
                    {" "}(bei €{hourlyRate}/h)
                  </p>
                );
              })()}
            </div>
            <Sparkles className="h-5 w-5 text-green-500 animate-pulse" />
          </div>
        </div>
      )}

      {/* Ergebnis-Inhalt - mit explizitem Scrolling */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {execution.result ? (
              <Streamdown>{execution.result}</Streamdown>
            ) : (
              <p className="text-muted-foreground">Kein Ergebnis verfügbar.</p>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      {template?.disclaimer && (
        <div className="mx-3 mb-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Wichtiger Hinweis</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 whitespace-pre-wrap">{template.disclaimer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <PageHeader title={template?.title || "Ergebnis"} />
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/verlauf")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-lg"
                style={{ backgroundColor: `${template?.color || "#3b82f6"}20` }}
              >
                <DynamicIcon
                  name={template?.icon || "FileText"}
                  className="h-6 w-6"
                  style={{ color: template?.color ?? undefined }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">{template?.title || "Aufgabe"}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(execution.createdAt).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <Badge variant={execution.status === "completed" ? "default" : "secondary"}>
                    {execution.status === "completed" ? "Abgeschlossen" : execution.status}
                  </Badge>
                  {hasDocuments && (
                    <Badge variant="outline">
                      <FileText className="h-3 w-3 mr-1" />
                      {documents.length} Dokument{documents.length > 1 ? "e" : ""}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <Button
              variant={viewMode === "split" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("split")}
              className="gap-1.5"
            >
              <SplitSquareHorizontal className="h-4 w-4" />
              Split
            </Button>
            <Button
              variant={viewMode === "document" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("document")}
              className="gap-1.5"
              disabled={!hasDocuments}
            >
              <PanelLeftClose className="h-4 w-4" />
              Dokument
            </Button>
            <Button
              variant={viewMode === "result" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("result")}
              className="gap-1.5"
            >
              <PanelRightClose className="h-4 w-4" />
              Ergebnis
            </Button>
          </div>
        </div>

        {/* Main Content - Split View */}
        <div className={`grid gap-6 ${viewMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {/* Dokument Panel */}
          {(viewMode === "split" || viewMode === "document") && (
            <Card className="overflow-hidden">
              <CardHeader className="py-3 px-4 border-b bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Eingabe-Dokument
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100vh-300px)] min-h-[500px] max-h-[800px]">
                <DocumentViewer />
              </CardContent>
            </Card>
          )}

          {/* Ergebnis Panel */}
          {(viewMode === "split" || viewMode === "result") && (
            <Card className="overflow-hidden">
              <CardHeader className="py-3 px-4 border-b bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generiertes Ergebnis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100vh-300px)] min-h-[500px] max-h-[800px] overflow-hidden flex flex-col">
                <ResultViewer />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Zeit-Ersparnis Info */}
        {template?.estimatedTimeSavings && (
          <Card className="mt-6 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-green-700 dark:text-green-300">
                  ~{template.estimatedTimeSavings} Minuten gespart
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Diese Aufgabe hätte manuell deutlich länger gedauert.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback Section - Erweitert mit Kommentarfeld und Verbesserungsvorschlägen */}
        <Card className="mt-6 border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Bewertung & Feedback
            </CardTitle>
            <CardDescription>
              Ihre Rückmeldung hilft uns, die Ergebnisse kontinuierlich zu verbessern.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Quick Rating - Große klickbare Buttons */}
            {!showFeedbackForm && !execution.feedback && (
              <div className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                  Wie zufrieden sind Sie mit diesem Ergebnis?
                </p>
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => {
                      setFeedbackRating("positive");
                      setShowFeedbackForm(true);
                    }}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-transparent hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all group"
                  >
                    <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/50 group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                      <ThumbsUp className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-base font-semibold text-green-700 dark:text-green-300">Hilfreich</span>
                    <span className="text-xs text-muted-foreground">Das Ergebnis war nützlich</span>
                  </button>
                  <button
                    onClick={() => {
                      setFeedbackRating("negative");
                      setShowFeedbackForm(true);
                    }}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-transparent hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all group"
                  >
                    <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/50 group-hover:bg-red-200 dark:group-hover:bg-red-800 transition-colors">
                      <ThumbsDown className="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-base font-semibold text-red-700 dark:text-red-300">Nicht hilfreich</span>
                    <span className="text-xs text-muted-foreground">Verbesserung nötig</span>
                  </button>
                </div>
              </div>
            )}

            {/* Detailed Feedback Form - Erweitert */}
            {showFeedbackForm && (
              <div className="space-y-6">
                {/* Rating Display mit Änderungsmöglichkeit */}
                <div className="flex items-center justify-center gap-6 p-4 bg-muted/30 rounded-xl">
                  <button
                    onClick={() => setFeedbackRating("positive")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      feedbackRating === "positive" 
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 ring-2 ring-green-500" 
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <ThumbsUp className="h-6 w-6" />
                    <span className="font-medium">Hilfreich</span>
                  </button>
                  <button
                    onClick={() => setFeedbackRating("negative")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      feedbackRating === "negative" 
                        ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 ring-2 ring-red-500" 
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <ThumbsDown className="h-6 w-6" />
                    <span className="font-medium">Nicht hilfreich</span>
                  </button>
                </div>

                {/* Kommentar zum Ergebnis */}
                <div className="space-y-2">
                  <Label htmlFor="feedbackComment" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Kommentar zum Ergebnis
                  </Label>
                  <Textarea
                    id="feedbackComment"
                    placeholder="Was hat Ihnen gefallen oder nicht gefallen? Beschreiben Sie Ihre Erfahrung..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Verbesserungsvorschläge */}
                <div className="space-y-2">
                  <Label htmlFor="improvement" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Verbesserungsvorschläge
                    <Badge variant="outline" className="ml-2 text-xs">Wichtig für uns</Badge>
                  </Label>
                  <Textarea
                    id="improvement"
                    placeholder="Wie könnten wir das Ergebnis verbessern? z.B.:
• Mehr Details zu bestimmten Punkten
• Andere Struktur oder Format
• Zusätzliche Informationen berücksichtigen
• Sprache oder Ton anpassen"
                    value={improvementSuggestion}
                    onChange={(e) => setImprovementSuggestion(e.target.value)}
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ihre Vorschläge helfen uns, die KI-Ergebnisse kontinuierlich zu optimieren.
                  </p>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowFeedbackForm(false);
                      setFeedbackRating(null);
                      setFeedbackText("");
                      setImprovementSuggestion("");
                    }}
                  >
                    Abbrechen
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Nur Rating senden ohne Kommentar
                        submitFeedback();
                      }}
                      disabled={feedbackMutation.isPending || feedbackRating === null}
                    >
                      Nur Bewertung senden
                    </Button>
                    <Button
                      onClick={submitFeedback}
                      disabled={feedbackMutation.isPending || feedbackRating === null}
                      className="bg-primary"
                    >
                      {feedbackMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">●</span>
                          Wird gesendet...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Feedback senden
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Already Rated - Erweiterte Anzeige */}
            {execution.feedback && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-6 p-6 bg-muted/30 rounded-xl">
                  <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                    execution.feedback.rating === "positive" 
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" 
                      : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                  }`}>
                    {execution.feedback.rating === "positive" ? (
                      <ThumbsUp className="h-6 w-6" />
                    ) : (
                      <ThumbsDown className="h-6 w-6" />
                    )}
                    <span className="font-medium">
                      {execution.feedback.rating === "positive" ? "Als hilfreich bewertet" : "Als nicht hilfreich bewertet"}
                    </span>
                  </div>
                </div>
                
                {execution.feedback.improvementSuggestion && (
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Ihr Verbesserungsvorschlag:
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                      "{execution.feedback.improvementSuggestion}"
                    </p>
                  </div>
                )}
                
                <div className="text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Vielen Dank für Ihre Bewertung! Ihr Feedback hilft uns, besser zu werden.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => navigate("/verlauf")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zum Verlauf
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/aufgaben")}>
              Weitere Aufgabe
            </Button>
            <Button onClick={() => navigate(`/aufgabe/${template?.slug}`)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Erneut ausführen
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
