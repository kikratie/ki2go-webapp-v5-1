import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import KundenraumHeader from "@/components/KundenraumHeader";
import DiscoverTemplates from "@/components/DiscoverTemplates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  Search, 
  FolderPlus, 
  Folder, 
  FileText, 
  Play, 
  Users, 
  BarChart3, 
  Clock, 
  Tag,
  Plus,
  X,
  ChevronRight,
  Sparkles,
  Lock,
  Crown,
  Loader2,
  MessageSquarePlus,
  Pause,
  PlayCircle,
  Archive,
  AlertCircle
} from "lucide-react";

// Icon-Komponente basierend auf String
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const icons: Record<string, any> = {
    FileText, Folder, Users, BarChart3, Clock, Tag, Sparkles
  };
  const IconComponent = icons[name] || FileText;
  return <IconComponent className={className} />;
};

export default function MeineTemplates() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6");
  const [assignCategoryDialogOpen, setAssignCategoryDialogOpen] = useState(false);
  const [selectedTemplateForCategory, setSelectedTemplateForCategory] = useState<number | null>(null);
  const [assignMemberDialogOpen, setAssignMemberDialogOpen] = useState(false);
  const [selectedTemplateForMember, setSelectedTemplateForMember] = useState<number | null>(null);
  
  // Änderungsanfrage State
  const [changeRequestDialogOpen, setChangeRequestDialogOpen] = useState(false);
  const [selectedTemplateForChangeRequest, setSelectedTemplateForChangeRequest] = useState<{id: number; name: string; uniqueId: string} | null>(null);
  const [changeRequestTitle, setChangeRequestTitle] = useState("");
  const [changeRequestDescription, setChangeRequestDescription] = useState("");
  const [changeRequestPriority, setChangeRequestPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [myRequestsDialogOpen, setMyRequestsDialogOpen] = useState(false);

  // Daten laden
  const { data: templatesData, isLoading: templatesLoading, refetch: refetchTemplates } = trpc.myTemplates.getAll.useQuery({
    categoryId: selectedCategoryId || undefined,
    search: searchQuery || undefined,
  });

  const { data: categories, refetch: refetchCategories } = trpc.myTemplates.getCategories.useQuery();
  const { data: planInfo } = trpc.myTemplates.getPlanInfo.useQuery();
  const { data: availableMembers } = trpc.myTemplates.getAvailableMembers.useQuery();

  // Mutations
  const createCategoryMutation = trpc.myTemplates.createCategory.useMutation({
    onSuccess: () => {
      toast({ title: "Kategorie erstellt", description: "Die neue Kategorie wurde erfolgreich erstellt." });
      setNewCategoryDialogOpen(false);
      setNewCategoryName("");
      setNewCategoryDescription("");
      refetchCategories();
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const assignToCategoryMutation = trpc.myTemplates.assignToCategory.useMutation({
    onSuccess: () => {
      toast({ title: "Zugeordnet", description: "Template wurde der Kategorie zugeordnet." });
      setAssignCategoryDialogOpen(false);
      refetchTemplates();
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const removeFromCategoryMutation = trpc.myTemplates.removeFromCategory.useMutation({
    onSuccess: () => {
      toast({ title: "Entfernt", description: "Template wurde aus der Kategorie entfernt." });
      refetchTemplates();
    },
  });

  const assignToMemberMutation = trpc.myTemplates.assignToMember.useMutation({
    onSuccess: () => {
      toast({ title: "Freigegeben", description: "Template wurde dem Mitarbeiter freigegeben." });
      setAssignMemberDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Änderungsanfrage Mutation und Query
  const submitChangeRequestMutation = trpc.customSuperprompt.submitChangeRequest.useMutation({
    onSuccess: () => {
      toast({ 
        title: "Änderungsanfrage gesendet", 
        description: "Ihre Anfrage wurde erfolgreich eingereicht. Wir werden sie schnellstmöglich bearbeiten." 
      });
      setChangeRequestDialogOpen(false);
      setChangeRequestTitle("");
      setChangeRequestDescription("");
      setChangeRequestPriority("normal");
      refetchTemplates();
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const { data: myChangeRequests, refetch: refetchMyRequests } = trpc.customSuperprompt.getMyChangeRequests.useQuery(undefined, {
    enabled: myRequestsDialogOpen,
  });

  const handleSubmitChangeRequest = () => {
    if (!selectedTemplateForChangeRequest || !changeRequestTitle.trim() || !changeRequestDescription.trim()) {
      toast({ title: "Fehler", description: "Bitte füllen Sie Titel und Beschreibung aus.", variant: "destructive" });
      return;
    }
    submitChangeRequestMutation.mutate({
      customTemplateId: selectedTemplateForChangeRequest.id,
      title: changeRequestTitle,
      description: changeRequestDescription,
      priority: changeRequestPriority,
    });
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie einen Namen ein.", variant: "destructive" });
      return;
    }
    createCategoryMutation.mutate({
      name: newCategoryName,
      description: newCategoryDescription || undefined,
      color: newCategoryColor,
    });
  };

  const templates = templatesData?.templates || [];
  const canShareTemplates = planInfo?.plan?.features.includes("template_sharing");

  // Farb-Optionen für Kategorien
  const colorOptions = [
    { value: "#3B82F6", label: "Blau" },
    { value: "#10B981", label: "Grün" },
    { value: "#F59E0B", label: "Orange" },
    { value: "#EF4444", label: "Rot" },
    { value: "#8B5CF6", label: "Lila" },
    { value: "#EC4899", label: "Pink" },
    { value: "#6B7280", label: "Grau" },
  ];

  return (
    <DashboardLayout>
      {/* Kundenraum-Header mit Firmenbranding */}
      <KundenraumHeader />
      
      <div className="space-y-6">
        {/* Seiten-Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Meine Templates</h1>
            <p className="text-muted-foreground">
              Ihre freigeschalteten Aufgaben-Templates verwalten und organisieren
            </p>
          </div>
        </div>

        {/* Statistik-Karten */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meine Templates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-xs text-muted-foreground">Freigeschaltete Aufgaben</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kategorien</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Eigene Ordner</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nutzungen</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{planInfo?.usage?.tasksUsed || 0}</div>
              <p className="text-xs text-muted-foreground">Diesen Monat</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verbleibend</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {planInfo?.limits.tasks.limit === 0 ? "∞" : planInfo?.limits.tasks.remaining || 0}
              </div>
              <p className="text-xs text-muted-foreground">Aufgaben übrig</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-6">
          {/* Sidebar mit Kategorien */}
          <div className="w-64 shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Kategorien</h3>
              <Dialog open={newCategoryDialogOpen} onOpenChange={setNewCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neue Kategorie erstellen</DialogTitle>
                    <DialogDescription>
                      Erstellen Sie eine neue Kategorie um Ihre Templates zu organisieren.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="z.B. Verträge, HR, Marketing..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Beschreibung (optional)</Label>
                      <Textarea
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        placeholder="Kurze Beschreibung der Kategorie..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Farbe</Label>
                      <Select value={newCategoryColor} onValueChange={setNewCategoryColor}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="h-4 w-4 rounded-full" 
                                  style={{ backgroundColor: color.value }}
                                />
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewCategoryDialogOpen(false)}>
                      Abbrechen
                    </Button>
                    <Button onClick={handleCreateCategory} disabled={createCategoryMutation.isPending}>
                      {createCategoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Erstellen
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-1">
              <Button
                variant={selectedCategoryId === null ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedCategoryId(null)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Alle Templates
                <Badge variant="outline" className="ml-auto">
                  {templatesData?.total || 0}
                </Badge>
              </Button>

              {categories?.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <Folder 
                    className="mr-2 h-4 w-4" 
                    style={{ color: category.color || "#3B82F6" }}
                  />
                  <span className="truncate">{category.name}</span>
                </Button>
              ))}
            </div>

            {/* Upgrade-Hinweis */}
            {!canShareTemplates && (
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-600" />
                    Business Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">
                    Mit dem Business Plan können Sie Templates an Mitarbeiter freigeben.
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Upgrade
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Hauptbereich mit Templates */}
          <div className="flex-1 space-y-4">
            {/* Suche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Templates durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Template-Liste */}
            {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine Templates gefunden</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery 
                      ? "Keine Templates entsprechen Ihrer Suche."
                      : "Sie haben noch keine Templates. Nutzen Sie eine Aufgabe, um Ihr erstes Template zu erhalten."}
                  </p>
                  <Link href="/aufgaben">
                    <Button>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Aufgaben entdecken
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id} className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <DynamicIcon name={template.baseTemplateIcon} className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                            <CardDescription className="text-xs font-mono">
                              {template.uniqueId || template.baseTemplateUniqueId}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-xs">
                            V{template.version}
                          </Badge>
                          {template.status && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                template.status === 'active' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                template.status === 'paused' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                                template.status === 'change_requested' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                'bg-gray-500/10 text-gray-600 border-gray-500/20'
                              }`}
                            >
                              {template.status === 'active' ? 'Aktiv' :
                               template.status === 'paused' ? 'Pausiert' :
                               template.status === 'change_requested' ? 'Änderung angefragt' :
                               template.status === 'archived' ? 'Archiviert' : template.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {template.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      )}

                      {/* Kategorien */}
                      {template.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.categories.map((cat) => (
                            <Badge 
                              key={cat.id} 
                              variant="secondary" 
                              className="text-xs cursor-pointer hover:opacity-80"
                              style={{ backgroundColor: `${cat.color || '#3B82F6'}20`, color: cat.color || '#3B82F6' }}
                              onClick={() => removeFromCategoryMutation.mutate({
                                templateId: template.id,
                                categoryId: cat.id,
                              })}
                            >
                              {cat.name}
                              <X className="ml-1 h-3 w-3" />
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Statistiken */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {template.usageCount}x genutzt
                        </span>
                        {template.lastUsedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(template.lastUsedAt).toLocaleDateString("de-DE")}
                          </span>
                        )}
                      </div>

                      {/* Aktionen */}
                      <div className="flex gap-2 pt-2">
                        <Link href={`/aufgabe/${template.baseTemplateSlug || template.baseTemplateId}`} className="flex-1">
                          <Button size="sm" className="w-full">
                            <Play className="mr-2 h-4 w-4" />
                            Ausführen
                          </Button>
                        </Link>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTemplateForCategory(template.id);
                            setAssignCategoryDialogOpen(true);
                          }}
                        >
                          <Tag className="h-4 w-4" />
                        </Button>

                        {canShareTemplates && template.canManage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTemplateForMember(template.id);
                              setAssignMemberDialogOpen(true);
                            }}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Änderungsanfrage Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTemplateForChangeRequest({
                              id: template.id,
                              name: template.name,
                              uniqueId: template.uniqueId || `CT-${template.id}`
                            });
                            setChangeRequestDialogOpen(true);
                          }}
                          title="Änderung anfragen"
                        >
                          <MessageSquarePlus className="h-4 w-4" />
                        </Button>

                        {!canShareTemplates && (
                          <Button size="sm" variant="outline" disabled>
                            <Lock className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Neue Aufgaben entdecken */}
        <div className="mt-8 pt-6 border-t">
          <DiscoverTemplates limit={6} />
        </div>
      </div>

      {/* Dialog: Template einer Kategorie zuordnen */}
      <Dialog open={assignCategoryDialogOpen} onOpenChange={setAssignCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategorie zuordnen</DialogTitle>
            <DialogDescription>
              Wählen Sie eine Kategorie für dieses Template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {categories?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Sie haben noch keine Kategorien. Erstellen Sie zuerst eine Kategorie.
              </p>
            ) : (
              categories?.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    if (selectedTemplateForCategory) {
                      assignToCategoryMutation.mutate({
                        templateId: selectedTemplateForCategory,
                        categoryId: category.id,
                      });
                    }
                  }}
                >
                  <Folder 
                    className="mr-2 h-4 w-4" 
                    style={{ color: category.color || "#3B82F6" }}
                  />
                  {category.name}
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Template einem Mitarbeiter zuweisen */}
      <Dialog open={assignMemberDialogOpen} onOpenChange={setAssignMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitarbeiter freigeben</DialogTitle>
            <DialogDescription>
              Wählen Sie einen Mitarbeiter, der dieses Template nutzen darf.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {!availableMembers || availableMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Keine Mitarbeiter in Ihrer Organisation gefunden.
              </p>
            ) : (
              availableMembers.map((member) => (
                <Button
                  key={member.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    if (selectedTemplateForMember) {
                      assignToMemberMutation.mutate({
                        templateId: selectedTemplateForMember,
                        memberId: member.id,
                      });
                    }
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div>{member.name || "Unbenannt"}</div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Änderungsanfrage stellen */}
      <Dialog open={changeRequestDialogOpen} onOpenChange={setChangeRequestDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Änderung anfragen</DialogTitle>
            <DialogDescription>
              Beschreiben Sie die gewünschte Änderung für das Template "{selectedTemplateForChangeRequest?.name}" ({selectedTemplateForChangeRequest?.uniqueId}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="change-title">Titel der Änderung *</Label>
              <Input
                id="change-title"
                placeholder="z.B. Formatierung anpassen, Neue Variable hinzufügen..."
                value={changeRequestTitle}
                onChange={(e) => setChangeRequestTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-description">Beschreibung *</Label>
              <Textarea
                id="change-description"
                placeholder="Beschreiben Sie detailliert, was geändert werden soll und warum..."
                value={changeRequestDescription}
                onChange={(e) => setChangeRequestDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-priority">Priorität</Label>
              <Select value={changeRequestPriority} onValueChange={(v) => setChangeRequestPriority(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig - Kann warten</SelectItem>
                  <SelectItem value="normal">Normal - Zeitnah</SelectItem>
                  <SelectItem value="high">Hoch - Wichtig</SelectItem>
                  <SelectItem value="urgent">Dringend - Sofort</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRequestDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSubmitChangeRequest}
              disabled={submitChangeRequestMutation.isPending}
            >
              {submitChangeRequestMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Senden...</>
              ) : (
                <><MessageSquarePlus className="mr-2 h-4 w-4" /> Anfrage senden</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Meine Änderungsanfragen */}
      <Dialog open={myRequestsDialogOpen} onOpenChange={setMyRequestsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Meine Änderungsanfragen</DialogTitle>
            <DialogDescription>
              Übersicht aller Ihrer eingereichten Änderungsanfragen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
            {!myChangeRequests || myChangeRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Sie haben noch keine Änderungsanfragen gestellt.
              </p>
            ) : (
              myChangeRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{request.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={
                          request.status === "open" ? "secondary" :
                          request.status === "in_progress" || request.status === "in_review" ? "default" :
                          request.status === "implemented" ? "default" :
                          "destructive"
                        } className={
                          request.status === "implemented" ? "bg-green-500" : ""
                        }>
                          {request.status === "open" ? "Offen" :
                           request.status === "in_progress" ? "In Bearbeitung" :
                           request.status === "in_review" ? "In Prüfung" :
                           request.status === "implemented" ? "Umgesetzt" :
                           request.status === "closed" ? "Geschlossen" :
                           "Abgelehnt"}
                        </Badge>
                        <Badge variant="outline">
                          {request.priority === "low" ? "Niedrig" :
                           request.priority === "normal" ? "Normal" :
                           request.priority === "high" ? "Hoch" :
                           "Dringend"}
                        </Badge>
                      </div>
                      {request.completedAt && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Abgeschlossen am: {new Date(request.completedAt).toLocaleDateString("de-DE")}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
