import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { TemplateEditor } from "@/components/TemplateEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Archive,
  Star,
  Variable,
  X,
  GripVertical,
  Calculator,
  Clock,
  Euro,
  TrendingUp,
  Sparkles,
  Megaphone,
  Check,
  RefreshCw,
  Target,
  Tags,
} from "lucide-react";
import * as LucideIcons from "lucide-react";

// Icon-Auswahl für Templates
const TEMPLATE_ICONS = [
  "FileText", "FileCheck", "FileSearch", "FilePlus", "FileEdit",
  "Calculator", "BarChart3", "PieChart", "TrendingUp", "DollarSign",
  "Mail", "MessageSquare", "Send", "Inbox", "AtSign",
  "Search", "Target", "Crosshair", "Compass", "Map",
  "Users", "UserCheck", "UserPlus", "Building", "Briefcase",
  "Scale", "Shield", "Lock", "Key", "Award",
  "Lightbulb", "Sparkles", "Zap", "Rocket", "Flag",
  "ClipboardList", "CheckSquare", "ListChecks", "Calendar", "Clock",
  "Globe", "Languages", "BookOpen", "GraduationCap", "Brain",
];

// Variable Types
const VARIABLE_TYPES = [
  { value: "text", label: "Text (einzeilig)" },
  { value: "textarea", label: "Textarea (mehrzeilig)" },
  { value: "number", label: "Zahl" },
  { value: "select", label: "Dropdown (Auswahl)" },
  { value: "multiselect", label: "Multi-Select" },
  { value: "file", label: "Datei-Upload" },
  { value: "date", label: "Datum" },
];

interface VariableSchema {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "file" | "multiselect" | "date";
  required: boolean;
  placeholder?: string;
  options?: string[];
  helpText?: string;
  fileTypes?: string[];
  maxFileSize?: number;
  defaultValue?: string;
  displayOrder?: number;
}

