import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import {
  FileText,
  Loader2,
  Variable,
  X,
  Plus,
  GripVertical,
  Clock,
  Euro,
  TrendingUp,
  Sparkles,
  Megaphone,
  Check,
  Target,
  Tags,
  Settings,
  Info,
  Calendar,
  AlertTriangle,
  Shield,
  CheckCircle2,
  Circle,
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
  { value: "date", label: "Datum" },
  { value: "boolean", label: "Ja/Nein" },
  { value: "file", label: "Datei-Upload" },
];

interface VariableSchema {
  key: string;
  name?: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "date" | "file" | "multiselect";
  required: boolean;
  placeholder?: string;
  options?: string[];
  helpText?: string;
  defaultValue?: any;
  fileTypes?: string[];
  maxFileSize?: number;
  displayOrder?: number;
}

interface TemplateEditorProps {
  mode: "owner" | "custom";
  templateId?: number;
  isCreate?: boolean; // true = Erstellen, false/undefined = Bearbeiten
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TemplateEditor({ mode, templateId, isCreate = false, open, onOpenChange, onSuccess }: TemplateEditorProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [newUsp, setNewUsp] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [roiPreviewDocs, setRoiPreviewDocs] = useState(1);
  const [roiTasksPerMonth, setRoiTasksPerMonth] = useState(10);
  const [isAnalyzingRoi, setIsAnalyzingRoi] = useState(false);
  const [isGeneratingMarketing, setIsGeneratingMarketing] = useState(false);
  const [isGeneratingDisclaimer, setIsGeneratingDisclaimer] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    // Grunddaten
    name: "",
    title: "",
    description: "",
    shortDescription: "",
    superprompt: "",
    // Kategorisierung
    categoryId: "",
    businessAreaId: "",
    icon: "FileText",
    color: "#5FBDCE",
    // Variablen
    variableSchema: [] as VariableSchema[],
    // LLM-Einstellungen
    estimatedTimeSavings: "",
    creditCost: "1",
    llmModel: "",
    llmTemperature: "0.7",
    maxTokens: "",
    outputFormat: "markdown",
    exampleOutput: "",
    // Dokument-Einstellungen
    documentRequired: 0,
    documentCount: 1,
    maxFileSize: 10485760,
    maxPages: undefined as number | undefined,
    documentRelevanceCheck: 0,
    documentDescription: "",
    // Masking
    maskingRequired: 0,
    autoMasking: 0,
    // Keywords
    keywords: [] as string[],
    // Marketing
    marketingEnabled: 0,
    marketingHeadline: "",
    marketingSubheadline: "",
    marketingUsps: [] as string[],
    marketingCtaText: "Jetzt starten",
    marketingMetaDescription: "",
    marketingKeywords: [] as string[],
    // ROI
    roiBaseTimeMinutes: 30,
    roiTimePerDocumentMinutes: 15,
    roiKi2goTimeMinutes: 3,
    roiKi2goTimePerDocument: 1,
    roiHourlyRate: 80,
    roiTasksPerMonth: 10,
    roiSources: [] as { name: string; url: string; finding: string }[],
    // Disclaimer
    disclaimer: "",
    // Status
    status: "draft" as "draft" | "active" | "archived" | "paused" | "change_requested",
    // Öffentlich
    isPublic: 0,
    // Autor-Tracking
    createdByName: "",
    lastModifiedByName: "",
    templateVersion: "1.0",
    changeLog: "",
    // Custom-Template spezifisch
    organizationName: "",
    customerNumber: "",
    baseTemplateName: "",
    baseTemplateUniqueId: "",
    uniqueId: "",
  });

  // API Queries
  const { data: categories } = trpc.category.list.useQuery();
  const { data: businessAreas } = trpc.businessArea.list.useQuery();
  
  // Lade Template-Daten wenn templateId vorhanden (nicht bei Create)
  const { data: customTemplateData, isLoading: isLoadingCustom } = trpc.customSuperprompt.getForEdit.useQuery(
    { id: templateId! },
    { enabled: mode === "custom" && !!templateId && open && !isCreate }
  );
  
  const { data: ownerTemplateData, isLoading: isLoadingOwner } = trpc.template.getById.useQuery(
    { id: templateId! },
    { enabled: mode === "owner" && !!templateId && open && !isCreate }
  );

  // Create Mutations
  const createOwnerMutation = trpc.template.create.useMutation({
    onSuccess: () => {
      setSaveSuccess(true);
      toast.success("Owner-Template erfolgreich erstellt");
      setTimeout(() => {
        setSaveSuccess(false);
        onOpenChange(false);
        resetForm();
        onSuccess?.();
      }, 1500);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const createCustomMutation = trpc.customSuperprompt.create.useMutation({
    onSuccess: () => {
      toast.success("Custom-Template erfolgreich erstellt");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Update Mutations
  const updateCustomMutation = trpc.customSuperprompt.updateFull.useMutation({
    onSuccess: () => {
      setSaveSuccess(true);
      toast.success("Custom-Template erfolgreich aktualisiert");
      setTimeout(() => {
        setSaveSuccess(false);
        onOpenChange(false);
        onSuccess?.();
      }, 1500);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateOwnerMutation = trpc.template.update.useMutation({
    onSuccess: () => {
      setSaveSuccess(true);
      toast.success("Owner-Template erfolgreich aktualisiert");
      setTimeout(() => {
        setSaveSuccess(false);
        onOpenChange(false);
        onSuccess?.();
      }, 1500);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Magic ROI Mutation
  const analyzeRoiMutation = trpc.template.analyzeRoi.useMutation({
    onSuccess: (data) => {
      setFormData(prev => ({
        ...prev,
        roiBaseTimeMinutes: data.roiBaseTimeMinutes,
        roiTimePerDocumentMinutes: data.roiTimePerDocumentMinutes,
        roiKi2goTimeMinutes: data.roiKi2goTimeMinutes,
        roiKi2goTimePerDocument: data.roiKi2goTimePerDocument,
      }));
      toast.success(`KI-Vorschlag angewendet: ${data.reasoning}`);
      setIsAnalyzingRoi(false);
    },
    onError: (error) => {
      toast.error(`Analyse fehlgeschlagen: ${error.message}`);
      setIsAnalyzingRoi(false);
    },
  });

  // Magic ROI Handler
  const handleMagicRoi = () => {
    if (!formData.superprompt) {
      toast.error("Bitte zuerst einen Superprompt eingeben");
      return;
    }
    setIsAnalyzingRoi(true);
    analyzeRoiMutation.mutate({
      superprompt: formData.superprompt,
      title: formData.title,
      description: formData.description,
      variableCount: formData.variableSchema.length,
      documentRequired: formData.documentRequired === 1,
    });
  };

  // Magic Marketing Mutation
  const generateMarketingMutation = trpc.template.generateMarketing.useMutation({
    onSuccess: (data) => {
      setFormData(prev => ({
        ...prev,
        marketingHeadline: data.headline,
        marketingSubheadline: data.subheadline,
        marketingUsps: data.usps,
        marketingCtaText: data.ctaText,
        marketingMetaDescription: data.metaDescription,
        marketingKeywords: data.keywords,
      }));
      toast.success("Marketing-Texte erfolgreich generiert!");
      setIsGeneratingMarketing(false);
    },
    onError: (error) => {
      toast.error(`Marketing-Generierung fehlgeschlagen: ${error.message}`);
      setIsGeneratingMarketing(false);
    },
  });

  // Magic Marketing Handler
  const handleMagicMarketing = () => {
    if (!formData.title) {
      toast.error("Bitte zuerst einen Titel eingeben");
      return;
    }
    setIsGeneratingMarketing(true);
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

  // Magic Disclaimer Mutation
  const generateDisclaimerMutation = trpc.template.generateDisclaimer.useMutation({
    onSuccess: (data) => {
      setFormData(prev => ({
        ...prev,
        disclaimer: data.disclaimer,
      }));
      toast.success("Disclaimer erfolgreich generiert!");
      setIsGeneratingDisclaimer(false);
    },
    onError: (error) => {
      toast.error(`Disclaimer-Generierung fehlgeschlagen: ${error.message}`);
      setIsGeneratingDisclaimer(false);
    },
  });

  // Magic Disclaimer Handler
  const handleMagicDisclaimer = () => {
    if (!formData.title) {
      toast.error("Bitte zuerst einen Titel eingeben");
      return;
    }
    setIsGeneratingDisclaimer(true);
    generateDisclaimerMutation.mutate({
      templateId: templateId || 0,
      title: formData.title,
      description: formData.description,
      superprompt: formData.superprompt,
      outputFormat: formData.outputFormat,
      documentRequired: formData.documentRequired === 1,
    });
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      name: "",
      title: "",
      description: "",
      shortDescription: "",
      superprompt: "",
      categoryId: "",
      businessAreaId: "",
      icon: "FileText",
      color: "#5FBDCE",
      variableSchema: [] as VariableSchema[],
      estimatedTimeSavings: "",
      creditCost: "1",
      llmModel: "",
      llmTemperature: "0.7",
      maxTokens: "",
      outputFormat: "markdown",
      exampleOutput: "",
      documentRequired: 0,
      documentCount: 1,
      maxFileSize: 10485760,
      maxPages: undefined as number | undefined,
      documentRelevanceCheck: 0,
      documentDescription: "",
      maskingRequired: 0,
      autoMasking: 0,
      keywords: [] as string[],
      marketingEnabled: 0,
      marketingHeadline: "",
      marketingSubheadline: "",
      marketingUsps: [] as string[],
      marketingCtaText: "Jetzt starten",
      marketingMetaDescription: "",
      marketingKeywords: [] as string[],
      roiBaseTimeMinutes: 30,
      roiTimePerDocumentMinutes: 15,
      roiKi2goTimeMinutes: 3,
      roiKi2goTimePerDocument: 1,
      roiHourlyRate: 80,
      roiTasksPerMonth: 10,
      roiSources: [] as { name: string; url: string; finding: string }[],
      disclaimer: "",
      status: "draft" as "draft" | "active" | "archived" | "paused" | "change_requested",
      isPublic: 0,
      createdByName: "",
      lastModifiedByName: "",
      templateVersion: "1.0",
      changeLog: "",
      organizationName: "",
      customerNumber: "",
      baseTemplateName: "",
      baseTemplateUniqueId: "",
      uniqueId: "",
    });
    setActiveTab("basic");
  };

  // Lade Daten in Form wenn verfügbar
  useEffect(() => {
    if (mode === "custom" && customTemplateData) {
      setFormData({
        name: customTemplateData.name || "",
        title: customTemplateData.title || "",
        description: customTemplateData.description || "",
        shortDescription: customTemplateData.shortDescription || "",
        superprompt: customTemplateData.superprompt || "",
        categoryId: customTemplateData.categoryId?.toString() || "",
        businessAreaId: customTemplateData.businessAreaId?.toString() || "",
        icon: customTemplateData.icon || "FileText",
        color: customTemplateData.color || "#5FBDCE",
        variableSchema: (customTemplateData.variableSchema as VariableSchema[]) || [],
        estimatedTimeSavings: customTemplateData.estimatedTimeSavings?.toString() || "",
        creditCost: customTemplateData.creditCost?.toString() || "1",
        llmModel: customTemplateData.llmModel || "",
        llmTemperature: customTemplateData.llmTemperature?.toString() || "0.7",
        maxTokens: customTemplateData.maxTokens?.toString() || "",
        outputFormat: customTemplateData.outputFormat || "markdown",
        exampleOutput: customTemplateData.exampleOutput || "",
        documentRequired: customTemplateData.documentRequired || 0,
        documentCount: customTemplateData.documentCount || 1,
        maxFileSize: customTemplateData.maxFileSize || 10485760,
        maxPages: customTemplateData.maxPages || undefined,
        documentRelevanceCheck: customTemplateData.documentRelevanceCheck || 0,
        documentDescription: customTemplateData.documentDescription || "",
        maskingRequired: customTemplateData.maskingRequired || 0,
        autoMasking: customTemplateData.autoMasking || 0,
        keywords: (customTemplateData.keywords as string[]) || [],
        marketingEnabled: customTemplateData.marketingEnabled || 0,
        marketingHeadline: customTemplateData.marketingHeadline || "",
        marketingSubheadline: customTemplateData.marketingSubheadline || "",
        marketingUsps: (customTemplateData.marketingUsps as string[]) || [],
        marketingCtaText: customTemplateData.marketingCtaText || "Jetzt starten",
        marketingMetaDescription: customTemplateData.marketingMetaDescription || "",
        marketingKeywords: (customTemplateData.marketingKeywords as string[]) || [],
        roiBaseTimeMinutes: customTemplateData.roiBaseTimeMinutes ?? 30,
        roiTimePerDocumentMinutes: customTemplateData.roiTimePerDocumentMinutes ?? 15,
        roiKi2goTimeMinutes: customTemplateData.roiKi2goTimeMinutes ?? 3,
        roiKi2goTimePerDocument: customTemplateData.roiKi2goTimePerDocument ?? 1,
        roiHourlyRate: customTemplateData.roiHourlyRate ?? 80,
        roiTasksPerMonth: customTemplateData.roiTasksPerMonth ?? 10,
        roiSources: (customTemplateData.roiSources as { name: string; url: string; finding: string }[]) || [],
        disclaimer: customTemplateData.disclaimer || "",
        status: customTemplateData.status || "active",
        createdByName: customTemplateData.createdByName || "",
        lastModifiedByName: customTemplateData.lastModifiedByName || "",
        templateVersion: customTemplateData.templateVersion || "1.0",
        changeLog: customTemplateData.changeLog || "",
        organizationName: customTemplateData.organizationName || "",
        customerNumber: customTemplateData.customerNumber || "",
        baseTemplateName: customTemplateData.baseTemplateName || "",
        baseTemplateUniqueId: customTemplateData.baseTemplateUniqueId || "",
        uniqueId: customTemplateData.uniqueId || "",
        isPublic: 0, // Custom-Templates haben kein isPublic Feld
      });
    } else if (mode === "owner" && ownerTemplateData) {
      setFormData({
        name: ownerTemplateData.name || "",
        title: ownerTemplateData.title || "",
        description: ownerTemplateData.description || "",
        shortDescription: ownerTemplateData.shortDescription || "",
        superprompt: ownerTemplateData.superprompt || "",
        categoryId: ownerTemplateData.categoryId?.toString() || "",
        businessAreaId: ownerTemplateData.businessAreaId?.toString() || "",
        icon: ownerTemplateData.icon || "FileText",
        color: ownerTemplateData.color || "#5FBDCE",
        variableSchema: (ownerTemplateData.variableSchema as VariableSchema[]) || [],
        estimatedTimeSavings: ownerTemplateData.estimatedTimeSavings?.toString() || "",
        creditCost: ownerTemplateData.creditCost?.toString() || "1",
        llmModel: ownerTemplateData.llmModel || "",
        llmTemperature: ownerTemplateData.llmTemperature?.toString() || "0.7",
        maxTokens: ownerTemplateData.maxTokens?.toString() || "",
        outputFormat: ownerTemplateData.outputFormat || "markdown",
        exampleOutput: ownerTemplateData.exampleOutput || "",
        documentRequired: ownerTemplateData.documentRequired || 0,
        documentCount: ownerTemplateData.documentCount || 1,
        maxFileSize: ownerTemplateData.maxFileSize || 10485760,
        maxPages: ownerTemplateData.maxPages || undefined,
        documentRelevanceCheck: ownerTemplateData.documentRelevanceCheck || 0,
        documentDescription: ownerTemplateData.documentDescription || "",
        maskingRequired: ownerTemplateData.maskingRequired || 0,
        autoMasking: ownerTemplateData.autoMasking || 0,
        keywords: (ownerTemplateData.keywords as string[]) || [],
        marketingEnabled: ownerTemplateData.marketingEnabled || 0,
        marketingHeadline: ownerTemplateData.marketingHeadline || "",
        marketingSubheadline: ownerTemplateData.marketingSubheadline || "",
        marketingUsps: (ownerTemplateData.marketingUsps as string[]) || [],
        marketingCtaText: ownerTemplateData.marketingCtaText || "Jetzt starten",
        marketingMetaDescription: ownerTemplateData.marketingMetaDescription || "",
        marketingKeywords: (ownerTemplateData.marketingKeywords as string[]) || [],
        roiBaseTimeMinutes: ownerTemplateData.roiBaseTimeMinutes ?? 30,
        roiTimePerDocumentMinutes: ownerTemplateData.roiTimePerDocumentMinutes ?? 15,
        roiKi2goTimeMinutes: ownerTemplateData.roiKi2goTimeMinutes ?? 3,
        roiKi2goTimePerDocument: ownerTemplateData.roiKi2goTimePerDocument ?? 1,
        roiHourlyRate: ownerTemplateData.roiHourlyRate ?? 80,
        roiTasksPerMonth: ownerTemplateData.roiTasksPerMonth ?? 10,
        roiSources: (ownerTemplateData.roiSources as { name: string; url: string; finding: string }[]) || [],
        disclaimer: ownerTemplateData.disclaimer || "",
        status: ownerTemplateData.status || "draft",
        createdByName: ownerTemplateData.createdByName || "",
        lastModifiedByName: ownerTemplateData.lastModifiedByName || "",
        templateVersion: ownerTemplateData.templateVersion || "1.0",
        changeLog: ownerTemplateData.changeLog || "",
        organizationName: "",
        customerNumber: "",
        baseTemplateName: "",
        baseTemplateUniqueId: "",
        uniqueId: ownerTemplateData.uniqueId || "",
        isPublic: ownerTemplateData.isPublic || 0,
      });
    }
  }, [mode, customTemplateData, ownerTemplateData]);

  // Variable hinzufügen
  const addVariable = () => {
    setFormData({
      ...formData,
      variableSchema: [
        ...formData.variableSchema,
        {
          key: `VARIABLE_${formData.variableSchema.length + 1}`,
          label: "Neue Variable",
          type: "text" as const,
          required: false,
          placeholder: "",
        },
      ],
    });
  };

  // Variable entfernen
  const removeVariable = (index: number) => {
    setFormData({
      ...formData,
      variableSchema: formData.variableSchema.filter((_, i) => i !== index),
    });
  };

  // Variable aktualisieren
  const updateVariable = (index: number, field: string, value: any) => {
    const updated = [...formData.variableSchema];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, variableSchema: updated });
  };

  // Speichern
  const handleSave = () => {
    // Bei Create: Erstellen statt Update
    if (isCreate) {
      if (mode === "owner") {
        // Generiere slug aus name
        const slug = formData.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        createOwnerMutation.mutate({
          slug,
          name: formData.name,
          title: formData.title,
          description: formData.description || undefined,
          shortDescription: formData.shortDescription || undefined,
          superprompt: formData.superprompt || undefined,
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
          businessAreaId: formData.businessAreaId ? parseInt(formData.businessAreaId) : undefined,
          icon: formData.icon,
          color: formData.color || undefined,
          variableSchema: formData.variableSchema as any,
          estimatedTimeSavings: formData.estimatedTimeSavings ? parseInt(formData.estimatedTimeSavings) : undefined,
          creditCost: parseInt(formData.creditCost) || 1,
          documentRequired: formData.documentRequired,
          documentCount: formData.documentCount,
          maxPages: formData.maxPages,
          documentRelevanceCheck: formData.documentRelevanceCheck,
          documentDescription: formData.documentDescription || undefined,
          maskingRequired: formData.maskingRequired,
          autoMasking: formData.autoMasking,
          keywords: formData.keywords,
          createdByName: formData.createdByName,
          templateVersion: formData.templateVersion,
          roiBaseTimeMinutes: formData.roiBaseTimeMinutes,
          roiTimePerDocumentMinutes: formData.roiTimePerDocumentMinutes,
          roiKi2goTimeMinutes: formData.roiKi2goTimeMinutes,
          roiHourlyRate: formData.roiHourlyRate,
          roiTasksPerMonth: formData.roiTasksPerMonth,
          roiSources: formData.roiSources,
          disclaimer: formData.disclaimer || null,
          status: formData.status as "draft" | "active" | "archived",
          isPublic: formData.isPublic,
          // Marketing-Felder werden nach dem Erstellen über Update hinzugefügt
        });
      } else {
        // Custom-Template erstellen - benötigt baseTemplateId
        toast.error("Custom-Templates können nur über die Kopier-Funktion erstellt werden");
      }
      return;
    }

    if (!templateId) return;

    if (mode === "custom") {
      updateCustomMutation.mutate({
        id: templateId,
        name: formData.name,
        title: formData.title || undefined,
        description: formData.description || undefined,
        shortDescription: formData.shortDescription || undefined,
        superprompt: formData.superprompt || undefined,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        businessAreaId: formData.businessAreaId ? parseInt(formData.businessAreaId) : null,
        icon: formData.icon,
        color: formData.color || undefined,
        variableSchema: formData.variableSchema as any,
        estimatedTimeSavings: formData.estimatedTimeSavings ? parseInt(formData.estimatedTimeSavings) : undefined,
        creditCost: parseInt(formData.creditCost) || 1,
        documentRequired: formData.documentRequired,
        documentCount: formData.documentCount,
        maxPages: formData.maxPages,
        documentRelevanceCheck: formData.documentRelevanceCheck,
        documentDescription: formData.documentDescription || undefined,
        maskingRequired: formData.maskingRequired,
        autoMasking: formData.autoMasking,
        keywords: formData.keywords,
        marketingEnabled: formData.marketingEnabled,
        marketingHeadline: formData.marketingHeadline || undefined,
        marketingSubheadline: formData.marketingSubheadline || undefined,
        marketingUsps: formData.marketingUsps,
        marketingCtaText: formData.marketingCtaText || undefined,
        marketingMetaDescription: formData.marketingMetaDescription || undefined,
        marketingKeywords: formData.marketingKeywords,
        roiBaseTimeMinutes: formData.roiBaseTimeMinutes,
        roiTimePerDocumentMinutes: formData.roiTimePerDocumentMinutes,
        roiKi2goTimeMinutes: formData.roiKi2goTimeMinutes,
        roiHourlyRate: formData.roiHourlyRate,
        roiTasksPerMonth: formData.roiTasksPerMonth,
        roiSources: formData.roiSources,
        disclaimer: formData.disclaimer || null,
        status: formData.status as "active" | "paused" | "archived" | "change_requested",
        templateVersion: formData.templateVersion,
        changeLog: formData.changeLog || undefined,
      });
    } else {
      // Owner-Template Update - nutzt die bestehende API
      updateOwnerMutation.mutate({
        id: templateId,
        name: formData.name,
        title: formData.title,
        description: formData.description || undefined,
        shortDescription: formData.shortDescription || undefined,
        superprompt: formData.superprompt || undefined,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        businessAreaId: formData.businessAreaId ? parseInt(formData.businessAreaId) : null,
        icon: formData.icon,
        color: formData.color || undefined,
        variableSchema: formData.variableSchema as any,
        estimatedTimeSavings: formData.estimatedTimeSavings ? parseInt(formData.estimatedTimeSavings) : null,
        creditCost: parseInt(formData.creditCost) || 1,
        documentRequired: formData.documentRequired,
        documentCount: formData.documentCount,
        maxPages: formData.maxPages,
        documentRelevanceCheck: formData.documentRelevanceCheck,
        documentDescription: formData.documentDescription || undefined,
        maskingRequired: formData.maskingRequired,
        autoMasking: formData.autoMasking,
        keywords: formData.keywords,
        lastModifiedByName: formData.lastModifiedByName,
        templateVersion: formData.templateVersion,
        changeLog: formData.changeLog,
        roiBaseTimeMinutes: formData.roiBaseTimeMinutes,
        roiTimePerDocumentMinutes: formData.roiTimePerDocumentMinutes,
        roiKi2goTimeMinutes: formData.roiKi2goTimeMinutes,
        roiHourlyRate: formData.roiHourlyRate,
        roiTasksPerMonth: formData.roiTasksPerMonth,
        roiSources: formData.roiSources,
        disclaimer: formData.disclaimer || null,
        status: formData.status as "draft" | "active" | "archived",
        isPublic: formData.isPublic,
        marketingEnabled: formData.marketingEnabled,
        marketingHeadline: formData.marketingHeadline || null,
        marketingSubheadline: formData.marketingSubheadline || null,
        marketingUsps: formData.marketingUsps,
        marketingCtaText: formData.marketingCtaText || null,
        marketingMetaDescription: formData.marketingMetaDescription || null,
        marketingKeywords: formData.marketingKeywords,
      });
    }
  };

  const isLoadingData = isLoadingCustom || isLoadingOwner;
  const isSaving = updateCustomMutation.isPending || updateOwnerMutation.isPending;

  // Icon-Komponente
  const IconComponent = (LucideIcons as any)[formData.icon] || FileText;

  // Helper-Funktion für Feld-Status-Icons (Haken-Lösung)
  const FieldStatus = ({ filled }: { filled: boolean }) => (
    filled ? (
      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
    ) : (
      <Circle className="h-3.5 w-3.5 text-gray-300" />
    )
  );

  // Prüfe ob Tabs ausgefüllt sind
  const isBasicComplete = !!(formData.name && formData.title && formData.shortDescription);
  const isVariablesComplete = formData.variableSchema && formData.variableSchema.length > 0;
  const isSuperpromptComplete = !!(formData.superprompt && formData.superprompt.length > 50);
  const isRoiComplete = !!(formData.roiBaseTimeMinutes > 0 && formData.roiKi2goTimeMinutes > 0);
  const isMarketingComplete = !!(formData.marketingHeadline && formData.marketingSubheadline);
  const isDisclaimerComplete = !!(formData.disclaimer && formData.disclaimer.length > 20);
  const isSettingsComplete = !!(formData.categoryId && formData.businessAreaId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: formData.color || "#5FBDCE" }}
            >
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold">
                {mode === "custom" ? "Custom-Template bearbeiten" : "Owner-Template bearbeiten"}
              </div>
              <div className="text-sm font-normal text-muted-foreground">
                {formData.uniqueId || (mode === "custom" ? `CT-${templateId}` : `OT-${templateId}`)}
                {mode === "custom" && formData.organizationName && (
                  <span className="ml-2">• {formData.organizationName} ({formData.customerNumber})</span>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Info-Banner für Custom-Templates */}
            {mode === "custom" && formData.baseTemplateName && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Info className="h-4 w-4" />
                  <span>
                    Basiert auf Owner-Template: <strong>{formData.baseTemplateUniqueId}</strong> - {formData.baseTemplateName}
                  </span>
                </div>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-12 bg-muted/30 w-full">
                <TabsTrigger value="basic" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <FileText className="h-4 w-4 mr-1" />
                  Grunddaten
                  <FieldStatus filled={isBasicComplete} />
                </TabsTrigger>
                <TabsTrigger value="variables" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Variable className="h-4 w-4 mr-1" />
                  Variablen
                  <FieldStatus filled={isVariablesComplete} />
                </TabsTrigger>
                <TabsTrigger value="superprompt" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Superprompt
                  <FieldStatus filled={isSuperpromptComplete} />
                </TabsTrigger>
                <TabsTrigger value="roi" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  ROI
                  <FieldStatus filled={isRoiComplete} />
                </TabsTrigger>
                <TabsTrigger value="marketing" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Megaphone className="h-4 w-4 mr-1" />
                  Marketing
                  <FieldStatus filled={isMarketingComplete} />
                </TabsTrigger>
                <TabsTrigger value="disclaimer" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Disclaimer
                  <FieldStatus filled={isDisclaimerComplete} />
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Einstellungen
                  <FieldStatus filled={isSettingsComplete} />
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Grunddaten */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Interner Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Anzeige-Titel</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Titel für Benutzer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Kurzbeschreibung</Label>
                  <Input
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Kurze Beschreibung (max. 200 Zeichen)"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Beschreibung</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ausführliche Beschreibung"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kategorie</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kategorie wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat: any) => (
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
                      <SelectTrigger>
                        <SelectValue placeholder="Bereich wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessAreas?.map((ba: any) => (
                          <SelectItem key={ba.id} value={ba.id.toString()}>
                            {ba.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select
                      value={formData.icon}
                      onValueChange={(value) => setFormData({ ...formData, icon: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_ICONS.map((icon) => {
                          const Icon = (LucideIcons as any)[icon];
                          return (
                            <SelectItem key={icon} value={icon}>
                              <div className="flex items-center gap-2">
                                {Icon && <Icon className="h-4 w-4" />}
                                <span>{icon}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Farbe</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Version</Label>
                    <Input
                      value={formData.templateVersion}
                      onChange={(e) => setFormData({ ...formData, templateVersion: e.target.value })}
                      placeholder="1.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bearbeiter</Label>
                    <Input
                      value={formData.lastModifiedByName}
                      onChange={(e) => setFormData({ ...formData, lastModifiedByName: e.target.value })}
                      placeholder="Name"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Variablen */}
              <TabsContent value="variables" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Variablen-Schema</h3>
                    <p className="text-sm text-muted-foreground">
                      Definieren Sie die Eingabefelder für dieses Template
                    </p>
                  </div>
                  <Button onClick={addVariable} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Variable hinzufügen
                  </Button>
                </div>

                {formData.variableSchema.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    Keine Variablen definiert. Klicken Sie auf "Variable hinzufügen".
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.variableSchema.map((variable, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                        <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                        <div className="flex-1 grid grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs">Name (Key)</Label>
                            <Input
                              value={variable.name}
                              onChange={(e) => updateVariable(index, "name", e.target.value.toUpperCase().replace(/\s/g, "_"))}
                              className="h-8 text-sm font-mono"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Label</Label>
                            <Input
                              value={variable.label}
                              onChange={(e) => updateVariable(index, "label", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Typ</Label>
                            <Select
                              value={variable.type}
                              onValueChange={(value) => updateVariable(index, "type", value)}
                            >
                              <SelectTrigger className="h-8 text-sm">
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
                          <div className="flex items-end gap-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={variable.required}
                                onChange={(e) => updateVariable(index, "required", e.target.checked)}
                                className="rounded"
                              />
                              Pflicht
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVariable(index)}
                              className="text-red-600 hover:text-red-700 h-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Dropdown-Optionen Editor */}
                        {(variable.type === "select" || variable.type === "multiselect") && (
                          <div className="col-span-4 mt-2 p-3 bg-background rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs font-medium">Dropdown-Optionen</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentOptions = variable.options || [];
                                  updateVariable(index, "options", [...currentOptions, "Neue Option"]);
                                }}
                                className="h-6 text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" /> Option
                              </Button>
                            </div>
                            {(!variable.options || variable.options.length === 0) ? (
                              <p className="text-xs text-muted-foreground italic">Keine Optionen definiert</p>
                            ) : (
                              <div className="space-y-1">
                                {variable.options.map((option, optIndex) => (
                                  <div key={optIndex} className="flex items-center gap-2">
                                    <Input
                                      value={option}
                                      onChange={(e) => {
                                        const newOptions = [...(variable.options || [])];
                                        newOptions[optIndex] = e.target.value;
                                        updateVariable(index, "options", newOptions);
                                      }}
                                      className="h-7 text-sm flex-1"
                                      placeholder={`Option ${optIndex + 1}`}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newOptions = (variable.options || []).filter((_, i) => i !== optIndex);
                                        updateVariable(index, "options", newOptions);
                                      }}
                                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: Superprompt */}
              <TabsContent value="superprompt" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Superprompt</Label>
                  <Textarea
                    value={formData.superprompt}
                    onChange={(e) => setFormData({ ...formData, superprompt: e.target.value })}
                    placeholder="Der Superprompt mit {{VARIABLEN}}..."
                    className="font-mono text-sm min-h-[400px]"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Verwenden Sie {"{{VARIABLE_NAME}}"} für Variablen-Platzhalter
                  </span>
                  <span>{formData.superprompt.length} Zeichen</span>
                </div>
              </TabsContent>

              {/* Tab 4: ROI */}
              <TabsContent value="roi" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-6">
                  {/* Linke Seite: Eingabefelder */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Zeitparameter (Manuell)
                    </h3>
                    
                    <div className="space-y-2">
                      <Label>Basis-Zeitaufwand</Label>
                      <div className="flex items-center gap-2">
                        <Input
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
                      <Label>Zeit pro Dokument</Label>
                      <div className="flex items-center gap-2">
                        <Input
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

                    <h3 className="font-medium flex items-center gap-2 pt-4 border-t">
                      <Sparkles className="h-4 w-4 text-primary" />
                      KI2GO Zeitparameter
                    </h3>

                    <div className="space-y-2">
                      <Label>KI2GO Basis-Bearbeitungszeit</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={formData.roiKi2goTimeMinutes}
                          onChange={(e) => setFormData({ ...formData, roiKi2goTimeMinutes: parseInt(e.target.value) || 1 })}
                          min={1}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">Minuten</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Grundzeit für KI2GO Bearbeitung</p>
                    </div>

                    <div className="space-y-2">
                      <Label>KI2GO Zeit pro zusätzliches Dokument</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={formData.roiKi2goTimePerDocument}
                          onChange={(e) => setFormData({ ...formData, roiKi2goTimePerDocument: parseInt(e.target.value) || 0 })}
                          min={0}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">Min. pro Dokument</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Zusätzliche KI2GO-Zeit für jedes weitere Dokument</p>
                    </div>

                    <h3 className="font-medium flex items-center gap-2 pt-4 border-t">
                      <Euro className="h-4 w-4" />
                      Kostenparameter
                    </h3>

                    <div className="space-y-2">
                      <Label>Standard-Stundensatz</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={formData.roiHourlyRate}
                          onChange={(e) => setFormData({ ...formData, roiHourlyRate: parseInt(e.target.value) || 0 })}
                          min={0}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">€ / Stunde</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Wird für die Geldersparnis-Berechnung verwendet</p>
                    </div>

                    {/* Magic ROI Button */}
                    <div className="pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800 hover:from-purple-100 hover:to-pink-100"
                        onClick={handleMagicRoi}
                        disabled={isAnalyzingRoi || !formData.superprompt}
                      >
                        {isAnalyzingRoi ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analysiere...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                            ✨ Magic ROI - KI-Vorschlag generieren
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Analysiert den Superprompt und schlägt optimale ROI-Werte vor
                      </p>
                    </div>
                  </div>

                  {/* Rechte Seite: Vorschau mit Slider */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      ROI-Vorschau
                    </h3>

                    {/* Dokument-Slider */}
                    <div className="space-y-2">
                      <Label>Anzahl Dokumente: <span className="font-bold text-primary">{roiPreviewDocs}</span></Label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={roiPreviewDocs}
                        onChange={(e) => setRoiPreviewDocs(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1</span>
                        <span>5</span>
                        <span>10</span>
                      </div>
                    </div>
                    
                    {/* Dynamische ROI-Vorschau */}
                    <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-lg">{roiPreviewDocs} {roiPreviewDocs === 1 ? 'Dokument' : 'Dokumente'}</span>
                        </div>
                      </div>
                      
                      {/* Balkendiagramm */}
                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Manuell</span>
                            <span className="font-medium">{formData.roiBaseTimeMinutes + (formData.roiTimePerDocumentMinutes * roiPreviewDocs)} Min.</span>
                          </div>
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-400 dark:bg-red-500 rounded-full transition-all duration-300"
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">KI2GO</span>
                            <span className="font-medium text-green-600">{formData.roiKi2goTimeMinutes + ((roiPreviewDocs - 1) * formData.roiKi2goTimePerDocument)} Min.</span>
                          </div>
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min(100, ((formData.roiKi2goTimeMinutes + ((roiPreviewDocs - 1) * formData.roiKi2goTimePerDocument)) / (formData.roiBaseTimeMinutes + (formData.roiTimePerDocumentMinutes * roiPreviewDocs))) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Ersparnis */}
                      <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {(() => {
                              const manualTime = formData.roiBaseTimeMinutes + (formData.roiTimePerDocumentMinutes * roiPreviewDocs);
                              const ki2goTime = formData.roiKi2goTimeMinutes + ((roiPreviewDocs - 1) * formData.roiKi2goTimePerDocument);
                              return manualTime - ki2goTime;
                            })()} Min. gespart
                          </div>
                          <div className="text-lg font-medium text-green-700 dark:text-green-300">
                            = € {(() => {
                              const manualTime = formData.roiBaseTimeMinutes + (formData.roiTimePerDocumentMinutes * roiPreviewDocs);
                              const ki2goTime = formData.roiKi2goTimeMinutes + ((roiPreviewDocs - 1) * formData.roiKi2goTimePerDocument);
                              return Math.round((manualTime - ki2goTime) / 60 * formData.roiHourlyRate);
                            })()} pro Aufgabe
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Jahresersparnis */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        Jahresersparnis-Rechner
                      </h4>
                      <div className="space-y-2">
                        <Label className="text-sm">Aufgaben pro Monat (für Jahresersparnis): <span className="font-bold text-purple-600">{formData.roiTasksPerMonth}</span></Label>
                        <input
                          type="range"
                          min={1}
                          max={100}
                          value={formData.roiTasksPerMonth}
                          onChange={(e) => setFormData(prev => ({ ...prev, roiTasksPerMonth: parseInt(e.target.value) }))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-purple-600"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1</span>
                          <span>50</span>
                          <span>100</span>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-center">
                        <div className="text-sm text-muted-foreground">Bei {formData.roiTasksPerMonth} Aufgaben/Monat:</div>
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                          € {(() => {
                            const manualTime = formData.roiBaseTimeMinutes + (formData.roiTimePerDocumentMinutes * roiPreviewDocs);
                            const ki2goTime = formData.roiKi2goTimeMinutes + ((roiPreviewDocs - 1) * formData.roiKi2goTimePerDocument);
                            const savingsPerTask = Math.round((manualTime - ki2goTime) / 60 * formData.roiHourlyRate);
                            return (savingsPerTask * formData.roiTasksPerMonth * 12).toLocaleString('de-DE');
                          })()} / Jahr
                        </div>
                        <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                          {(() => {
                            const manualTime = formData.roiBaseTimeMinutes + (formData.roiTimePerDocumentMinutes * roiPreviewDocs);
                            const ki2goTime = formData.roiKi2goTimeMinutes + ((roiPreviewDocs - 1) * formData.roiKi2goTimePerDocument);
                            const hoursPerYear = Math.round((manualTime - ki2goTime) * formData.roiTasksPerMonth * 12 / 60);
                            return `${hoursPerYear} Stunden/Jahr gespart`;
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        <strong>Hinweis:</strong> Diese Werte werden dem Benutzer bei der Aufgabenausführung angezeigt. 
                        Ein Disclaimer weist darauf hin, dass die Zeitersparnis auf Erfahrungswerten basiert und variieren kann.
                      </p>
                    </div>

                    {/* Quellenangaben */}
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Quellenangaben</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({
                            ...formData,
                            roiSources: [...formData.roiSources, { name: "", url: "", finding: "" }]
                          })}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Quelle hinzufügen
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Fügen Sie Studien und Quellen hinzu, die Ihre ROI-Annahmen stützen. Diese werden im ROI-Rechner angezeigt.
                      </p>
                      
                      {formData.roiSources.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                          Noch keine Quellen hinzugefügt
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {formData.roiSources.map((source, index) => (
                            <div key={index} className="p-3 border rounded-lg space-y-2 bg-gray-50 dark:bg-gray-900/50">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Quelle {index + 1}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => setFormData({
                                    ...formData,
                                    roiSources: formData.roiSources.filter((_, i) => i !== index)
                                  })}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <Input
                                placeholder="Name der Studie/Quelle (z.B. McKinsey Legal Tech Report 2024)"
                                value={source.name}
                                onChange={(e) => {
                                  const newSources = [...formData.roiSources];
                                  newSources[index] = { ...source, name: e.target.value };
                                  setFormData({ ...formData, roiSources: newSources });
                                }}
                              />
                              <Input
                                placeholder="URL zur Quelle (optional)"
                                value={source.url}
                                onChange={(e) => {
                                  const newSources = [...formData.roiSources];
                                  newSources[index] = { ...source, url: e.target.value };
                                  setFormData({ ...formData, roiSources: newSources });
                                }}
                              />
                              <Input
                                placeholder="Wichtigste Erkenntnis (z.B. 40-60% Zeitersparnis bei Dokumentenanalyse)"
                                value={source.finding}
                                onChange={(e) => {
                                  const newSources = [...formData.roiSources];
                                  newSources[index] = { ...source, finding: e.target.value };
                                  setFormData({ ...formData, roiSources: newSources });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 5: Marketing */}
              <TabsContent value="marketing" className="space-y-4 mt-4">
                {/* Magic Marketing Button */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Magic Marketing
                      </h3>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                        Generiert automatisch SEO-optimierte Marketing-Texte basierend auf Titel und ROI-Daten
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      onClick={handleMagicMarketing}
                      disabled={isGeneratingMarketing || !formData.title}
                    >
                      {isGeneratingMarketing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generiere...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          ✨ Marketing generieren
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Linke Seite: Eingabefelder */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Marketing aktiviert</Label>
                        <Select
                          value={formData.marketingEnabled.toString()}
                          onValueChange={(value) => setFormData({ ...formData, marketingEnabled: parseInt(value) })}
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
                        <Label>CTA-Text</Label>
                        <Input
                          value={formData.marketingCtaText}
                          onChange={(e) => setFormData({ ...formData, marketingCtaText: e.target.value })}
                          placeholder="Jetzt starten"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Headline (max. 60 Zeichen)</Label>
                      <Input
                        value={formData.marketingHeadline}
                        onChange={(e) => setFormData({ ...formData, marketingHeadline: e.target.value })}
                        placeholder="Marketing-Headline"
                        maxLength={60}
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {formData.marketingHeadline.length}/60
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Subheadline (max. 100 Zeichen)</Label>
                      <Input
                        value={formData.marketingSubheadline}
                        onChange={(e) => setFormData({ ...formData, marketingSubheadline: e.target.value })}
                        placeholder="Marketing-Subheadline"
                        maxLength={100}
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {formData.marketingSubheadline.length}/100
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Meta-Description (SEO, max. 160 Zeichen)</Label>
                      <Textarea
                        value={formData.marketingMetaDescription}
                        onChange={(e) => setFormData({ ...formData, marketingMetaDescription: e.target.value })}
                        placeholder="SEO Meta-Description"
                        maxLength={160}
                        rows={2}
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {formData.marketingMetaDescription.length}/160
                      </div>
                    </div>

                    {/* USPs */}
                    <div className="space-y-2">
                      <Label>USPs (Unique Selling Points, max. 5)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newUsp}
                          onChange={(e) => setNewUsp(e.target.value)}
                          placeholder="Neuen USP eingeben..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newUsp.trim() && formData.marketingUsps.length < 5) {
                              e.preventDefault();
                              setFormData({
                                ...formData,
                                marketingUsps: [...formData.marketingUsps, newUsp.trim()],
                              });
                              setNewUsp("");
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (newUsp.trim() && formData.marketingUsps.length < 5) {
                              setFormData({
                                ...formData,
                                marketingUsps: [...formData.marketingUsps, newUsp.trim()],
                              });
                              setNewUsp("");
                            }
                          }}
                          disabled={!newUsp.trim() || formData.marketingUsps.length >= 5}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.marketingUsps.map((usp: string, index: number) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            {usp}
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                marketingUsps: formData.marketingUsps.filter((_: string, i: number) => i !== index),
                              })}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Keywords */}
                    <div className="space-y-2">
                      <Label>SEO Keywords (max. 10)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          placeholder="Neues Keyword eingeben..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newKeyword.trim() && formData.marketingKeywords.length < 10) {
                              e.preventDefault();
                              setFormData({
                                ...formData,
                                marketingKeywords: [...formData.marketingKeywords, newKeyword.trim()],
                              });
                              setNewKeyword("");
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (newKeyword.trim() && formData.marketingKeywords.length < 10) {
                              setFormData({
                                ...formData,
                                marketingKeywords: [...formData.marketingKeywords, newKeyword.trim()],
                              });
                              setNewKeyword("");
                            }
                          }}
                          disabled={!newKeyword.trim() || formData.marketingKeywords.length >= 10}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.marketingKeywords.map((keyword: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                marketingKeywords: formData.marketingKeywords.filter((_: string, i: number) => i !== index),
                              })}
                              className="ml-1 hover:text-destructive"
                            >
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
                      <Megaphone className="h-4 w-4" />
                      Vorschau
                    </h3>

                    {/* ROI-Vorschau für Marketing */}
                    <div className="p-4 bg-primary/5 rounded-lg border">
                      <h4 className="text-sm font-medium mb-2">ROI-Anzeige für Benutzer:</h4>
                      <div className="text-2xl font-bold text-primary">
                        {formData.roiBaseTimeMinutes + formData.roiTimePerDocumentMinutes - formData.roiKi2goTimeMinutes} Min. gespart
                      </div>
                      <div className="text-sm text-muted-foreground">
                        = € {Math.round((formData.roiBaseTimeMinutes + formData.roiTimePerDocumentMinutes - formData.roiKi2goTimeMinutes) / 60 * formData.roiHourlyRate)} pro Aufgabe
                      </div>
                    </div>

                    {/* Google-Suchergebnis Vorschau */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Google-Suchergebnis Vorschau:</h4>
                      <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                        <div className="text-blue-600 dark:text-blue-400 text-lg hover:underline cursor-pointer">
                          {formData.marketingHeadline || formData.title || "Seitentitel"}
                        </div>
                        <div className="text-green-700 dark:text-green-500 text-sm">
                          ki2go.at/aufgabe/{formData.name?.toLowerCase().replace(/\s+/g, "-") || "slug"}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          {formData.marketingMetaDescription || formData.shortDescription || "Meta-Beschreibung erscheint hier..."}
                        </div>
                      </div>
                    </div>

                    {/* USPs-Vorschau */}
                    {formData.marketingUsps.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">USPs-Vorschau:</h4>
                        <div className="space-y-1">
                          {formData.marketingUsps.map((usp: string, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-600" />
                              {usp}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
              </TabsContent>

              {/* Tab 6: Disclaimer */}
              <TabsContent value="disclaimer" className="space-y-4 mt-4">
                {/* Magic Disclaimer Button */}
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Magic Disclaimer
                      </h3>
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                        Generiert automatisch einen rechtlich fundierten Disclaimer basierend auf Aufgabentyp und Superprompt
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                      onClick={handleMagicDisclaimer}
                      disabled={isGeneratingDisclaimer || !formData.title}
                    >
                      {isGeneratingDisclaimer ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generiere...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          ✨ Disclaimer generieren
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Disclaimer-Text
                    </Label>
                    <Textarea
                      value={formData.disclaimer}
                      onChange={(e) => setFormData({ ...formData, disclaimer: e.target.value })}
                      placeholder="Rechtlicher Hinweis für die Ergebnisse dieser Aufgabe...\n\nBeispiel: Die dargestellten Ergebnisse wurden mithilfe von KI generiert und dienen ausschließlich zu Informationszwecken. Eine Überprüfung durch qualifizierte Fachpersonen wird empfohlen."
                      rows={6}
                      className="resize-y min-h-[150px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Dieser Text wird den Benutzern bei der Ergebnisanzeige als rechtlicher Hinweis angezeigt.
                    </p>
                  </div>

                  {/* Vorschau */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Vorschau: So sieht der Disclaimer für Benutzer aus
                    </h4>
                    <div className="text-sm text-amber-800 dark:text-amber-200 bg-white dark:bg-gray-900 p-3 rounded border">
                      {formData.disclaimer || <span className="text-muted-foreground italic">Kein Disclaimer definiert</span>}
                    </div>
                  </div>

                  {/* Hinweise */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Empfehlungen für Disclaimer
                    </h4>
                    <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
                      <li>Kommunizieren Sie klar, dass es sich um KI-generierte Inhalte handelt</li>
                      <li>Weisen Sie auf die Notwendigkeit menschlicher Überprüfung hin</li>
                      <li>Schließen Sie Haftung für Fehler und Ungenauigkeiten aus</li>
                      <li>Passen Sie den Text an die spezifische Aufgabe an</li>
                      <li>Halten Sie den Text kurz und verständlich (3-4 Sätze)</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 7: Einstellungen */}
              <TabsContent value="settings" className="space-y-4 mt-4">
                {/* Status-Feld - wichtig für Template-Verwaltung */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">Template-Status</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value as typeof formData.status })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {mode === "owner" ? (
                            <>
                              <SelectItem value="draft">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                  Entwurf
                                </span>
                              </SelectItem>
                              <SelectItem value="active">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  Aktiv
                                </span>
                              </SelectItem>
                              <SelectItem value="archived">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  Archiviert
                                </span>
                              </SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="active">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  Aktiv
                                </span>
                              </SelectItem>
                              <SelectItem value="paused">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                  Pausiert
                                </span>
                              </SelectItem>
                              <SelectItem value="archived">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  Archiviert
                                </span>
                              </SelectItem>
                              <SelectItem value="change_requested">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                  Änderung angefragt
                                </span>
                              </SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {mode === "owner" 
                          ? "Nur aktive Templates sind für Kunden sichtbar" 
                          : "Pausierte Templates können nicht ausgeführt werden"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Öffentlich sichtbar</Label>
                      <Select
                        value={formData.isPublic.toString()}
                        onValueChange={(value) => setFormData({ ...formData, isPublic: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Nein (nur für eingeloggte Nutzer)</SelectItem>
                          <SelectItem value="1">Ja (öffentlich zugänglich)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dokument erforderlich</Label>
                    <Select
                      value={formData.documentRequired.toString()}
                      onValueChange={(value) => setFormData({ ...formData, documentRequired: parseInt(value) })}
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
                      value={formData.documentCount}
                      onChange={(e) => setFormData({ ...formData, documentCount: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max. Seitenzahl (PDF)</Label>
                    <Input
                      type="number"
                      value={formData.maxPages || ""}
                      onChange={(e) => setFormData({ ...formData, maxPages: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Unbegrenzt"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relevanz-Check</Label>
                    <Select
                      value={formData.documentRelevanceCheck.toString()}
                      onValueChange={(value) => setFormData({ ...formData, documentRelevanceCheck: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Deaktiviert</SelectItem>
                        <SelectItem value="1">Aktiviert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dokument-Beschreibung</Label>
                  <Textarea
                    value={formData.documentDescription}
                    onChange={(e) => setFormData({ ...formData, documentDescription: e.target.value })}
                    placeholder="Welches Dokument wird erwartet?"
                    rows={2}
                  />
                </div>
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-4">Masking-Einstellungen</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Masking anbieten</Label>
                      <Select
                        value={formData.maskingRequired.toString()}
                        onValueChange={(value) => setFormData({ ...formData, maskingRequired: parseInt(value) })}
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
                        value={formData.autoMasking.toString()}
                        onValueChange={(value) => setFormData({ ...formData, autoMasking: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Deaktiviert</SelectItem>
                          <SelectItem value="1">Aktiviert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-4">Änderungsprotokoll</h4>
                  <div className="space-y-2">
                    <Label>Änderungsbeschreibung</Label>
                    <Textarea
                      value={formData.changeLog}
                      onChange={(e) => setFormData({ ...formData, changeLog: e.target.value })}
                      placeholder="Was wurde geändert?"
                      rows={2}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isLoadingData || saveSuccess}
            className={saveSuccess ? "bg-green-500 hover:bg-green-500 transition-all duration-300" : ""}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2 animate-bounce" />
                Erfolgreich gespeichert!
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Speichern...
              </>
            ) : (
              "Änderungen speichern"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
