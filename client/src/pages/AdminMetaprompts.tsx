import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  StarOff,
  Loader2,
  Wand2,
  FileText,
  Copy,
  Upload,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

export default function AdminMetaprompts() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMetaprompt, setSelectedMetaprompt] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    template: "",
    targetAudience: "",
    outputStyle: "",
    isDefault: false,
  });
  
  // Import State
  const [importText, setImportText] = useState("");
  const [importIssues, setImportIssues] = useState<string[]>([]);
  const [importSuggestions, setImportSuggestions] = useState<string[]>([]);
  const [isImportProcessed, setIsImportProcessed] = useState(false);
  const [activeCreateTab, setActiveCreateTab] = useState("manual");

  // Queries
  const { data: metaprompts, isLoading, refetch } = trpc.metaprompt.list.useQuery();

  // Mutations
  const createMutation = trpc.metaprompt.create.useMutation({
    onSuccess: () => {
      toast.success("Metaprompt erfolgreich erstellt");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Erstellen");
    },
  });

  const updateMutation = trpc.metaprompt.update.useMutation({
    onSuccess: () => {
      toast.success("Metaprompt erfolgreich aktualisiert");
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Aktualisieren");
    },
  });

  const deleteMutation = trpc.metaprompt.delete.useMutation({
    onSuccess: () => {
      toast.success("Metaprompt erfolgreich gelöscht");
      setIsDeleteDialogOpen(false);
      setSelectedMetaprompt(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Löschen");
    },
  });

  const setDefaultMutation = trpc.metaprompt.setDefault.useMutation({
    onSuccess: () => {
      toast.success("Standard-Metaprompt festgelegt");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Festlegen");
    },
  });
  
  // Import Mutation
  const importMutation = trpc.metaprompt.importAndFormat.useMutation({
    onSuccess: (data) => {
      setFormData(prev => ({
        ...prev,
        template: data.formattedText,
      }));
      setImportIssues(data.issues || []);
      setImportSuggestions(data.suggestions || []);
      setIsImportProcessed(true);
      toast.success("Metaprompt erfolgreich formatiert");
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Importieren");
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

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      template: "",
      targetAudience: "",
      outputStyle: "",
      isDefault: false,
    });
    setImportText("");
    setImportIssues([]);
    setImportSuggestions([]);
    setIsImportProcessed(false);
    setActiveCreateTab("manual");
  };
  
  const handleImport = () => {
    if (!importText.trim()) {
      toast.error("Bitte fügen Sie ein Metaprompt ein");
      return;
    }
    importMutation.mutate({
      rawText: importText,
      promptType: 'metaprompt',
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim() || !formData.template.trim()) {
      toast.error("Name und Template sind erforderlich");
      return;
    }
    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      template: formData.template,
      targetAudience: formData.targetAudience || undefined,
      outputStyle: formData.outputStyle || undefined,
      isDefault: formData.isDefault,
    });
  };

  const handleUpdate = () => {
    if (!selectedMetaprompt) return;
    if (!formData.name.trim() || !formData.template.trim()) {
      toast.error("Name und Template sind erforderlich");
      return;
    }
    updateMutation.mutate({
      id: selectedMetaprompt.id,
      name: formData.name,
      description: formData.description || undefined,
      template: formData.template,
      targetAudience: formData.targetAudience || undefined,
      outputStyle: formData.outputStyle || undefined,
    });
  };

  const openEditDialog = (metaprompt: any) => {
    setSelectedMetaprompt(metaprompt);
    setFormData({
      name: metaprompt.name || "",
      description: metaprompt.description || "",
      template: metaprompt.template || "",
      targetAudience: metaprompt.targetAudience || "",
      outputStyle: metaprompt.outputStyle || "",
      isDefault: metaprompt.isDefault === 1,
    });
    setIsEditDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("In Zwischenablage kopiert");
  };

  // Variablen aus Template extrahieren
  const extractVariables = (template: string): string[] => {
    const regex = /\{\{([A-Z_][A-Z0-9_]*)\}\}/g;
    const variables: string[] = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const renderFormFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="z.B. KI2GO Standard Metaprompt V2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Kurze Beschreibung des Metaprompts..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="template">Metaprompt-Template *</Label>
        <Textarea
          id="template"
          value={formData.template}
          onChange={(e) => setFormData({ ...formData, template: e.target.value })}
          placeholder="# {{AUFGABE}}&#10;&#10;## Deine Rolle&#10;Du bist ein erfahrener {{EXPERTEN_ROLLE}}..."
          rows={15}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Verwenden Sie {"{{VARIABLE_NAME}}"} für Platzhalter (Großbuchstaben mit Unterstrichen)
        </p>
      </div>

      {formData.template && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Erkannte Variablen:</p>
          <div className="flex flex-wrap gap-2">
            {extractVariables(formData.template).map((variable) => (
              <Badge key={variable} variant="secondary" className="font-mono">
                {`{{${variable}}}`}
              </Badge>
            ))}
            {extractVariables(formData.template).length === 0 && (
              <span className="text-sm text-muted-foreground">Keine Variablen gefunden</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="targetAudience">Zielgruppe</Label>
          <Input
            id="targetAudience"
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            placeholder="z.B. Unternehmen und Geschäftsführer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="outputStyle">Ausgabe-Stil</Label>
          <Input
            id="outputStyle"
            value={formData.outputStyle}
            onChange={(e) => setFormData({ ...formData, outputStyle: e.target.value })}
            placeholder="z.B. Professioneller Business-Report"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                Metaprompt-Verwaltung
              </h1>
              <p className="text-sm text-muted-foreground">
                Erstellen und verwalten Sie Metaprompt-Templates für den Superprompt-Generator
              </p>
            </div>
            <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Metaprompt
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Metaprompts ({metaprompts?.length || 0})
            </CardTitle>
            <CardDescription>
              Metaprompts sind die Basis-Templates, die der Generator verwendet, um Superprompts zu erstellen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : metaprompts?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine Metaprompts vorhanden</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}
                >
                  Erstes Metaprompt erstellen
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Variablen</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metaprompts?.map((metaprompt) => (
                    <TableRow key={metaprompt.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{metaprompt.name}</span>
                          {metaprompt.isDefault === 1 && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {metaprompt.description || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {extractVariables(metaprompt.template || "").slice(0, 3).map((v) => (
                            <Badge key={v} variant="outline" className="text-xs font-mono">
                              {v}
                            </Badge>
                          ))}
                          {extractVariables(metaprompt.template || "").length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{extractVariables(metaprompt.template || "").length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">v{metaprompt.version || 1}</Badge>
                      </TableCell>
                      <TableCell>
                        {metaprompt.isDefault === 1 ? (
                          <Badge className="bg-yellow-100 text-yellow-800">Standard</Badge>
                        ) : (
                          <Badge variant="outline">Aktiv</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(metaprompt)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(metaprompt.template || "")}>
                              <Copy className="h-4 w-4 mr-2" />
                              Template kopieren
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {metaprompt.isDefault !== 1 && (
                              <DropdownMenuItem onClick={() => setDefaultMutation.mutate({ id: metaprompt.id })}>
                                <Star className="h-4 w-4 mr-2" />
                                Als Standard setzen
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedMetaprompt(metaprompt);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Metaprompt erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein neues Metaprompt-Template für den Superprompt-Generator
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeCreateTab} onValueChange={setActiveCreateTab}>
            <div className="border-b mb-4">
              <TabsList className="flex h-12 items-center gap-0 bg-muted/30 p-1 rounded-lg w-full">
                <TabsTrigger 
                  value="manual" 
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                >
                  <Pencil className="h-4 w-4" />
                  Manuell erstellen
                </TabsTrigger>
                <TabsTrigger 
                  value="import" 
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                >
                  <Upload className="h-4 w-4" />
                  Aus LLM importieren
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="manual" className="mt-4">
              {renderFormFields()}
            </TabsContent>
            
            <TabsContent value="import" className="mt-4 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Metaprompt aus einer anderen KI importieren</p>
                    <p className="text-blue-700 mt-1">
                      Fügen Sie ein Metaprompt ein, das Sie mit ChatGPT, Claude oder einer anderen LLM erstellt haben.
                      Das System formatiert es automatisch und korrigiert Variablen-Formate.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="importText">Metaprompt einfügen</Label>
                <Textarea
                  id="importText"
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    setIsImportProcessed(false);
                  }}
                  placeholder="Fügen Sie hier das Metaprompt aus einer anderen KI ein...\n\nDas Metaprompt sollte {{AUFGABE}} als Platzhalter für die Aufgabenbeschreibung enthalten."
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {importText.length} Zeichen
                </p>
              </div>
              
              <Button 
                onClick={handleImport} 
                disabled={importMutation.isPending || !importText.trim()}
                className="w-full"
              >
                {importMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Formatiere...</>
                ) : (
                  <><Wand2 className="h-4 w-4 mr-2" /> Formatieren & Validieren</>
                )}
              </Button>
              
              {isImportProcessed && (
                <>
                  <Separator />
                  
                  {importIssues.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Korrigierte Probleme:</p>
                          <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                            {importIssues.map((issue, i) => (
                              <li key={i}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {importSuggestions.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Verbesserungsvorschläge:</p>
                          <ul className="text-xs text-blue-700 mt-1 space-y-1">
                            {importSuggestions.map((suggestion, i) => (
                              <li key={i}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Formatiertes Metaprompt bereit</p>
                        <p className="text-xs text-green-700 mt-1">
                          Das Metaprompt wurde erfolgreich formatiert. Geben Sie unten einen Namen ein und klicken Sie auf "Erstellen".
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {renderFormFields()}
                </>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={createMutation.isPending || (activeCreateTab === 'import' && !isImportProcessed)}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Metaprompt bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie das Metaprompt-Template
            </DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Metaprompt löschen</DialogTitle>
          </DialogHeader>
          <p>
            Sind Sie sicher, dass Sie das Metaprompt "{selectedMetaprompt?.name}" löschen möchten?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedMetaprompt && deleteMutation.mutate({ id: selectedMetaprompt.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