// Marketing Tab Content Komponente
function MarketingTabContent({ 
  formData, 
  setFormData, 
  templateId 
}: { 
  formData: any; 
  setFormData: (data: any) => void;
  templateId?: number;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [newUsp, setNewUsp] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  
  const generateMarketingMutation = trpc.template.generateMarketing.useMutation({
    onSuccess: (data) => {
      setFormData({
        ...formData,
        marketingHeadline: data.headline,
        marketingSubheadline: data.subheadline,
        marketingUsps: data.usps,
        marketingCtaText: data.ctaText,
        marketingMetaDescription: data.metaDescription,
        marketingKeywords: data.keywords,
      });
      toast.success("Marketing-Texte erfolgreich generiert!");
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error("Fehler bei der Generierung: " + error.message);
      setIsGenerating(false);
    },
  });

  const handleGenerateMarketing = () => {
    if (!formData.title) {
      toast.error("Bitte zuerst einen Titel eingeben");
      return;
    }
    setIsGenerating(true);
    generateMarketingMutation.mutate({
      templateId: templateId || 0,
      title: formData.title,
      description: formData.description,
      roiBaseTimeMinutes: formData.roiBaseTimeMinutes,
      roiTimePerDocumentMinutes: formData.roiTimePerDocumentMinutes,
      roiKi2goTimeMinutes: formData.roiKi2goTimeMinutes,
      roiHourlyRate: formData.roiHourlyRate,
    });
  };

  const addUsp = () => {
    if (newUsp.trim() && formData.marketingUsps.length < 5) {
      setFormData({
        ...formData,
        marketingUsps: [...formData.marketingUsps, newUsp.trim()],
      });
      setNewUsp("");
    }
  };

  const removeUsp = (index: number) => {
    setFormData({
      ...formData,
      marketingUsps: formData.marketingUsps.filter((_: string, i: number) => i !== index),
    });
  };

  const addKeyword = () => {
    if (newKeyword.trim() && formData.marketingKeywords.length < 10) {
      setFormData({
        ...formData,
        marketingKeywords: [...formData.marketingKeywords, newKeyword.trim()],
      });
      setNewKeyword("");
    }
  };

  const removeKeyword = (index: number) => {
    setFormData({
      ...formData,
      marketingKeywords: formData.marketingKeywords.filter((_: string, i: number) => i !== index),
    });
  };

  // ROI-Berechnung für Vorschau
  const manualTime = formData.roiBaseTimeMinutes + formData.roiTimePerDocumentMinutes;
  const savedMinutes = manualTime - formData.roiKi2goTimeMinutes;
  const savedMoney = Math.round((savedMinutes / 60) * formData.roiHourlyRate);

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Linke Seite: Eingabefelder */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            Marketing-Texte
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateMarketing}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generiere...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Mit KI generieren</>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketingEnabled">Marketing-Banner anzeigen</Label>
          <Select
            value={formData.marketingEnabled.toString()}
            onValueChange={(value) => setFormData({ ...formData, marketingEnabled: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Nein - Banner ausblenden</SelectItem>
              <SelectItem value="1">Ja - Banner auf Aufgaben-Seite anzeigen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketingHeadline">Headline (max. 60 Zeichen)</Label>
          <Input
            id="marketingHeadline"
            value={formData.marketingHeadline}
            onChange={(e) => setFormData({ ...formData, marketingHeadline: e.target.value })}
            placeholder="z.B. Verträge prüfen in Minuten statt Stunden"
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground">{formData.marketingHeadline.length}/60 Zeichen</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketingSubheadline">Subheadline / Slogan (max. 100 Zeichen)</Label>
          <Input
            id="marketingSubheadline"
            value={formData.marketingSubheadline}
            onChange={(e) => setFormData({ ...formData, marketingSubheadline: e.target.value })}
            placeholder="z.B. Rechtssicherheit ohne Anwaltstermin"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">{formData.marketingSubheadline.length}/100 Zeichen</p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            USP-Punkte (max. 5)
          </Label>
          <div className="flex gap-2">
            <Input
              value={newUsp}
              onChange={(e) => setNewUsp(e.target.value)}
              placeholder="Neuen USP hinzufügen..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addUsp())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addUsp}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.marketingUsps.map((usp: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                <Check className="h-3 w-3 text-green-600" />
                {usp}
                <button onClick={() => removeUsp(index)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketingCtaText">Call-to-Action Text (max. 25 Zeichen)</Label>
          <Input
            id="marketingCtaText"
            value={formData.marketingCtaText}
            onChange={(e) => setFormData({ ...formData, marketingCtaText: e.target.value })}
            placeholder="z.B. Jetzt starten"
            maxLength={25}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketingMetaDescription">SEO Meta-Description (max. 155 Zeichen)</Label>
          <Textarea
            id="marketingMetaDescription"
            value={formData.marketingMetaDescription}
            onChange={(e) => setFormData({ ...formData, marketingMetaDescription: e.target.value })}
            placeholder="Beschreibung für Google Suchergebnisse..."
            maxLength={155}
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground">{formData.marketingMetaDescription.length}/155 Zeichen</p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            SEO Keywords (max. 10)
          </Label>
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Neues Keyword hinzufügen..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addKeyword}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.marketingKeywords.map((keyword: string, index: number) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {keyword}
                <button onClick={() => removeKeyword(index)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Rechte Seite: Vorschau */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Banner-Vorschau
        </h3>
        
        {formData.marketingEnabled ? (
          <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 space-y-4">
            {/* Headline */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formData.marketingHeadline || "Ihre Headline erscheint hier"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formData.marketingSubheadline || "Ihr Slogan erscheint hier"}
              </p>
            </div>

            {/* USPs */}
            {formData.marketingUsps.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3">
                {formData.marketingUsps.map((usp: string, index: number) => (
                  <div key={index} className="flex items-center gap-1 text-sm text-green-700 dark:text-green-400">
                    <Check className="h-4 w-4" />
                    {usp}
                  </div>
                ))}
              </div>
            )}

            {/* ROI-Anzeige */}
            <div className="flex items-center justify-center gap-6 pt-2 border-t border-green-200 dark:border-green-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{savedMinutes} Min.</div>
                <div className="text-xs text-gray-500">Zeitersparnis</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">€{savedMoney}</div>
                <div className="text-xs text-gray-500">Geldersparnis</div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Button className="bg-green-600 hover:bg-green-700">
                {formData.marketingCtaText || "Jetzt starten"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-gray-500">
            <EyeOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Marketing-Banner ist deaktiviert</p>
            <p className="text-sm">Aktivieren Sie den Banner oben, um die Vorschau zu sehen</p>
          </div>
        )}

        {/* SEO-Vorschau */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Google-Suchergebnis Vorschau:</h4>
          <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
            <div className="text-blue-600 dark:text-blue-400 text-lg hover:underline cursor-pointer">
              {formData.marketingHeadline || formData.title || "Seitentitel"}
            </div>
            <div className="text-green-700 dark:text-green-500 text-sm">
              ki2go.at/aufgabe/{formData.slug || "slug"}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {formData.marketingMetaDescription || formData.shortDescription || "Meta-Beschreibung erscheint hier..."}
            </div>
          </div>
        </div>

        {/* Keywords-Anzeige */}
        {formData.marketingKeywords.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">SEO Keywords:</h4>
            <div className="flex flex-wrap gap-1">
              {formData.marketingKeywords.map((keyword: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminTemplates() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("basic");

  // Form State
  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    title: "",
    description: "",
    shortDescription: "",
    categoryId: "",
    businessAreaId: "",
    icon: "FileText",
    color: "#5FBDCE",
    variableSchema: [] as VariableSchema[],
    superprompt: "",
    estimatedTimeSavings: "",
    creditCost: "1",
    status: "draft" as "draft" | "active" | "archived",
    isFeatured: 0,
    // Dokument-Anforderungen
    documentRequired: 0,
    documentCount: 1,
    maxPages: undefined as number | undefined,
    documentRelevanceCheck: 0,
    documentDescription: "",
    // Masking
    maskingRequired: 0,
    autoMasking: 0,
    // Keywords
    keywords: [] as string[],
    // Autor-Tracking
    createdByName: "",
    lastModifiedByName: "",
    templateVersion: "1.0",
    changeLog: "",
    // ROI-Kalkulation
    roiBaseTimeMinutes: 30,
    roiTimePerDocumentMinutes: 15,
    roiKi2goTimeMinutes: 3,
    roiHourlyRate: 80,
    // Öffentlich-Einstellung
    isPublic: 0,
    // Marketing & SEO
    marketingEnabled: 0,
    marketingHeadline: "",
    marketingSubheadline: "",
    marketingUsps: [] as string[],
    marketingCtaText: "Jetzt starten",
    marketingMetaDescription: "",
    marketingKeywords: [] as string[],
  });

  // Variable Editor State
  const [editingVariable, setEditingVariable] = useState<VariableSchema | null>(null);
  const [isVariableDialogOpen, setIsVariableDialogOpen] = useState(false);

  // Queries
  const { data: templates, isLoading, refetch } = trpc.template.list.useQuery({
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    includeArchived: statusFilter === "archived",
  });

  const { data: categories } = trpc.category.list.useQuery();
  const { data: businessAreas } = trpc.businessArea.list.useQuery();

  // Mutations
  const createMutation = trpc.template.create.useMutation({
    onSuccess: () => {
      toast.success("Template erfolgreich erstellt");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Erstellen");
    },
  });

  const updateMutation = trpc.template.update.useMutation({
    onSuccess: () => {
      toast.success("Template erfolgreich aktualisiert");
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Aktualisieren");
    },
  });

  const deleteMutation = trpc.template.delete.useMutation({
    onSuccess: () => {
      toast.success("Template erfolgreich gelöscht");
      setIsDeleteDialogOpen(false);
      setSelectedTemplate(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Löschen");
    },
  });

  const duplicateMutation = trpc.template.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Template erfolgreich dupliziert");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Duplizieren");
    },
  });

  const toggleStatusMutation = trpc.template.toggleStatus.useMutation({
    onSuccess: () => {
      toast.success("Status erfolgreich geändert");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Ändern des Status");
    },
  });

  // Redirect if not admin
  if (user && user.role !== "admin" && user.role !== "owner") {
    window.location.href = "/dashboard";
    return null;
  }

  const resetForm = () => {
    setFormData({
      slug: "",
      name: "",
      title: "",
      description: "",
      shortDescription: "",
      categoryId: "",
      businessAreaId: "",
      icon: "FileText",
      color: "#5FBDCE",
      variableSchema: [],
      superprompt: "",
      estimatedTimeSavings: "",
      creditCost: "1",
      status: "draft",
      isFeatured: 0,
      documentRequired: 0,
      documentCount: 1,
      maxPages: undefined,
      documentRelevanceCheck: 0,
      documentDescription: "",
      maskingRequired: 0,
      autoMasking: 0,
      keywords: [],
      // Autor-Tracking
      createdByName: user?.name || "",
      lastModifiedByName: user?.name || "",
      templateVersion: "1.0",
      changeLog: "",
      // ROI-Kalkulation
      roiBaseTimeMinutes: 30,
      roiTimePerDocumentMinutes: 15,
      roiKi2goTimeMinutes: 3,
      roiHourlyRate: 80,
      // Öffentlich-Einstellung
      isPublic: 0,
      // Marketing & SEO
      marketingEnabled: 0,
      marketingHeadline: "",
      marketingSubheadline: "",
      marketingUsps: [],
      marketingCtaText: "Jetzt starten",
      marketingMetaDescription: "",
      marketingKeywords: [],
    });
    setActiveTab("basic");
  };

  const handleCreate = () => {
    createMutation.mutate({
      slug: formData.slug,
      name: formData.name,
      title: formData.title,
      description: formData.description || undefined,
      shortDescription: formData.shortDescription || undefined,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
      businessAreaId: formData.businessAreaId ? parseInt(formData.businessAreaId) : undefined,
      icon: formData.icon,
      color: formData.color || undefined,
      variableSchema: formData.variableSchema,
      superprompt: formData.superprompt || undefined,
      estimatedTimeSavings: formData.estimatedTimeSavings ? parseInt(formData.estimatedTimeSavings) : undefined,
      creditCost: parseInt(formData.creditCost) || 1,
      status: formData.status,
      isFeatured: formData.isFeatured,
      documentRequired: formData.documentRequired,
      documentCount: formData.documentCount,
      maxPages: formData.maxPages,
      documentRelevanceCheck: formData.documentRelevanceCheck,
      documentDescription: formData.documentDescription || undefined,
      maskingRequired: formData.maskingRequired,
      autoMasking: formData.autoMasking,
      keywords: formData.keywords,
      // Autor-Tracking
      createdByName: formData.createdByName,
      templateVersion: formData.templateVersion || "1.0",
      changeLog: formData.changeLog || "Erstellt",
      // ROI-Kalkulation
      roiBaseTimeMinutes: formData.roiBaseTimeMinutes,
      roiTimePerDocumentMinutes: formData.roiTimePerDocumentMinutes,
      roiKi2goTimeMinutes: formData.roiKi2goTimeMinutes,
      roiHourlyRate: formData.roiHourlyRate,
      // Öffentlich-Einstellung
      isPublic: formData.isPublic,
    });
  };

  const handleUpdate = () => {
    if (!selectedTemplate) return;
    updateMutation.mutate({
      id: selectedTemplate.id,
      slug: formData.slug,
      name: formData.name,
      title: formData.title,
      description: formData.description || undefined,
      shortDescription: formData.shortDescription || undefined,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      businessAreaId: formData.businessAreaId ? parseInt(formData.businessAreaId) : null,
      icon: formData.icon,
      color: formData.color || undefined,
      variableSchema: formData.variableSchema,
      superprompt: formData.superprompt || undefined,
      estimatedTimeSavings: formData.estimatedTimeSavings ? parseInt(formData.estimatedTimeSavings) : null,
      creditCost: parseInt(formData.creditCost) || 1,
      status: formData.status,
      isFeatured: formData.isFeatured,
      documentRequired: formData.documentRequired,
      documentCount: formData.documentCount,
      maxPages: formData.maxPages,
      documentRelevanceCheck: formData.documentRelevanceCheck,
      documentDescription: formData.documentDescription || undefined,
      maskingRequired: formData.maskingRequired,
      autoMasking: formData.autoMasking,
      keywords: formData.keywords,
      // Autor-Tracking
      lastModifiedByName: formData.lastModifiedByName,
      templateVersion: formData.templateVersion,
      changeLog: formData.changeLog,
      // ROI-Kalkulation
      roiBaseTimeMinutes: formData.roiBaseTimeMinutes,
      roiTimePerDocumentMinutes: formData.roiTimePerDocumentMinutes,
      roiKi2goTimeMinutes: formData.roiKi2goTimeMinutes,
      roiHourlyRate: formData.roiHourlyRate,
      // Öffentlich-Einstellung
      isPublic: formData.isPublic,
      // Marketing-Felder
      marketingEnabled: formData.marketingEnabled ? 1 : 0,
      marketingHeadline: formData.marketingHeadline || null,
      marketingSubheadline: formData.marketingSubheadline || null,
      marketingUsps: formData.marketingUsps || [],
      marketingCtaText: formData.marketingCtaText || null,
      marketingMetaDescription: formData.marketingMetaDescription || null,
      marketingKeywords: formData.marketingKeywords || [],
    });
  };

  const openEditDialog = (template: any) => {
    setSelectedTemplate(template);
    setFormData({
      slug: template.slug,
      name: template.name,
      title: template.title,
      description: template.description || "",
      shortDescription: template.shortDescription || "",
      categoryId: template.categoryId?.toString() || "",
      businessAreaId: template.businessAreaId?.toString() || "",
      icon: template.icon || "FileText",
      color: template.color || "#5FBDCE",
      variableSchema: template.variableSchema || [],
      superprompt: template.superprompt || "",
      estimatedTimeSavings: template.estimatedTimeSavings?.toString() || "",
      creditCost: template.creditCost?.toString() || "1",
      status: template.status || "draft",
      isFeatured: template.isFeatured || 0,
      documentRequired: template.documentRequired || 0,
      documentCount: template.documentCount || 1,
      maxPages: template.maxPages || undefined,
      documentRelevanceCheck: template.documentRelevanceCheck || 0,
      documentDescription: template.documentDescription || "",
      maskingRequired: template.maskingRequired || 0,
      autoMasking: template.autoMasking || 0,
      keywords: template.keywords || [],
      // Autor-Tracking
      createdByName: template.createdByName || "",
      lastModifiedByName: user?.name || template.lastModifiedByName || "",
      templateVersion: template.templateVersion || "1.0",
      changeLog: template.changeLog || "",
      // ROI-Kalkulation
      roiBaseTimeMinutes: template.roiBaseTimeMinutes ?? 30,
      roiTimePerDocumentMinutes: template.roiTimePerDocumentMinutes ?? 15,
      roiKi2goTimeMinutes: template.roiKi2goTimeMinutes ?? 3,
      roiHourlyRate: template.roiHourlyRate ?? 80,
      // Öffentlich-Einstellung
      isPublic: template.isPublic ?? 0,
      // Marketing & SEO
      marketingEnabled: template.marketingEnabled ?? 0,
      marketingHeadline: template.marketingHeadline || "",
      marketingSubheadline: template.marketingSubheadline || "",
      marketingUsps: template.marketingUsps || [],
      marketingCtaText: template.marketingCtaText || "Jetzt starten",
      marketingMetaDescription: template.marketingMetaDescription || "",
      marketingKeywords: template.marketingKeywords || [],
    });
    setActiveTab("basic");
    setIsEditDialogOpen(true);
  };

  const handleDuplicate = (template: any) => {
    const newSlug = `${template.slug}_copy_${Date.now()}`;
    duplicateMutation.mutate({ id: template.id, newSlug });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Aktiv</Badge>;
      case "draft":
        return <Badge variant="secondary">Entwurf</Badge>;
      case "archived":
        return <Badge variant="outline" className="text-muted-foreground">Archiviert</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  // Variable Management
  const addVariable = () => {
    setEditingVariable({
      key: "",
      label: "",
      type: "text",
      required: false,
      placeholder: "",
      options: [],
      helpText: "",
    });
    setIsVariableDialogOpen(true);
  };

  const editVariable = (variable: VariableSchema, index: number) => {
    setEditingVariable({ ...variable, displayOrder: index });
    setIsVariableDialogOpen(true);
  };

  const saveVariable = () => {
    if (!editingVariable) return;
    
    const newSchema = [...formData.variableSchema];
    if (editingVariable.displayOrder !== undefined && editingVariable.displayOrder < newSchema.length) {
      newSchema[editingVariable.displayOrder] = editingVariable;
    } else {
      newSchema.push(editingVariable);
    }
    
    setFormData({ ...formData, variableSchema: newSchema });
    setIsVariableDialogOpen(false);
    setEditingVariable(null);
  };

  const removeVariable = (index: number) => {
    const newSchema = formData.variableSchema.filter((_, i) => i !== index);
    setFormData({ ...formData, variableSchema: newSchema });
  };

  const insertVariableToSuperprompt = (key: string) => {
    const textarea = document.getElementById("superprompt-editor") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.superprompt;
      const newText = text.substring(0, start) + `{{${key}}}` + text.substring(end);
      setFormData({ ...formData, superprompt: newText });
    } else {
      setFormData({ ...formData, superprompt: formData.superprompt + `{{${key}}}` });
    }
  };

  // Template Editor Dialog Content
  const renderEditorTabs = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="border-b mb-6">
        <TabsList className="flex h-12 items-center gap-0 bg-muted/30 p-1 rounded-lg w-full">
          <TabsTrigger 
            value="basic" 
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <FileText className="h-4 w-4" />
            Grunddaten
          </TabsTrigger>
          <TabsTrigger 
            value="variables" 
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <Variable className="h-4 w-4" />
            Variablen
          </TabsTrigger>
          <TabsTrigger 
            value="superprompt" 
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Superprompt
          </TabsTrigger>
          <TabsTrigger 
            value="roi" 
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <Calculator className="h-4 w-4" />
            ROI
          </TabsTrigger>
          <TabsTrigger 
            value="marketing" 
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <Megaphone className="h-4 w-4" />
            Marketing
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <LucideIcons.Settings className="h-4 w-4" />
            Einstellungen
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Tab 1: Grunddaten */}
      <TabsContent value="basic" className="space-y-6 mt-6">
        {/* Hauptinformationen */}
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-base flex items-center gap-2 text-primary">
            <FileText className="h-4 w-4" />
            Hauptinformationen
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL-freundlich) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "_") })}
                placeholder="vertrag_pruefen"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Interner Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Vertragsprüfung Standard"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Anzeige-Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Vertrag prüfen"
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Kurzbeschreibung</Label>
            <Input
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              placeholder="Lassen Sie Ihren Vertrag auf Risiken prüfen"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Ausführliche Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detaillierte Beschreibung der Aufgabe..."
              rows={4}
              className="resize-y min-h-[100px]"
            />
          </div>
        </div>

        {/* Kategorisierung & Darstellung */}
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-base flex items-center gap-2 text-primary">
            <Tags className="h-4 w-4" />
            Kategorisierung & Darstellung
          </h3>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.filter(c => c.isActive).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unternehmensbereich</Label>
              <Select
                value={formData.businessAreaId}
                onValueChange={(value) => setFormData({ ...formData, businessAreaId: value })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Bereich wählen" />
                </SelectTrigger>
                <SelectContent>
                  {businessAreas?.filter(a => a.isActive).map((area) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {getIcon(formData.icon)}
                      <span>{formData.icon}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {TEMPLATE_ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <div className="flex items-center gap-2">
                        {getIcon(icon)}
                        <span>{icon}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Farbe</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#5FBDCE"
                  className="flex-1 h-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Autor-Tracking Sektion - Kompakt */}
        <div className="bg-muted/30 border rounded-lg p-4">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground mb-3">
            <LucideIcons.UserCheck className="h-4 w-4" />
            Autor-Tracking & Versionierung
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="createdByName" className="text-xs">
                {selectedTemplate ? "Erstellt von" : "Ersteller *"}
              </Label>
              <Input
                id="createdByName"
                value={formData.createdByName}
                onChange={(e) => setFormData({ ...formData, createdByName: e.target.value })}
                placeholder="Ihr Name"
                disabled={!!selectedTemplate}
                className={`h-9 ${selectedTemplate ? "bg-muted text-muted-foreground" : ""}`}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastModifiedByName" className="text-xs">
                {selectedTemplate ? "Bearbeiter *" : "Bearbeiter"}
              </Label>
              <Input
                id="lastModifiedByName"
                value={formData.lastModifiedByName}
                onChange={(e) => setFormData({ ...formData, lastModifiedByName: e.target.value })}
                placeholder="Ihr Name"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="templateVersion" className="text-xs">Version</Label>
              <Input
                id="templateVersion"
                value={formData.templateVersion}
                onChange={(e) => setFormData({ ...formData, templateVersion: e.target.value })}
                placeholder="1.0"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="changeLog" className="text-xs">Änderungsnotiz</Label>
              <Input
                id="changeLog"
                value={formData.changeLog}
                onChange={(e) => setFormData({ ...formData, changeLog: e.target.value })}
                placeholder="Was wurde geändert?"
                className="h-9"
              />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Tab 2: Variablen */}
      <TabsContent value="variables" className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Eingabefelder für Benutzer</h3>
            <p className="text-sm text-muted-foreground">
              Definieren Sie, welche Informationen der Benutzer eingeben muss
            </p>
          </div>
          <Button onClick={addVariable} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Variable hinzufügen
          </Button>
        </div>

        {formData.variableSchema.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Variable className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Noch keine Variablen definiert</p>
              <p className="text-sm">Klicken Sie auf "Variable hinzufügen" um zu beginnen</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {formData.variableSchema.map((variable, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-0.5 rounded">
                        {`{{${variable.key}}}`}
                      </code>
                      <span className="font-medium">{variable.label}</span>
                      {variable.required && (
                        <Badge variant="secondary" className="text-xs">Pflicht</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Typ: {VARIABLE_TYPES.find(t => t.value === variable.type)?.label}
                      {variable.options?.length ? ` • ${variable.options.length} Optionen` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => editVariable(variable, index)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeVariable(index)}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* Tab 3: Superprompt */}
      <TabsContent value="superprompt" className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Superprompt</h3>
            <p className="text-sm text-muted-foreground">
              Der Prompt, der an die KI gesendet wird. Verwenden Sie {"{{variable}}"} für Platzhalter.
            </p>
          </div>
        </div>

        {formData.variableSchema.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground mr-2">Variablen einfügen:</span>
            {formData.variableSchema.map((v) => (
              <Button
                key={v.key}
                variant="secondary"
                size="sm"
                onClick={() => insertVariableToSuperprompt(v.key)}
              >
                {`{{${v.key}}}`}
              </Button>
            ))}
          </div>
        )}

        <Textarea
          id="superprompt-editor"
          value={formData.superprompt}
          onChange={(e) => setFormData({ ...formData, superprompt: e.target.value })}
          placeholder={`Du bist ein erfahrener Experte für {{bereich}}.

Analysiere das folgende Dokument: {{dokument}}

Fokus: {{fokus}}

Erstelle einen strukturierten Bericht mit:
1. Zusammenfassung
2. Wichtige Erkenntnisse
3. Empfehlungen`}
          rows={25}
          className="font-mono text-sm min-h-[400px] resize-y"
        />

        <div className="text-sm text-muted-foreground">
          {formData.superprompt.length} Zeichen
        </div>
      </TabsContent>

      {/* Tab 4: ROI-Kalkulation */}
      <TabsContent value="roi" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-6">
          {/* Linke Seite: Eingabefelder */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Zeitparameter
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="roiBaseTime">Basis-Zeitaufwand (manuell)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="roiBaseTime"
                  type="number"
                  value={formData.roiBaseTimeMinutes}
                  onChange={(e) => setFormData({ ...formData, roiBaseTimeMinutes: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">Minuten</span>
              </div>
              <p className="text-xs text-muted-foreground">Grundzeit für manuelle Bearbeitung ohne Dokumente</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roiTimePerDoc">Zeit pro Dokument (manuell)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="roiTimePerDoc"
                  type="number"
                  value={formData.roiTimePerDocumentMinutes}
                  onChange={(e) => setFormData({ ...formData, roiTimePerDocumentMinutes: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">Min. pro Dokument</span>
              </div>
              <p className="text-xs text-muted-foreground">Zusätzliche Zeit für jedes hochgeladene Dokument</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roiKi2goTime" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                KI2GO Bearbeitungszeit
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="roiKi2goTime"
                  type="number"
                  value={formData.roiKi2goTimeMinutes}
                  onChange={(e) => setFormData({ ...formData, roiKi2goTimeMinutes: parseInt(e.target.value) || 1 })}
                  min={1}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">Minuten</span>
              </div>
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
                  value={formData.roiHourlyRate}
                  onChange={(e) => setFormData({ ...formData, roiHourlyRate: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">€ / Stunde</span>
              </div>
            </div>
          </div>

          {/* Rechte Seite: Vorschau */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              ROI-Vorschau
            </h3>
            
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="font-medium">1 Dokument</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Manuell:</span>
                  <span className="ml-1 font-medium">{formData.roiBaseTimeMinutes + formData.roiTimePerDocumentMinutes} Min.</span>
                </div>
                <div>
                  <span className="text-muted-foreground">KI2GO:</span>
                  <span className="ml-1 font-medium">{formData.roiKi2goTimeMinutes} Min.</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                <span className="text-green-700 dark:text-green-400 font-medium">
                  Ersparnis: {formData.roiBaseTimeMinutes + formData.roiTimePerDocumentMinutes - formData.roiKi2goTimeMinutes} Min. = 
                  € {Math.round((formData.roiBaseTimeMinutes + formData.roiTimePerDocumentMinutes - formData.roiKi2goTimeMinutes) / 60 * formData.roiHourlyRate)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium">3 Dokumente</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Manuell:</span>
                  <span className="ml-1 font-medium">{formData.roiBaseTimeMinutes + (formData.roiTimePerDocumentMinutes * 3)} Min.</span>
                </div>
                <div>
                  <span className="text-muted-foreground">KI2GO:</span>
                  <span className="ml-1 font-medium">{formData.roiKi2goTimeMinutes + 2} Min.</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                <span className="text-blue-700 dark:text-blue-400 font-medium">
                  Ersparnis: {formData.roiBaseTimeMinutes + (formData.roiTimePerDocumentMinutes * 3) - (formData.roiKi2goTimeMinutes + 2)} Min. = 
                  € {Math.round((formData.roiBaseTimeMinutes + (formData.roiTimePerDocumentMinutes * 3) - (formData.roiKi2goTimeMinutes + 2)) / 60 * formData.roiHourlyRate)}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Diese Werte werden dem Benutzer bei der Aufgabenausführung angezeigt.
            </p>
          </div>
        </div>
      </TabsContent>

      {/* Tab 5: Marketing & SEO */}
      <TabsContent value="marketing" className="space-y-4 mt-4">
        <MarketingTabContent 
          formData={formData} 
          setFormData={setFormData}
          templateId={selectedTemplate?.id}
        />
      </TabsContent>

      {/* Tab 6: Einstellungen */}
      <TabsContent value="settings" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estimatedTimeSavings">Geschätzte Zeitersparnis (Minuten)</Label>
            <Input
              id="estimatedTimeSavings"
              type="number"
              value={formData.estimatedTimeSavings}
              onChange={(e) => setFormData({ ...formData, estimatedTimeSavings: e.target.value })}
              placeholder="45"
            />
            <p className="text-xs text-muted-foreground">Für ROI-Berechnung im Geschäftsführer-Radar</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="creditCost">Credit-Kosten</Label>
            <Input
              id="creditCost"
              type="number"
              value={formData.creditCost}
              onChange={(e) => setFormData({ ...formData, creditCost: e.target.value })}
              placeholder="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Entwurf</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="archived">Archiviert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Auf Homepage hervorheben</Label>
            <Select
              value={formData.isFeatured.toString()}
              onValueChange={(value) => setFormData({ ...formData, isFeatured: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Nein</SelectItem>
                <SelectItem value="1">Ja (Featured)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Öffentlich zugänglich</Label>
            <Select
              value={formData.isPublic.toString()}
              onValueChange={(value) => setFormData({ ...formData, isPublic: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Nein (nur mit Org-Freigabe)</SelectItem>
                <SelectItem value="1">Ja (für alle User)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Wenn aktiviert, können alle Benutzer dieses Template verwenden</p>
          </div>
        </div>

        {/* Dokument-Anforderungen */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-4">Dokument-Anforderungen</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dokument erforderlich</Label>
              <Select
                value={(formData as any).documentRequired?.toString() || "0"}
                onValueChange={(value) => setFormData({ ...formData, documentRequired: parseInt(value) } as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Nein</SelectItem>
                  <SelectItem value="1">Ja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Anzahl Dokumente (max.)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={(formData as any).documentCount || "1"}
                onChange={(e) => setFormData({ ...formData, documentCount: parseInt(e.target.value) } as any)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max. Seitenzahl (PDF)</Label>
              <Input
                type="number"
                value={(formData as any).maxPages || ""}
                onChange={(e) => setFormData({ ...formData, maxPages: e.target.value ? parseInt(e.target.value) : undefined } as any)}
                placeholder="Unbegrenzt"
              />
            </div>
            <div className="space-y-2">
              <Label>Relevanz-Check</Label>
              <Select
                value={(formData as any).documentRelevanceCheck?.toString() || "0"}
                onValueChange={(value) => setFormData({ ...formData, documentRelevanceCheck: parseInt(value) } as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Deaktiviert</SelectItem>
                  <SelectItem value="1">Aktiviert</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Prüft ob Dokument zur Aufgabe passt</p>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label>Dokument-Beschreibung</Label>
            <Textarea
              value={(formData as any).documentDescription || ""}
              onChange={(e) => setFormData({ ...formData, documentDescription: e.target.value } as any)}
              placeholder="Beschreiben Sie, welches Dokument erwartet wird..."
              rows={2}
            />
          </div>
        </div>

        {/* Masking-Einstellungen */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-4">Masking-Einstellungen</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Masking anbieten</Label>
              <Select
                value={(formData as any).maskingRequired?.toString() || "0"}
                onValueChange={(value) => setFormData({ ...formData, maskingRequired: parseInt(value) } as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Nein</SelectItem>
                  <SelectItem value="1">Ja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Auto-Masking</Label>
              <Select
                value={(formData as any).autoMasking?.toString() || "0"}
                onValueChange={(value) => setFormData({ ...formData, autoMasking: parseInt(value) } as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Manuell (Benutzer entscheidet)</SelectItem>
                  <SelectItem value="1">Automatisch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Keywords für Matching */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-4">Keywords für automatisches Matching</h4>
          <div className="space-y-2">
            <Label>Keywords (kommagetrennt)</Label>
            <Input
              value={((formData as any).keywords || []).join(", ")}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value.split(",").map((k: string) => k.trim()).filter(Boolean) } as any)}
              placeholder="vertrag, prüfen, analyse, risiko"
            />
            <p className="text-xs text-muted-foreground">Diese Keywords helfen bei der automatischen Zuordnung von Benutzeranfragen</p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = "/admin"}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <div className="flex-1">
<h1 className="text-xl font-bold">Owner-Templates</h1>
               <p className="text-sm text-muted-foreground">
                 Verwalten Sie Ihre Know-How-Bibliothek (OT-Nummern)
              </p>
            </div>
            <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Template
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Templates durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="draft">Entwurf</SelectItem>
                  <SelectItem value="archived">Archiviert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Templates ({templates?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : templates?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine Templates gefunden</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}
                >
                  Erstes Template erstellen
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">OT-Nummer</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Bereich</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Nutzungen</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates?.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {template.uniqueId || `#${template.id}`}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: template.color || "#5FBDCE" + "20" }}
                          >
                            {getIcon(template.icon || "FileText")}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {template.title}
                              {template.isFeatured === 1 && (
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{template.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.categoryName || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {template.businessAreaName || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {template.createdByName ? (
                            <>
                              <div className="font-medium">{template.createdByName}</div>
                              <div className="text-muted-foreground text-xs">
                                v{template.templateVersion || "1.0"}
                                {template.createdAt && (
                                  <span> • {new Date(template.createdAt).toLocaleDateString('de-DE')}</span>
                                )}
                              </div>
                              {template.lastModifiedByName && template.lastModifiedByName !== template.createdByName && (
                                <div className="text-muted-foreground text-xs mt-1">
                                  Änd: {template.lastModifiedByName}
                                  {template.updatedAt && (
                                    <span> • {new Date(template.updatedAt).toLocaleDateString('de-DE')}</span>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(template.status || "draft")}
                          {template.isPublic === 1 && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Öffentlich
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{template.usageCount || 0}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(template)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplizieren
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {template.status === "active" ? (
                              <DropdownMenuItem
                                onClick={() => toggleStatusMutation.mutate({ id: template.id, status: "draft" })}
                              >
                                <EyeOff className="h-4 w-4 mr-2" />
                                Deaktivieren
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => toggleStatusMutation.mutate({ id: template.id, status: "active" })}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Aktivieren
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => toggleStatusMutation.mutate({ id: template.id, status: "archived" })}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archivieren
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedTemplate(template);
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

      {/* Create Dialog - Universeller TemplateEditor */}
      <TemplateEditor
        mode="owner"
        isCreate={true}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Edit Dialog - Universeller TemplateEditor */}
      {selectedTemplate && (
        <TemplateEditor
          mode="owner"
          templateId={selectedTemplate.id}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Template löschen</DialogTitle>
          </DialogHeader>
          <p>
            Sind Sie sicher, dass Sie das Template "{selectedTemplate?.title}" löschen möchten?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedTemplate && deleteMutation.mutate({ id: selectedTemplate.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variable Editor Dialog */}
      <Dialog open={isVariableDialogOpen} onOpenChange={setIsVariableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVariable?.displayOrder !== undefined ? "Variable bearbeiten" : "Neue Variable"}
            </DialogTitle>
          </DialogHeader>
          {editingVariable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Variablen-Key *</Label>
                  <Input
                    value={editingVariable.key}
                    onChange={(e) => setEditingVariable({
                      ...editingVariable,
                      key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_")
                    })}
                    placeholder="dokument_typ"
                  />
                  <p className="text-xs text-muted-foreground">Nur Kleinbuchstaben, Zahlen und _</p>
                </div>
                <div className="space-y-2">
                  <Label>Anzeige-Label *</Label>
                  <Input
                    value={editingVariable.label}
                    onChange={(e) => setEditingVariable({ ...editingVariable, label: e.target.value })}
                    placeholder="Art des Dokuments"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Typ</Label>
                  <Select
                    value={editingVariable.type}
                    onValueChange={(value: any) => setEditingVariable({ ...editingVariable, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VARIABLE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pflichtfeld</Label>
                  <Select
                    value={editingVariable.required ? "yes" : "no"}
                    onValueChange={(value) => setEditingVariable({ ...editingVariable, required: value === "yes" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Nein</SelectItem>
                      <SelectItem value="yes">Ja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Platzhalter-Text</Label>
                <Input
                  value={editingVariable.placeholder || ""}
                  onChange={(e) => setEditingVariable({ ...editingVariable, placeholder: e.target.value })}
                  placeholder="z.B. Mietvertrag"
                />
              </div>

              {(editingVariable.type === "select" || editingVariable.type === "multiselect") && (
                <div className="space-y-2">
                  <Label>Optionen (eine pro Zeile)</Label>
                  <Textarea
                    value={editingVariable.options?.join("\n") || ""}
                    onChange={(e) => setEditingVariable({
                      ...editingVariable,
                      options: e.target.value.split("\n").filter(Boolean)
                    })}
                    placeholder="Mietvertrag&#10;Arbeitsvertrag&#10;Kaufvertrag"
                    rows={4}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Hilfetext</Label>
                <Input
                  value={editingVariable.helpText || ""}
                  onChange={(e) => setEditingVariable({ ...editingVariable, helpText: e.target.value })}
                  placeholder="Zusätzliche Erklärung für den Benutzer"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVariableDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={saveVariable} disabled={!editingVariable?.key || !editingVariable?.label}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
