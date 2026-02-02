import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Building2, 
  User, 
  Globe,
  FileText,
  BarChart3,
  RefreshCw,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  PauseCircle,
  Archive,
  AlertCircle,
  TrendingUp,
  Calendar,
  Hash,
  Settings
} from "lucide-react";
import { TemplateEditor } from "@/components/TemplateEditor";

type SortField = "name" | "uniqueId" | "usageCount" | "lastUsedAt" | "createdAt" | "organizationName";
type SortOrder = "asc" | "desc";
type StatusFilter = "all" | "active" | "paused" | "archived" | "change_requested";

export default function AdminCustomTemplates() {
  // Filter & Sortierung State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState<number | undefined>(undefined);
  const [baseTemplateFilter, setBaseTemplateFilter] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  
  // Dialog State
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFullEditDialog, setShowFullEditDialog] = useState(false); // Universeller Editor
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    baseTemplateId: 0,
    organizationId: null as number | null,
    userId: null as number | null,
    name: "",
    description: "",
    superprompt: "",
  });
  const [assignOrgId, setAssignOrgId] = useState<number | null>(null);

  // API Queries
  const { data: templatesData, isLoading, refetch } = trpc.customSuperprompt.getAllWithDetails.useQuery({
    page,
    limit: 50,
    search: search || undefined,
    organizationId: organizationFilter,
    baseTemplateId: baseTemplateFilter,
    status: statusFilter,
    sortBy,
    sortOrder,
  });

  const { data: extendedStats } = trpc.customSuperprompt.getExtendedStats.useQuery();
  const { data: organizations } = trpc.customSuperprompt.getOrganizationsForAssignment.useQuery();
  const { data: ownerTemplates } = trpc.customSuperprompt.getOwnerTemplatesForFilter.useQuery();
  const baseTemplatesQuery = trpc.template.list.useQuery({});
  const baseTemplates = baseTemplatesQuery.data;

  // Mutations
  const toggleActiveMutation = trpc.customSuperprompt.toggleActive.useMutation({
    onSuccess: () => { toast.success("Status geändert"); refetch(); },
    onError: (error) => { toast.error(`Fehler: ${error.message}`); },
  });

  const updateStatusMutation = trpc.customSuperprompt.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status aktualisiert"); refetch(); },
    onError: (error) => { toast.error(`Fehler: ${error.message}`); },
  });

  const assignMutation = trpc.customSuperprompt.assignToOrganization.useMutation({
    onSuccess: (data) => { 
      toast.success(`Kundenzuweisung geändert. Neue ID: ${data.newUniqueId}`); 
      refetch(); 
      setShowAssignDialog(false); 
    },
    onError: (error) => { toast.error(`Fehler: ${error.message}`); },
  });

  const deleteMutation = trpc.customSuperprompt.delete.useMutation({
    onSuccess: () => { toast.success("Template gelöscht"); refetch(); setShowDetailDialog(false); },
    onError: (error) => { toast.error(`Fehler: ${error.message}`); },
  });

  const createMutation = trpc.customSuperprompt.create.useMutation({
    onSuccess: () => { toast.success("Template erstellt"); refetch(); setShowCreateDialog(false); resetForm(); },
    onError: (error) => { toast.error(`Fehler: ${error.message}`); },
  });

  const updateMutation = trpc.customSuperprompt.update.useMutation({
    onSuccess: () => { toast.success("Template aktualisiert"); refetch(); setShowEditDialog(false); },
    onError: (error) => { toast.error(`Fehler: ${error.message}`); },
  });

  const resetForm = () => {
    setFormData({ baseTemplateId: 0, organizationId: null, userId: null, name: "", description: "", superprompt: "" });
  };

  // Sortierung Toggle
  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Status Badge
  const getStatusBadge = (status: string | null, isActive: number | boolean) => {
    const effectiveStatus = status || (isActive ? "active" : "paused");
    switch (effectiveStatus) {
      case "active":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aktiv</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800"><PauseCircle className="h-3 w-3 mr-1" />Pausiert</Badge>;
      case "archived":
        return <Badge className="bg-gray-100 text-gray-800"><Archive className="h-3 w-3 mr-1" />Archiviert</Badge>;
      case "change_requested":
        return <Badge className="bg-orange-100 text-orange-800"><AlertCircle className="h-3 w-3 mr-1" />Änderung angefragt</Badge>;
      default:
        return <Badge variant="outline">{effectiveStatus}</Badge>;
    }
  };

  const handleCreate = () => {
    if (!formData.baseTemplateId || !formData.name || !formData.superprompt) {
      toast.error("Bitte alle Pflichtfelder ausfüllen");
      return;
    }
    createMutation.mutate({
      baseTemplateId: formData.baseTemplateId,
      organizationId: formData.organizationId,
      userId: formData.userId,
      name: formData.name,
      description: formData.description || undefined,
      superprompt: formData.superprompt,
    });
  };

  const handleUpdate = () => {
    if (!selectedTemplate) return;
    updateMutation.mutate({
      id: selectedTemplate.id,
      name: formData.name || undefined,
      description: formData.description,
      superprompt: formData.superprompt || undefined,
      changeDescription: "Manuell bearbeitet",
    });
  };

  const handleAssign = () => {
    if (!selectedTemplate) return;
    assignMutation.mutate({
      id: selectedTemplate.id,
      organizationId: assignOrgId,
    });
  };

  const openEditDialog = (template: any) => {
    setSelectedTemplate(template);
    setFormData({
      baseTemplateId: template.baseTemplateId,
      organizationId: template.organizationId,
      userId: template.userId,
      name: template.name,
      description: template.description || "",
      superprompt: "",
    });
    setShowEditDialog(true);
  };

  const openAssignDialog = (template: any) => {
    setSelectedTemplate(template);
    setAssignOrgId(template.organizationId);
    setShowAssignDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück zum Admin
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Custom-Templates Verwaltung</h1>
                <p className="text-sm text-gray-500">Kundenspezifische Template-Anpassungen mit CT-Nummerierung</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Custom-Template
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gesamt Custom-Templates</p>
                  <p className="text-3xl font-bold">{extendedStats?.total || 0}</p>
                </div>
                <FileText className="h-10 w-10 text-gray-300" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Aktiv / Pausiert</p>
                  <p className="text-3xl font-bold">
                    <span className="text-green-600">{extendedStats?.byStatus?.active || 0}</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-yellow-600">{extendedStats?.byStatus?.paused || 0}</span>
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-300" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Firmen mit Templates</p>
                  <p className="text-3xl font-bold text-purple-600">{extendedStats?.byOrganization?.length || 0}</p>
                </div>
                <Building2 className="h-10 w-10 text-purple-300" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gesamtnutzungen</p>
                  <p className="text-3xl font-bold text-blue-600">{extendedStats?.totalUsage || 0}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-blue-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter-Bereich */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Suche */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Suche nach Name, Template-ID, Firma..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Firma Filter */}
              <Select 
                value={organizationFilter?.toString() || "all"} 
                onValueChange={(v) => setOrganizationFilter(v === "all" ? undefined : parseInt(v))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Alle Firmen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Firmen</SelectItem>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.customerNumber} - {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Owner-Template Filter */}
              <Select 
                value={baseTemplateFilter?.toString() || "all"} 
                onValueChange={(v) => setBaseTemplateFilter(v === "all" ? undefined : parseInt(v))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Alle Owner-Templates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Owner-Templates</SelectItem>
                  {ownerTemplates?.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.uniqueId} - {t.name?.substring(0, 30)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Alle Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="paused">Pausiert</SelectItem>
                  <SelectItem value="archived">Archiviert</SelectItem>
                  <SelectItem value="change_requested">Änderung angefragt</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Haupt-Tabelle */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Custom-Templates</CardTitle>
                <CardDescription>
                  {templatesData?.total || 0} Templates gefunden 
                  {templatesData?.totalPages && templatesData.totalPages > 1 && ` (Seite ${page} von ${templatesData.totalPages})`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Laden...</div>
            ) : !templatesData?.templates?.length ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Keine Custom-Templates gefunden</p>
                <p className="text-sm mt-2">Passen Sie die Filter an oder erstellen Sie ein neues Template.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium">
                          <button onClick={() => toggleSort("uniqueId")} className="flex items-center gap-1 hover:text-primary">
                            Template-ID {getSortIcon("uniqueId")}
                          </button>
                        </th>
                        <th className="pb-3 font-medium">
                          <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-primary">
                            Name {getSortIcon("name")}
                          </button>
                        </th>
                        <th className="pb-3 font-medium">Owner-Template</th>
                        <th className="pb-3 font-medium">
                          <button onClick={() => toggleSort("organizationName")} className="flex items-center gap-1 hover:text-primary">
                            Firma {getSortIcon("organizationName")}
                          </button>
                        </th>
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium text-center">
                          <button onClick={() => toggleSort("usageCount")} className="flex items-center gap-1 hover:text-primary mx-auto">
                            Nutzungen {getSortIcon("usageCount")}
                          </button>
                        </th>
                        <th className="pb-3 font-medium">
                          <button onClick={() => toggleSort("lastUsedAt")} className="flex items-center gap-1 hover:text-primary">
                            Letzte Nutzung {getSortIcon("lastUsedAt")}
                          </button>
                        </th>
                        <th className="pb-3 font-medium text-center">Version</th>
                        <th className="pb-3 font-medium text-center">Status</th>
                        <th className="pb-3 font-medium text-right">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templatesData.templates.map((template) => (
                        <tr key={template.id} className="border-b hover:bg-gray-50">
                          <td className="py-3">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                              {template.uniqueId || `CT-${template.id}`}
                            </code>
                          </td>
                          <td className="py-3">
                            <div className="font-medium">{template.name}</div>
                            {template.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">{template.description}</div>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="text-sm">
                              <code className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                {template.baseTemplateUniqueId || `OT-${template.baseTemplateId}`}
                              </code>
                              <div className="text-gray-500 mt-1 truncate max-w-[150px]">
                                {template.baseTemplateName}
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            {template.organizationId ? (
                              <div>
                                <Badge variant="outline" className="bg-purple-50">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  {template.customerNumber}
                                </Badge>
                                <div className="text-sm text-gray-500 mt-1">{template.organizationName}</div>
                              </div>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800">
                                <Globe className="h-3 w-3 mr-1" />Global
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 text-sm">
                            {template.userName || (template.userId ? `User #${template.userId}` : "-")}
                          </td>
                          <td className="py-3 text-center">
                            <span className="flex items-center justify-center gap-1">
                              <BarChart3 className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{template.usageCount || 0}</span>
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-500">
                            {template.lastUsedAt 
                              ? new Date(template.lastUsedAt).toLocaleDateString("de-DE")
                              : "-"
                            }
                          </td>
                          <td className="py-3 text-center">
                            <Badge variant="outline">V{template.version}</Badge>
                          </td>
                          <td className="py-3 text-center">
                            {getStatusBadge(template.status, template.isActive)}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setSelectedTemplate(template); setShowDetailDialog(true); }}
                                title="Details anzeigen"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => openAssignDialog(template)}
                                title="Kundenzuweisung ändern"
                              >
                                <Building2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setSelectedTemplate(template); setShowFullEditDialog(true); }}
                                title="Bearbeiten"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => { 
                                  if (confirm("Template wirklich löschen?")) { 
                                    deleteMutation.mutate({ id: template.id }); 
                                  } 
                                }}
                                title="Löschen"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {templatesData.totalPages && templatesData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Zeige {((page - 1) * 50) + 1} - {Math.min(page * 50, templatesData.total)} von {templatesData.total}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                      >
                        Zurück
                      </Button>
                      <span className="text-sm">Seite {page} von {templatesData.totalPages}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={page >= templatesData.totalPages}
                        onClick={() => setPage(p => p + 1)}
                      >
                        Weiter
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Statistik nach Firma */}
        {extendedStats?.byOrganization && extendedStats.byOrganization.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Nutzung nach Firma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {extendedStats.byOrganization.slice(0, 6).map((org, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{org.name}</div>
                      <div className="text-sm text-gray-500">{org.customerNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{org.count}</div>
                      <div className="text-sm text-gray-500">{org.usage} Nutzungen</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Custom-Template Details</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.uniqueId || `CT-${selectedTemplate?.id}`}
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Name</Label>
                  <p className="font-medium">{selectedTemplate.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Version</Label>
                  <p className="font-medium">V{selectedTemplate.version}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Owner-Template</Label>
                  <p className="font-medium">
                    {selectedTemplate.baseTemplateUniqueId || `OT-${selectedTemplate.baseTemplateId}`}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Firma</Label>
                  <p className="font-medium">
                    {selectedTemplate.organizationName || "Global"}
                    {selectedTemplate.customerNumber && ` (${selectedTemplate.customerNumber})`}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Nutzungen</Label>
                  <p className="font-medium">{selectedTemplate.usageCount || 0}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Letzte Nutzung</Label>
                  <p className="font-medium">
                    {selectedTemplate.lastUsedAt 
                      ? new Date(selectedTemplate.lastUsedAt).toLocaleString("de-DE")
                      : "Noch nie"
                    }
                  </p>
                </div>
              </div>
              {selectedTemplate.description && (
                <div>
                  <Label className="text-gray-500">Beschreibung</Label>
                  <p className="mt-1">{selectedTemplate.description}</p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-4">
                <Label className="text-gray-500">Status:</Label>
                {getStatusBadge(selectedTemplate.status, selectedTemplate.isActive)}
                <div className="flex-1" />
                <Select 
                  value={selectedTemplate.status || (selectedTemplate.isActive ? "active" : "paused")}
                  onValueChange={(v) => {
                    updateStatusMutation.mutate({ 
                      id: selectedTemplate.id, 
                      status: v as "active" | "paused" | "archived" | "change_requested" 
                    });
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="paused">Pausiert</SelectItem>
                    <SelectItem value="archived">Archiviert</SelectItem>
                    <SelectItem value="change_requested">Änderung angefragt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Schließen</Button>
            <Button onClick={() => { setShowDetailDialog(false); openEditDialog(selectedTemplate); }}>
              Bearbeiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kundenzuweisung Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kundenzuweisung ändern</DialogTitle>
            <DialogDescription>
              Weisen Sie dieses Custom-Template einer anderen Firma zu.
              Die Template-ID wird automatisch aktualisiert.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Aktuelle ID</Label>
              <code className="block mt-1 text-sm bg-gray-100 px-3 py-2 rounded">
                {selectedTemplate?.uniqueId || `CT-${selectedTemplate?.id}`}
              </code>
            </div>
            <div>
              <Label>Firma auswählen</Label>
              <Select 
                value={assignOrgId?.toString() || "global"} 
                onValueChange={(v) => setAssignOrgId(v === "global" ? null : parseInt(v))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Firma auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (keine Firma)</SelectItem>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.customerNumber} - {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {assignOrgId && (
              <div>
                <Label>Neue ID (Vorschau)</Label>
                <code className="block mt-1 text-sm bg-green-50 text-green-700 px-3 py-2 rounded">
                  CT-{String(selectedTemplate?.baseTemplateId).padStart(3, '0')}-
                  {organizations?.find(o => o.id === assignOrgId)?.customerNumber || `K2026-${String(assignOrgId).padStart(3, '0')}`}-
                  V{selectedTemplate?.version}
                </code>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Abbrechen</Button>
            <Button onClick={handleAssign} disabled={assignMutation.isPending}>
              {assignMutation.isPending ? "Speichern..." : "Zuweisung speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neues Custom-Template erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein kundenspezifisches Template basierend auf einem Owner-Template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Owner-Template *</Label>
                <Select 
                  value={formData.baseTemplateId?.toString() || ""} 
                  onValueChange={(v) => setFormData({...formData, baseTemplateId: parseInt(v)})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Template auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {baseTemplates?.map((t: any) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.uniqueId || `OT-${t.id}`} - {t.name?.substring(0, 30)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Firma</Label>
                <Select 
                  value={formData.organizationId?.toString() || "global"} 
                  onValueChange={(v) => setFormData({...formData, organizationId: v === "global" ? null : parseInt(v)})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Firma auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    {organizations?.map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.customerNumber} - {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Name *</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Beschreibung</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label>Superprompt *</Label>
              <Textarea 
                value={formData.superprompt} 
                onChange={(e) => setFormData({...formData, superprompt: e.target.value})}
                className="mt-1 font-mono text-sm"
                rows={8}
                placeholder="Superprompt eingeben..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>Abbrechen</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Erstellen..." : "Template erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Universeller Template-Editor */}
      <TemplateEditor
        mode="custom"
        templateId={selectedTemplate?.id}
        open={showFullEditDialog}
        onOpenChange={setShowFullEditDialog}
        onSuccess={() => {
          refetch();
          setShowFullEditDialog(false);
          setSelectedTemplate(null);
        }}
      />
    </div>
  );
}
