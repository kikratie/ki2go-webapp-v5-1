import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { 
  Wand2, 
  Sparkles, 
  Save, 
  ArrowLeft, 
  Variable, 
  FileText, 
  Settings,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Copy,
  Check,
  AlertCircle,
  Eye,
  Upload,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Calculator,
  Clock,
  Euro,
  TrendingUp
} from "lucide-react";

// Variable-Typ Icons
const variableTypeIcons: Record<string, React.ReactNode> = {
  text: <FileText className="h-4 w-4" />,
  textarea: <FileText className="h-4 w-4" />,
  number: <span className="text-xs font-mono">#</span>,
  select: <span className="text-xs">▼</span>,
  file: <FileText className="h-4 w-4" />,
  multiselect: <span className="text-xs">☑</span>,
  date: <span className="text-xs">📅</span>,
};

interface VariableSchema {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'file' | 'multiselect' | 'date';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
}

export default function AdminGenerator() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Form State
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedMetapromptId, setSelectedMetapromptId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedBusinessAreaId, setSelectedBusinessAreaId] = useState<string>("");
  
  // Generated Result State
  const [generatedSuperprompt, setGeneratedSuperprompt] = useState("");
  const [variableSchema, setVariableSchema] = useState<VariableSchema[]>([]);
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [suggestedSlug, setSuggestedSlug] = useState("");
  const [metapromptUsed, setMetapromptUsed] = useState("");
  
  // UI State
  const [activeTab, setActiveTab] = useState("input");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveSlug, setSaveSlug] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [estimatedTimeSavings, setEstimatedTimeSavings] = useState<number>(30);
  
  // Import State
  const [importText, setImportText] = useState("");
  const [importTaskDescription, setImportTaskDescription] = useState("");
  const [importIssues, setImportIssues] = useState<string[]>([]);
  const [importSuggestions, setImportSuggestions] = useState<string[]>([]);
  
  // Custom Metaprompt State (für "Metaprompt aus LLM einfügen")
  const [customMetaprompt, setCustomMetaprompt] = useState("");
  const [showCustomMetapromptInput, setShowCustomMetapromptInput] = useState(false);
  
  // ROI-Kalkulation State
  const [roiBaseTimeMinutes, setRoiBaseTimeMinutes] = useState<number>(30);
  const [roiTimePerDocumentMinutes, setRoiTimePerDocumentMinutes] = useState<number>(15);
  const [roiKi2goTimeMinutes, setRoiKi2goTimeMinutes] = useState<number>(3);
  const [roiHourlyRate, setRoiHourlyRate] = useState<number>(80);
  
  // Öffentlich-Einstellung
  const [isPublic, setIsPublic] = useState<boolean>(false);
  
  // Organisations-Zuweisung
  const [assignToOrganization, setAssignToOrganization] = useState<string>("");
  
  // Data Queries
  const { data: metaprompts, isLoading: metapromptsLoading } = trpc.metaprompt.list.useQuery();
  const { data: organizations } = trpc.organization.list.useQuery();
  const { data: categories, isLoading: categoriesLoading } = trpc.category.list.useQuery();
  const { data: businessAreas, isLoading: areasLoading } = trpc.businessArea.list.useQuery();
  
  // Mutations
  const generateMutation = trpc.metaprompt.generateSuperprompt.useMutation({
    onSuccess: (data) => {
      setGeneratedSuperprompt(data.superprompt);
      setVariableSchema(data.variableSchema as VariableSchema[]);
      setSuggestedTitle(data.suggestedTitle);
      setSuggestedSlug(data.suggestedSlug);
      setMetapromptUsed(data.metapromptUsed);
      setSaveTitle(data.suggestedTitle);
      setSaveSlug(data.suggestedSlug);
      setActiveTab("result");
      toast.success("Superprompt erfolgreich generiert!");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
  
  const saveMutation = trpc.metaprompt.saveAsTemplate.useMutation({
    onSuccess: (data) => {
      toast.success("Template erfolgreich gespeichert!");
      setShowSaveDialog(false);
      navigate(`/admin/templates`);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
  
  // Import Mutations
  const importMutation = trpc.metaprompt.importAndFormat.useMutation({
    onSuccess: (data) => {
      setGeneratedSuperprompt(data.formattedText);
      setVariableSchema(data.variableSchema as VariableSchema[]);
      setSuggestedTitle(data.suggestedTitle);
      setSuggestedSlug(data.suggestedSlug);
      setSaveTitle(data.suggestedTitle);
      setSaveSlug(data.suggestedSlug);
      setImportIssues(data.issues);
      setImportSuggestions(data.suggestions);
      setMetapromptUsed('Importiert (ohne Metaprompt)');
      setActiveTab("result");
      if (data.issues.length > 0) {
        toast.info(`Import abgeschlossen mit ${data.issues.length} Hinweisen`);
      } else {
        toast.success("Superprompt erfolgreich importiert und formatiert!");
      }
    },
    onError: (error) => {
      toast.error(`Import-Fehler: ${error.message}`);
    },
  });
  
  const improveMutation = trpc.metaprompt.improvePrompt.useMutation({
    onSuccess: (data) => {
      setGeneratedSuperprompt(data.improvedText);
      const variables = data.variables;
      // Variablen-Schema neu generieren
      setVariableSchema(variables.map(v => ({
        key: v,
        label: v.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
        type: 'text' as const,
        required: true,
      })));
      setImportIssues(data.issues);
      setImportSuggestions(data.suggestions);
      toast.success("Superprompt wurde verbessert!");
    },
    onError: (error) => {
      toast.error(`Verbesserung fehlgeschlagen: ${error.message}`);
    },
  });
  
  // Auth Check
  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'owner'))) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return null;
  }
  
  const handleGenerate = () => {
    if (!taskDescription.trim()) {
      toast.error("Bitte geben Sie eine Aufgabenbeschreibung ein");
      return;
    }
    
    generateMutation.mutate({
      taskDescription,
      metapromptId: selectedMetapromptId && selectedMetapromptId !== 'default' && selectedMetapromptId !== 'custom' ? parseInt(selectedMetapromptId) : undefined,
      customMetaprompt: selectedMetapromptId === 'custom' && customMetaprompt.trim() ? customMetaprompt : undefined,
      categoryId: selectedCategoryId ? parseInt(selectedCategoryId) : undefined,
      businessAreaId: selectedBusinessAreaId ? parseInt(selectedBusinessAreaId) : undefined,
    });
  };
  
  const handleImport = () => {
    if (!importText.trim()) {
      toast.error("Bitte fügen Sie einen Superprompt ein");
      return;
    }
    
    importMutation.mutate({
      rawText: importText,
      promptType: 'superprompt',
      taskDescription: importTaskDescription || undefined,
    });
  };
  
  const handleImprove = () => {
    if (!generatedSuperprompt.trim()) {
      toast.error("Kein Superprompt zum Verbessern vorhanden");
      return;
    }
    
    improveMutation.mutate({
      rawText: generatedSuperprompt,
      promptType: 'superprompt',
      taskDescription: taskDescription || importTaskDescription || undefined,
    });
  };
  
  const handleSave = () => {
    if (!saveTitle.trim() || !saveSlug.trim()) {
      toast.error("Titel und Slug sind erforderlich");
      return;
    }
    
    // Stelle sicher dass variableSchema ein Array ist (nicht null oder undefined)
    const safeVariableSchema = Array.isArray(variableSchema) ? variableSchema : [];
    
    // Validiere jede Variable und stelle sicher dass options ein Array ist
    const validatedSchema = safeVariableSchema.map(v => ({
      ...v,
      options: Array.isArray(v.options) ? v.options : [],
    }));
    
    saveMutation.mutate({
      title: saveTitle,
      slug: saveSlug,
      description: saveDescription,
      superprompt: generatedSuperprompt,
      variableSchema: validatedSchema,
      categoryId: selectedCategoryId ? parseInt(selectedCategoryId) : undefined,
      businessAreaId: selectedBusinessAreaId ? parseInt(selectedBusinessAreaId) : undefined,
      estimatedTimeSavings,
      // ROI-Kalkulation
      roiBaseTimeMinutes,
      roiTimePerDocumentMinutes,
      roiKi2goTimeMinutes,
      roiHourlyRate,
      // Öffentlich-Einstellung
      isPublic: isPublic ? 1 : 0,
      // Organisations-Zuweisung
      assignToOrganizationId: assignToOrganization && assignToOrganization !== "none" ? parseInt(assignToOrganization) : undefined,
    });
  };
  
  const updateVariable = (index: number, field: keyof VariableSchema, value: any) => {
    const updated = [...variableSchema];
    updated[index] = { ...updated[index], [field]: value };
    setVariableSchema(updated);
  };
  
  const removeVariable = (index: number) => {
    setVariableSchema(variableSchema.filter((_, i) => i !== index));
  };
  
  const addVariable = () => {
    setVariableSchema([
      ...variableSchema,
      {
        key: `NEUE_VARIABLE_${variableSchema.length + 1}`,
        label: "Neue Variable",
        type: "text",
        required: true,
      }
    ]);
  };
  
  const insertVariableIntoPrompt = (variableKey: string) => {
    setGeneratedSuperprompt(prev => prev + `{{${variableKey}}}`);
    toast.success(`Variable {{${variableKey}}} eingefügt`);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("In Zwischenablage kopiert");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Wand2 className="h-6 w-6 text-primary" />
                  Superprompt Generator
                </h1>
                <p className="text-muted-foreground">
                  KI-gestützte Erstellung von Superprompts aus Aufgabenbeschreibungen
                </p>
              </div>
            </div>
            {generatedSuperprompt && (
              <Button onClick={() => setShowSaveDialog(true)} className="gap-2">
                <Save className="h-4 w-4" />
                Als Template speichern
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b mb-6">
            <TabsList className="flex h-12 items-center gap-0 bg-muted/30 p-1 rounded-lg w-full max-w-3xl">
              <TabsTrigger 
                value="input" 
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
                <Sparkles className="h-4 w-4" />
                Generator
              </TabsTrigger>
              <TabsTrigger 
                value="import" 
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
                <Upload className="h-4 w-4" />
                Import
              </TabsTrigger>
              <TabsTrigger 
                value="result" 
                disabled={!generatedSuperprompt} 
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                Ergebnis
              </TabsTrigger>
              <TabsTrigger 
                value="variables" 
                disabled={!generatedSuperprompt} 
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all disabled:opacity-50"
              >
                <Variable className="h-4 w-4" />
                Variablen ({variableSchema.length})
              </TabsTrigger>
              <TabsTrigger 
                value="roi" 
                disabled={!generatedSuperprompt} 
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all disabled:opacity-50"
              >
                <Calculator className="h-4 w-4" />
                ROI
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Eingabe Tab */}
          <TabsContent value="input">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Linke Seite: Eingabe */}
              <Card>
                <CardHeader>
                  <CardTitle>Aufgabenbeschreibung</CardTitle>
                  <CardDescription>
                    Beschreiben Sie die Aufgabe, für die ein Superprompt erstellt werden soll
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="taskDescription">Was soll die KI tun? *</Label>
                    <Textarea
                      id="taskDescription"
                      placeholder="z.B. 'Analysiere Mietverträge auf rechtliche Risiken und unklare Formulierungen. Der Benutzer soll den Vertragstyp auswählen und das Dokument hochladen können.'"
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Je detaillierter die Beschreibung, desto besser der generierte Superprompt
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="metaprompt">Metaprompt-Template (optional)</Label>
                    <Select 
                      value={selectedMetapromptId} 
                      onValueChange={(value) => {
                        setSelectedMetapromptId(value);
                        setShowCustomMetapromptInput(value === 'custom');
                        if (value !== 'custom') setCustomMetaprompt('');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Standard-Template verwenden" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Standard-Template verwenden</SelectItem>
                        {metaprompts?.map((mp) => (
                          <SelectItem key={mp.id} value={mp.id.toString()}>
                            {mp.name} {mp.isDefault ? "(Standard)" : ""}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom" className="text-primary font-medium">
                          <span className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Metaprompt aus LLM einfügen
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Custom Metaprompt Eingabefeld */}
                  {showCustomMetapromptInput && (
                    <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                      <Label htmlFor="customMetaprompt" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Metaprompt aus LLM einfügen
                      </Label>
                      <Textarea
                        id="customMetaprompt"
                        value={customMetaprompt}
                        onChange={(e) => setCustomMetaprompt(e.target.value)}
                        placeholder="Fügen Sie hier Ihr extern erstelltes Metaprompt ein (z.B. aus ChatGPT, Claude, etc.)...\n\nDas Metaprompt sollte {{AUFGABE}} als Platzhalter für die Aufgabenbeschreibung enthalten."
                        rows={8}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {customMetaprompt.length} Zeichen • Variablen werden automatisch erkannt und formatiert
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategorie</Label>
                      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Auswählen..." />
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
                      <Select value={selectedBusinessAreaId} onValueChange={setSelectedBusinessAreaId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Auswählen..." />
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
                  
                  <Button 
                    onClick={handleGenerate} 
                    className="w-full gap-2"
                    disabled={generateMutation.isPending || !taskDescription.trim()}
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generiere...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Superprompt generieren
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Rechte Seite: Tipps */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipps für gute Ergebnisse</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Beschreiben Sie:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Was genau soll analysiert/erstellt werden?</li>
                      <li>Welche Eingaben braucht der Benutzer?</li>
                      <li>Welches Format soll das Ergebnis haben?</li>
                      <li>Gibt es besondere Anforderungen?</li>
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Beispiele:</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => setTaskDescription("Analysiere Mietverträge auf rechtliche Risiken, unklare Formulierungen und fehlende Klauseln. Der Benutzer soll den Vertragstyp (Wohnung, Gewerbe, Stellplatz) auswählen und das Dokument als PDF hochladen können. Das Ergebnis soll strukturiert mit Risikobewertung und Handlungsempfehlungen sein.")}
                      >
                        <FileText className="h-4 w-4 mr-2 shrink-0" />
                        <span className="text-xs">Mietvertrag prüfen</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => setTaskDescription("Erstelle professionelle Geschäftsbriefe basierend auf Anlass, Empfänger und Kernbotschaft. Der Benutzer soll den Brieftyp (Angebot, Mahnung, Kündigung, Anfrage) und den Tonfall (formal, freundlich, bestimmt) wählen können. Das Ergebnis soll ein vollständiger Brief mit Betreff, Anrede und Grußformel sein.")}
                      >
                        <FileText className="h-4 w-4 mr-2 shrink-0" />
                        <span className="text-xs">Geschäftsbrief erstellen</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => setTaskDescription("Analysiere Jahresabschlüsse und Bilanzen auf finanzielle Kennzahlen, Trends und Auffälligkeiten. Der Benutzer soll das Dokument hochladen und den Fokus (Liquidität, Rentabilität, Verschuldung) angeben können. Das Ergebnis soll eine übersichtliche Analyse mit Grafiken und Handlungsempfehlungen sein.")}
                      >
                        <FileText className="h-4 w-4 mr-2 shrink-0" />
                        <span className="text-xs">Bilanzanalyse</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Linke Seite: Import-Eingabe */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Superprompt importieren
                  </CardTitle>
                  <CardDescription>
                    Fügen Sie einen extern erstellten Superprompt ein (z.B. aus ChatGPT, Claude, etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="importText">Superprompt einfügen *</Label>
                    <Textarea
                      id="importText"
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="Fügen Sie hier Ihren Superprompt ein...\n\nVariablen können in verschiedenen Formaten sein:\n- {{VARIABLE}}\n- {variable}\n- [variable]\n- <variable>\n- $variable"
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {importText.length} Zeichen
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="importTaskDescription">Aufgabenbeschreibung (optional)</Label>
                    <Textarea
                      id="importTaskDescription"
                      value={importTaskDescription}
                      onChange={(e) => setImportTaskDescription(e.target.value)}
                      placeholder="Beschreiben Sie kurz, wofür dieser Superprompt verwendet wird. Dies hilft bei der Generierung besserer Variablen-Vorschläge."
                      rows={3}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleImport} 
                    disabled={importMutation.isPending || !importText.trim()}
                    className="w-full gap-2"
                  >
                    {importMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Wird verarbeitet...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Importieren & Formatieren
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Rechte Seite: Hinweise */}
              <Card>
                <CardHeader>
                  <CardTitle>So funktioniert der Import</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Automatische Formatierung
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Verschiedene Variablen-Formate werden automatisch erkannt und in das richtige Format <code className="bg-muted px-1 rounded">{'{{VARIABLE}}'}</code> konvertiert.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Intelligente Variablen-Erkennung
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Für jede erkannte Variable werden automatisch passende Labels, Typen, Platzhalter und Hilfe-Texte vorgeschlagen.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-blue-500" />
                      KI-Verbesserung
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Nach dem Import können Sie den Superprompt mit KI-Unterstützung weiter verbessern lassen.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Unterstützte Formate:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <code className="bg-muted px-2 py-1 rounded">{'{{VARIABLE}}'}</code>
                      <code className="bg-muted px-2 py-1 rounded">{'{variable}'}</code>
                      <code className="bg-muted px-2 py-1 rounded">{'[variable]'}</code>
                      <code className="bg-muted px-2 py-1 rounded">{'<variable>'}</code>
                      <code className="bg-muted px-2 py-1 rounded">{'$variable'}</code>
                      <code className="bg-muted px-2 py-1 rounded">{'%variable%'}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ergebnis Tab */}
          <TabsContent value="result">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Superprompt Editor */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Generierter Superprompt</CardTitle>
                      <CardDescription>
                        Basierend auf: {metapromptUsed}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleImprove}
                        disabled={improveMutation.isPending}
                      >
                        {improveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Mit KI verbessern
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedSuperprompt)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Kopieren
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Import-Hinweise anzeigen */}
                {(importIssues.length > 0 || importSuggestions.length > 0) && (
                  <div className="px-6 pb-4 space-y-3">
                    {importIssues.length > 0 && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4" />
                          Hinweise ({importIssues.length})
                        </h4>
                        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                          {importIssues.map((issue, i) => (
                            <li key={i}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {importSuggestions.length > 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2 mb-2">
                          <Lightbulb className="h-4 w-4" />
                          Empfehlungen ({importSuggestions.length})
                        </h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          {importSuggestions.map((suggestion, i) => (
                            <li key={i}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <CardContent>
                  <Textarea
                    value={generatedSuperprompt}
                    onChange={(e) => setGeneratedSuperprompt(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>

              {/* Variablen-Übersicht */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Variable className="h-5 w-5" />
                    Erkannte Variablen
                  </CardTitle>
                  <CardDescription>
                    Klicken zum Einfügen in den Prompt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {variableSchema.map((variable, index) => (
                        <div 
                          key={index}
                          className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => insertVariableIntoPrompt(variable.key)}
                        >
                          <div className="flex items-center justify-between">
                            <code className="text-sm font-mono text-primary">
                              {`{{${variable.key}}}`}
                            </code>
                            <Badge variant="outline" className="text-xs">
                              {variable.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {variable.label}
                          </p>
                        </div>
                      ))}
                      {variableSchema.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Keine Variablen erkannt
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Variablen Tab */}
          <TabsContent value="variables">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Variablen-Schema bearbeiten</CardTitle>
                    <CardDescription>
                      Definieren Sie die Eingabefelder für Benutzer
                    </CardDescription>
                  </div>
                  <Button onClick={addVariable} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Variable hinzufügen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {variableSchema.map((variable, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {`{{${variable.key}}}`}
                          </code>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeVariable(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Schlüssel</Label>
                          <Input
                            value={variable.key}
                            onChange={(e) => updateVariable(index, 'key', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                            className="font-mono"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Label</Label>
                          <Input
                            value={variable.label}
                            onChange={(e) => updateVariable(index, 'label', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Typ</Label>
                          <Select 
                            value={variable.type} 
                            onValueChange={(value) => updateVariable(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="textarea">Textbereich</SelectItem>
                              <SelectItem value="number">Zahl</SelectItem>
                              <SelectItem value="select">Auswahl</SelectItem>
                              <SelectItem value="multiselect">Mehrfachauswahl</SelectItem>
                              <SelectItem value="file">Datei</SelectItem>
                              <SelectItem value="date">Datum</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Erforderlich</Label>
                          <Select 
                            value={variable.required ? "true" : "false"} 
                            onValueChange={(value) => updateVariable(index, 'required', value === "true")}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Ja</SelectItem>
                              <SelectItem value="false">Nein</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Platzhalter</Label>
                          <Input
                            value={variable.placeholder || ''}
                            onChange={(e) => updateVariable(index, 'placeholder', e.target.value)}
                            placeholder="z.B. 'Geben Sie hier ein...'"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Hilfetext</Label>
                          <Input
                            value={variable.helpText || ''}
                            onChange={(e) => updateVariable(index, 'helpText', e.target.value)}
                            placeholder="Erklärung für den Benutzer"
                          />
                        </div>
                      </div>
                      
                      {(variable.type === 'select' || variable.type === 'multiselect') && (
                        <div className="space-y-2">
                          <Label>Optionen (eine pro Zeile)</Label>
                          <Textarea
                            value={variable.options?.join('\n') || ''}
                            onChange={(e) => updateVariable(index, 'options', e.target.value.split('\n').filter(o => o.trim()))}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {variableSchema.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Variable className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Keine Variablen definiert</p>
                      <Button onClick={addVariable} variant="outline" className="mt-4 gap-2">
                        <Plus className="h-4 w-4" />
                        Erste Variable hinzufügen
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROI-Kalkulation Tab */}
          <TabsContent value="roi">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Linke Seite: ROI-Eingabe */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    ROI-Kalkulation
                  </CardTitle>
                  <CardDescription>
                    Definieren Sie die Zeitersparnis-Parameter für dieses Template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="roiBaseTime" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Basis-Zeitaufwand (manuell)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="roiBaseTime"
                        type="number"
                        value={roiBaseTimeMinutes}
                        onChange={(e) => setRoiBaseTimeMinutes(parseInt(e.target.value) || 0)}
                        min={0}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">Minuten</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Grundzeit für die manuelle Bearbeitung ohne Dokumente
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roiTimePerDoc" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Zeit pro Dokument (manuell)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="roiTimePerDoc"
                        type="number"
                        value={roiTimePerDocumentMinutes}
                        onChange={(e) => setRoiTimePerDocumentMinutes(parseInt(e.target.value) || 0)}
                        min={0}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">Minuten pro Dokument</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Zusätzliche Zeit für jedes hochgeladene Dokument
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="roiKi2goTime" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      KI2GO Bearbeitungszeit
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="roiKi2goTime"
                        type="number"
                        value={roiKi2goTimeMinutes}
                        onChange={(e) => setRoiKi2goTimeMinutes(parseInt(e.target.value) || 0)}
                        min={1}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">Minuten</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Durchschnittliche Zeit für die KI-Verarbeitung
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roiHourlyRate" className="flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      Standard-Stundensatz
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="roiHourlyRate"
                        type="number"
                        value={roiHourlyRate}
                        onChange={(e) => setRoiHourlyRate(parseInt(e.target.value) || 0)}
                        min={0}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">€ / Stunde</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Basis für die Geldersparnis-Berechnung
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Rechte Seite: ROI-Vorschau */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    ROI-Vorschau
                  </CardTitle>
                  <CardDescription>
                    Berechnete Zeitersparnis basierend auf Dokumentenanzahl
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 1 Dokument */}
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="font-medium">1 Dokument</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Manuell:</p>
                        <p className="font-semibold">{roiBaseTimeMinutes + roiTimePerDocumentMinutes} Min.</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mit KI2GO:</p>
                        <p className="font-semibold">{roiKi2goTimeMinutes} Min.</p>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-green-700 dark:text-green-400 font-medium">
                        Ersparnis: {roiBaseTimeMinutes + roiTimePerDocumentMinutes - roiKi2goTimeMinutes} Min.
                      </span>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        € {Math.round((roiBaseTimeMinutes + roiTimePerDocumentMinutes - roiKi2goTimeMinutes) / 60 * roiHourlyRate)}
                      </Badge>
                    </div>
                  </div>

                  {/* 3 Dokumente */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">3 Dokumente</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Manuell:</p>
                        <p className="font-semibold">{roiBaseTimeMinutes + (roiTimePerDocumentMinutes * 3)} Min.</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mit KI2GO:</p>
                        <p className="font-semibold">{roiKi2goTimeMinutes + 2} Min.</p>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700 dark:text-blue-400 font-medium">
                        Ersparnis: {roiBaseTimeMinutes + (roiTimePerDocumentMinutes * 3) - (roiKi2goTimeMinutes + 2)} Min.
                      </span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        € {Math.round((roiBaseTimeMinutes + (roiTimePerDocumentMinutes * 3) - (roiKi2goTimeMinutes + 2)) / 60 * roiHourlyRate)}
                      </Badge>
                    </div>
                  </div>

                  {/* Monatliche Hochrechnung */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Monatliche Hochrechnung (10x Nutzung)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Zeitersparnis:</p>
                        <p className="font-semibold text-lg">
                          {Math.round((roiBaseTimeMinutes + roiTimePerDocumentMinutes - roiKi2goTimeMinutes) * 10 / 60)} Std.
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Geldersparnis:</p>
                        <p className="font-semibold text-lg text-purple-700 dark:text-purple-400">
                          € {Math.round((roiBaseTimeMinutes + roiTimePerDocumentMinutes - roiKi2goTimeMinutes) * 10 / 60 * roiHourlyRate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Diese Werte werden dem Benutzer bei der Aufgabenausführung angezeigt
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Als Template speichern</DialogTitle>
            <DialogDescription>
              Speichern Sie den generierten Superprompt als wiederverwendbares Template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="saveTitle">Titel *</Label>
              <Input
                id="saveTitle"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="z.B. 'Mietvertrag prüfen'"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="saveSlug">Slug *</Label>
              <Input
                id="saveSlug"
                value={saveSlug}
                onChange={(e) => setSaveSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="z.B. 'mietvertrag_pruefen'"
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="saveDescription">Beschreibung</Label>
              <Textarea
                id="saveDescription"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Kurze Beschreibung der Aufgabe..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeSavings">Geschätzte Zeitersparnis (Minuten)</Label>
              <Input
                id="timeSavings"
                type="number"
                value={estimatedTimeSavings}
                onChange={(e) => setEstimatedTimeSavings(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
            
            {/* Öffentlich-Einstellung */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div
                onClick={() => setIsPublic(!isPublic)}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                  isPublic
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                {isPublic && <Check className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <Label className="font-medium cursor-pointer" onClick={() => setIsPublic(!isPublic)}>
                  Öffentlich zugänglich
                </Label>
                <p className="text-xs text-muted-foreground">
                  Alle Benutzer können dieses Template verwenden (ohne Organisations-Freigabe)
                </p>
              </div>
            </div>
            
            {/* Organisations-Zuweisung */}
            {!isPublic && (
              <div className="space-y-2">
                <Label>Direkt einer Organisation zuweisen (optional)</Label>
                <Select value={assignToOrganization} onValueChange={setAssignToOrganization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Keine Zuweisung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Zuweisung</SelectItem>
                    {organizations?.map((org: any) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Das Template wird automatisch für die ausgewählte Organisation freigegeben
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Speichern
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
