import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  ArrowLeft,
  Tags,
  GripVertical,
  Check,
  X
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";

// Icon-Auswahl für Kategorien
const availableIcons = [
  "Search", "PenTool", "FileText", "Globe", "Languages", "Scale", 
  "BookOpen", "Calendar", "BarChart", "Calculator", "Briefcase",
  "CheckCircle", "Clock", "Database", "Download", "Edit", "Eye",
  "Filter", "Folder", "Heart", "Home", "Image", "Info", "Key",
  "Layers", "Link", "List", "Lock", "Mail", "Map", "MessageSquare",
  "Mic", "Monitor", "Moon", "MoreHorizontal", "Move", "Music",
  "Package", "Paperclip", "Pause", "Phone", "Play", "Plus",
  "Printer", "RefreshCw", "Save", "Send", "Settings", "Share",
  "Shield", "ShoppingCart", "Sidebar", "Star", "Sun", "Tag",
  "Target", "Terminal", "ThumbsUp", "Trash", "TrendingUp", "Upload",
  "User", "Users", "Video", "Volume", "Wifi", "Zap"
];

// Farben für Kategorien
const availableColors = [
  { name: "Türkis", value: "#5FBDCE" },
  { name: "Orange", value: "#F97316" },
  { name: "Navy", value: "#1E3A5F" },
  { name: "Grün", value: "#10B981" },
  { name: "Lila", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Gelb", value: "#F59E0B" },
  { name: "Rot", value: "#EF4444" },
  { name: "Grau", value: "#6B7280" },
];

interface CategoryFormData {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const defaultFormData: CategoryFormData = {
  slug: "",
  name: "",
  description: "",
  icon: "Tags",
  color: "#5FBDCE",
};

export default function AdminCategories() {
  const { user, loading: authLoading } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);

  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.category.list.useQuery({ includeInactive: true });
  
  const createMutation = trpc.category.create.useMutation({
    onSuccess: () => {
      toast.success("Kategorie erfolgreich erstellt");
      utils.category.list.invalidate();
      setIsCreateOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.category.update.useMutation({
    onSuccess: () => {
      toast.success("Kategorie erfolgreich aktualisiert");
      utils.category.list.invalidate();
      setIsEditOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.category.delete.useMutation({
    onSuccess: () => {
      toast.success("Kategorie erfolgreich gelöscht");
      utils.category.list.invalidate();
      setIsDeleteOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Zugriff verweigert</h2>
          <p className="text-muted-foreground">Sie benötigen Admin-Rechte für diesen Bereich.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleCreate = () => {
    if (!formData.slug || !formData.name) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setFormData({
      slug: category.slug,
      name: category.name,
      description: category.description || "",
      icon: category.icon || "Tags",
      color: category.color || "#5FBDCE",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedCategory) return;
    updateMutation.mutate({
      id: selectedCategory.id,
      ...formData,
    });
  };

  const handleDelete = (category: any) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedCategory) return;
    deleteMutation.mutate({ id: selectedCategory.id });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/[ß]/g, 'ss')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const renderIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : <Tags className="h-4 w-4" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-ki2go-navy">Kategorien verwalten</h1>
              <p className="text-muted-foreground mt-1">
                Erstellen und bearbeiten Sie Aufgaben-Kategorien
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-ki2go-turquoise hover:bg-ki2go-turquoise/90">
            <Plus className="h-4 w-4 mr-2" />
            Neue Kategorie
          </Button>
        </div>

        {/* Kategorien-Tabelle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-ki2go-turquoise" />
              Alle Kategorien ({categories?.length || 0})
            </CardTitle>
            <CardDescription>
              Kategorien werden verwendet, um Aufgaben nach Typ zu gruppieren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Farbe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((category, index) => (
                  <TableRow key={category.id} className={category.isActive === 0 ? "opacity-50" : ""}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">{category.slug}</TableCell>
                    <TableCell className="max-w-xs truncate">{category.description || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderIcon(category.icon || "Tags")}
                        <span className="text-xs text-muted-foreground">{category.icon}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border" 
                          style={{ backgroundColor: category.color || "#5FBDCE" }}
                        />
                        <span className="text-xs text-muted-foreground">{category.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {category.isActive === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                          <Check className="h-3 w-3" /> Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs">
                          <X className="h-3 w-3" /> Inaktiv
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(category)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(category)}
                            className="text-destructive"
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
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Neue Kategorie erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie eine neue Kategorie für Aufgaben
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      name: e.target.value,
                      slug: formData.slug || generateSlug(e.target.value)
                    });
                  }}
                  placeholder="z.B. Analysieren & Prüfen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="z.B. analysieren_pruefen"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Nur Kleinbuchstaben, Zahlen und Unterstriche
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kurze Beschreibung der Kategorie"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {availableIcons.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Farbe</Label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {availableColors.map((color) => (
                      <option key={color.value} value={color.value}>{color.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${formData.color}20`, color: formData.color }}
                >
                  {renderIcon(formData.icon)}
                </div>
                <div>
                  <p className="font-medium">{formData.name || "Vorschau"}</p>
                  <p className="text-xs text-muted-foreground">{formData.slug || "slug"}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={createMutation.isPending}
                className="bg-ki2go-turquoise hover:bg-ki2go-turquoise/90"
              >
                {createMutation.isPending ? "Erstelle..." : "Erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Kategorie bearbeiten</DialogTitle>
              <DialogDescription>
                Bearbeiten Sie die Kategorie "{selectedCategory?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slug">Slug *</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Beschreibung</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {availableIcons.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Farbe</Label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {availableColors.map((color) => (
                      <option key={color.value} value={color.value}>{color.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={updateMutation.isPending}
                className="bg-ki2go-turquoise hover:bg-ki2go-turquoise/90"
              >
                {updateMutation.isPending ? "Speichere..." : "Speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kategorie löschen</DialogTitle>
              <DialogDescription>
                Möchten Sie die Kategorie "{selectedCategory?.name}" wirklich löschen?
                Diese Aktion kann nicht rückgängig gemacht werden.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Lösche..." : "Löschen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
