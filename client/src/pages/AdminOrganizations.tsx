import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Building2, 
  Users, 
  FileText, 
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  AlertTriangle,
  Clock,
  Eye,
  Plus,
  Edit,
  CalendarPlus,
  UserPlus
} from "lucide-react";

export default function AdminOrganizations() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  
  // Form states
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgIndustry, setNewOrgIndustry] = useState("");
  const [newOrgDescription, setNewOrgDescription] = useState("");
  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgIndustry, setEditOrgIndustry] = useState("");
  const [extendDays, setExtendDays] = useState(30);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.audit.getOrganizations.useQuery({
    page,
    limit: 20,
    search: search || undefined,
  });

  const createOrgMutation = trpc.audit.createOrganization.useMutation({
    onSuccess: () => {
      toast.success("Firma erfolgreich erstellt");
      setCreateDialogOpen(false);
      setNewOrgName("");
      setNewOrgIndustry("");
      setNewOrgDescription("");
      utils.audit.getOrganizations.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateOrgMutation = trpc.audit.updateOrganization.useMutation({
    onSuccess: () => {
      toast.success("Firma erfolgreich aktualisiert");
      setEditDialogOpen(false);
      utils.audit.getOrganizations.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const extendSubMutation = trpc.audit.extendSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription erfolgreich verlängert");
      setExtendDialogOpen(false);
      utils.audit.getOrganizations.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Nur Owner darf zugreifen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5FBDCE]" />
      </div>
    );
  }

  if (!user || user.role !== "owner") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Zugriff verweigert</CardTitle>
            <CardDescription>
              Diese Seite ist nur für den Owner zugänglich.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
              onClick={() => navigate("/")}
            >
              Zur Startseite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEditOrg = (org: any) => {
    setSelectedOrg(org);
    setEditOrgName(org.name);
    setEditOrgIndustry(org.industry || "");
    setEditDialogOpen(true);
  };

  const handleExtendSub = (org: any) => {
    setSelectedOrg(org);
    setExtendDays(30);
    setExtendDialogOpen(true);
  };

  const handleCreateOrg = () => {
    if (!newOrgName.trim()) {
      toast.error("Bitte geben Sie einen Firmennamen ein");
      return;
    }
    createOrgMutation.mutate({
      name: newOrgName.trim(),
      industry: newOrgIndustry.trim() || undefined,
      trialDays: 90,
    });
  };

  const handleSaveOrg = () => {
    if (!selectedOrg || !editOrgName.trim()) return;
    updateOrgMutation.mutate({
      organizationId: selectedOrg.id,
      name: editOrgName.trim(),
      industry: editOrgIndustry.trim() || undefined,
    });
  };

  const handleExtendSubscription = () => {
    if (!selectedOrg) return;
    extendSubMutation.mutate({
      organizationId: selectedOrg.id,
      days: extendDays,
    });
  };

  const getSubscriptionBadge = (subscription: any) => {
    if (!subscription) {
      return <Badge variant="outline" className="text-gray-500">Kein Abo</Badge>;
    }

    const now = new Date();
    const validUntil = new Date(subscription.validUntil);
    const daysRemaining = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (subscription.status === "expired" || daysRemaining <= 0) {
      return <Badge variant="destructive">Abgelaufen</Badge>;
    }
    if (subscription.status === "trial") {
      if (daysRemaining <= 7) {
        return <Badge className="bg-orange-500">Test ({daysRemaining}d)</Badge>;
      }
      return <Badge className="bg-blue-500">Test ({daysRemaining}d)</Badge>;
    }
    if (subscription.status === "active") {
      return <Badge className="bg-green-500">Aktiv</Badge>;
    }
    return <Badge variant="secondary">{subscription.status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A5F]">
              Firmen-Übersicht
            </h1>
            <p className="text-gray-600 mt-1">
              Alle registrierten Organisationen verwalten
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              className="bg-[#5FBDCE] hover:bg-[#5FBDCE]/90"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Neue Firma
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/admin")}
            >
              Zurück zum Admin
            </Button>
          </div>
        </div>

        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gesamt Firmen</p>
                  <p className="text-2xl font-bold text-[#1E3A5F]">
                    {data?.pagination.total || 0}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-[#5FBDCE]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Aktive Tests</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {data?.organizations.filter(o => o.subscription?.status === "trial").length || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ablaufend (14d)</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {data?.organizations.filter(o => {
                      if (!o.subscription) return false;
                      const days = Math.ceil((new Date(o.subscription.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return days > 0 && days <= 14;
                    }).length || 0}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gesamtkosten</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{data?.organizations.reduce((sum, o) => sum + o.totalCost, 0).toFixed(2) || "0.00"}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suchfeld */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Firma suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabelle */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#5FBDCE]" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma</TableHead>
                    <TableHead>Admins</TableHead>
                    <TableHead className="text-center">Mitglieder</TableHead>
                    <TableHead className="text-center">Aufgaben</TableHead>
                    <TableHead className="text-right">Kosten</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registriert</TableHead>
                    <TableHead className="text-center">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#1E3A5F]/10 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-[#1E3A5F]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#1E3A5F]">{org.name}</p>
                            <p className="text-xs text-gray-500">{org.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {org.admins.slice(0, 2).map((admin, i) => (
                            <p key={i} className="text-sm">
                              {admin.userEmail || admin.userName}
                            </p>
                          ))}
                          {org.admins.length > 2 && (
                            <p className="text-xs text-gray-500">+{org.admins.length - 2} weitere</p>
                          )}
                          {org.admins.length === 0 && (
                            <p className="text-xs text-gray-400">Kein Admin</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{org.memberCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span>{org.executionCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        €{org.totalCost.toFixed(4)}
                      </TableCell>
                      <TableCell>
                        {getSubscriptionBadge(org.subscription)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(org.createdAt).toLocaleDateString("de-DE")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Bearbeiten"
                            onClick={() => handleEditOrg(org)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Subscription verlängern"
                            onClick={() => handleExtendSub(org)}
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="User verwalten"
                            onClick={() => navigate(`/admin/all-users?org=${org.id}`)}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data?.organizations || data.organizations.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Keine Firmen gefunden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Seite {page} von {data.pagination.totalPages} ({data.pagination.total} Einträge)
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Neue Firma erstellen Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-[#5FBDCE]" />
              <span>Neue Firma erstellen</span>
            </DialogTitle>
            <DialogDescription>
              Erstellen Sie eine neue Organisation mit 90-Tage Testphase
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Firmenname *</Label>
              <Input
                id="orgName"
                placeholder="z.B. Musterfirma GmbH"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgIndustry">Branche</Label>
              <Input
                id="orgIndustry"
                placeholder="z.B. IT, Handel, Produktion"
                value={newOrgIndustry}
                onChange={(e) => setNewOrgIndustry(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgDescription">Beschreibung</Label>
              <Textarea
                id="orgDescription"
                placeholder="Optionale Beschreibung der Firma..."
                value={newOrgDescription}
                onChange={(e) => setNewOrgDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Hinweis:</strong> Die Firma erhält automatisch eine 90-Tage Testphase mit 1000 Credits.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
              onClick={handleCreateOrg}
              disabled={createOrgMutation.isPending}
            >
              {createOrgMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Firma erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Firma bearbeiten Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5 text-[#5FBDCE]" />
              <span>Firma bearbeiten</span>
            </DialogTitle>
            <DialogDescription>
              {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editOrgName">Firmenname</Label>
              <Input
                id="editOrgName"
                value={editOrgName}
                onChange={(e) => setEditOrgName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editOrgIndustry">Branche</Label>
              <Input
                id="editOrgIndustry"
                placeholder="z.B. IT, Handel, Produktion"
                value={editOrgIndustry}
                onChange={(e) => setEditOrgIndustry(e.target.value)}
              />
            </div>
            
            {/* Info über die Firma */}
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mitglieder:</span>
                <span className="font-medium">{selectedOrg?.memberCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Aufgaben:</span>
                <span className="font-medium">{selectedOrg?.executionCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Kosten:</span>
                <span className="font-medium">€{selectedOrg?.totalCost?.toFixed(4) || "0.00"}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
              onClick={handleSaveOrg}
              disabled={updateOrgMutation.isPending}
            >
              {updateOrgMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription verlängern Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CalendarPlus className="h-5 w-5 text-[#5FBDCE]" />
              <span>Subscription verlängern</span>
            </DialogTitle>
            <DialogDescription>
              {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Aktueller Status */}
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Aktueller Status:</span>
                {getSubscriptionBadge(selectedOrg?.subscription)}
              </div>
              {selectedOrg?.subscription && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gültig bis:</span>
                  <span className="font-medium">
                    {new Date(selectedOrg.subscription.validUntil).toLocaleDateString("de-DE")}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="extendDays">Verlängern um (Tage)</Label>
              <Input
                id="extendDays"
                type="number"
                min={1}
                max={365}
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 30)}
              />
              <p className="text-xs text-gray-500">
                Neues Ablaufdatum: {selectedOrg?.subscription ? 
                  new Date(new Date(selectedOrg.subscription.validUntil).getTime() + extendDays * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE") :
                  new Date(Date.now() + extendDays * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE")
                }
              </p>
            </div>

            {/* Schnellauswahl */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setExtendDays(30)}>+30 Tage</Button>
              <Button variant="outline" size="sm" onClick={() => setExtendDays(60)}>+60 Tage</Button>
              <Button variant="outline" size="sm" onClick={() => setExtendDays(90)}>+90 Tage</Button>
              <Button variant="outline" size="sm" onClick={() => setExtendDays(180)}>+180 Tage</Button>
              <Button variant="outline" size="sm" onClick={() => setExtendDays(365)}>+1 Jahr</Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
              onClick={handleExtendSubscription}
              disabled={extendSubMutation.isPending}
            >
              {extendSubMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Verlängern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
