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
  Building2,
  GripVertical,
  Check,
  X
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";

// Icon-Auswahl für Bereiche
const availableIcons = [
  "Building2", "TrendingUp", "Megaphone", "Scale", "Users", "Euro",
  "Target", "HeartHandshake", "Rocket", "Kanban", "Settings",
  "Briefcase", "Calculator", "BarChart", "PieChart", "LineChart",
  "DollarSign", "CreditCard", "Wallet", "Receipt", "FileText",
  "Folder", "Archive", "Database", "Server", "Cloud", "Globe",
  "Mail", "Phone", "MessageSquare", "Video", "Mic", "Headphones",
  "Monitor", "Laptop", "Smartphone", "Tablet", "Printer", "Wifi",
  "Lock", "Shield", "Key", "Eye", "Search", "Filter", "Layers",
  "Grid", "List", "Calendar", "Clock", "Bell", "Flag", "Star",
  "Heart", "ThumbsUp", "Award", "Trophy", "Zap", "Lightbulb"
];

interface BusinessAreaFormData {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

const defaultFormData: BusinessAreaFormData = {
  slug: "",
  name: "",
  description: "",
  icon: "Building2",
};

export default function AdminBusinessAreas() {
  const { user, loading: authLoading } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [formData, setFormData] = useState<BusinessAreaFormData>(defaultFormData);

  const utils = trpc.useUtils();
  const { data: businessAreas, isLoading } = trpc.businessArea.list.useQuery({ includeInactive: true });
  
  const createMutation = trpc.businessArea.create.useMutation({
    onSuccess: () => {
      toast.success("Unternehmensbereich erfolgreich erstellt");
      utils.businessArea.list.invalidate();
      setIsCreateOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.businessArea.update.useMutation({
    onSuccess: () => {
      toast.success("Unternehmensbereich erfolgreich aktualisiert");
      utils.businessArea.list.invalidate();
      setIsEditOpen(false);
      setSelectedArea(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.businessArea.delete.useMutation({
    onSuccess: () => {
      toast.success("Unternehmensbereich erfolgreich gelöscht");
      utils.businessArea.list.invalidate();
      setIsDeleteOpen(false);
      setSelectedArea(null);
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

  const handleEdit = (area: any) => {
    setSelectedArea(area);
    setFormData({
      slug: area.slug,
      name: area.name,
      description: area.description || "",
      icon: area.icon || "Building2",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedArea) return;
    updateMutation.mutate({
      id: selectedArea.id,
      ...formData,
    });
  };

  const handleDelete = (area: any) => {
    setSelectedArea(area);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedArea) return;
    deleteMutation.mutate({ id: selectedArea.id });
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
    return Icon ? <Icon className="h-4 w-4" /> : <Building2 className="h-4 w-4" />;
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
              <h1 className="text-3xl font-bold text-ki2go-navy">Unternehmensbereiche verwalten</h1>
              <p className="text-muted-foreground mt-1">
                Erstellen und bearbeiten Sie Geschäftsbereiche
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-ki2go-orange hover:bg-ki2go-orange/90">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Bereich
          </Button>
        </div>

        {/* Bereiche-Tabelle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-ki2go-orange" />
              Alle Unternehmensbereiche ({businessAreas?.length || 0})
            </CardTitle>
            <CardDescription>
              Bereiche werden verwendet, um Aufgaben nach Geschäftsbereich zu gruppieren
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
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessAreas?.map((area, index) => (
                  <TableRow key={area.id} className={area.isActive === 0 ? "opacity-50" : ""}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">{area.slug}</TableCell>
                    <TableCell className="max-w-xs truncate">{area.description || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-ki2go-orange/10 text-ki2go-orange">
                          {renderIcon(area.icon || "Building2")}
                        </div>
                        <span className="text-xs text-muted-foreground">{area.icon}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {area.isActive === 1 ? (
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
                          <DropdownMenuItem onClick={() => handleEdit(area)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(area)}
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
              <DialogTitle>Neuen Unternehmensbereich erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie einen neuen Geschäftsbereich für Aufgaben
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
                  placeholder="z.B. Sales & Vertrieb"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="z.B. sales_vertrieb"
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
                  placeholder="Kurze Beschreibung des Bereichs"
                  rows={2}
                />
              </div>
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
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-ki2go-orange/10 text-ki2go-orange">
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
                className="bg-ki2go-orange hover:bg-ki2go-orange/90"
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
              <DialogTitle>Unternehmensbereich bearbeiten</DialogTitle>
              <DialogDescription>
                Bearbeiten Sie den Bereich "{selectedArea?.name}"
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={updateMutation.isPending}
                className="bg-ki2go-orange hover:bg-ki2go-orange/90"
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
              <DialogTitle>Unternehmensbereich löschen</DialogTitle>
              <DialogDescription>
                Möchten Sie den Bereich "{selectedArea?.name}" wirklich löschen?
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
