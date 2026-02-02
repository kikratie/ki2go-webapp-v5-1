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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Users, 
  FileText, 
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Clock,
  User,
  Building2,
  Mail,
  Edit,
  UserPlus,
  UserMinus,
  Ban,
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  MapPin,
  Briefcase,
  Shield,
  AlertTriangle,
  Download
} from "lucide-react";

interface UserData {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  status?: string;
  organizationId: number | null;
  organizationName: string | null;
  companyName?: string | null;
  position?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  industry?: string | null;
  howFound?: string | null;
  profileCompleted?: number;
  termsAcceptedAt?: Date | string | null;
  privacyAcceptedAt?: Date | string | null;
  executionCount: number;
  documentCount: number;
  totalCost: number;
  lastSignedIn: Date | string;
  createdAt: Date | string;
}

export default function AdminUsers() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editOrgId, setEditOrgId] = useState<string>("");
  const [deleteHard, setDeleteHard] = useState(false);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.user.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter as "active" | "suspended" | "deleted",
  });

  const { data: orgsData } = trpc.audit.getOrganizations.useQuery({
    page: 1,
    limit: 100,
  });

  // Mutations
  const setStatusMutation = trpc.user.setStatus.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setSuspendDialogOpen(false);
      utils.user.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setDeleteDialogOpen(false);
      setEditDialogOpen(false);
      utils.user.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const setRoleMutation = trpc.user.setRole.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      utils.user.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const assignOrgMutation = trpc.user.assignOrganization.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setEditDialogOpen(false);
      utils.user.list.invalidate();
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

  const handleEditUser = (u: UserData) => {
    setSelectedUser(u);
    setEditRole(u.role);
    setEditOrgId(u.organizationId?.toString() || "none");
    setEditDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;

    // Rolle ändern
    if (editRole !== selectedUser.role && editRole !== "owner") {
      setRoleMutation.mutate({
        userId: selectedUser.id,
        role: editRole as "user" | "admin",
      });
    }

    // Organisation ändern
    const newOrgId = editOrgId === "none" ? null : parseInt(editOrgId);
    if (newOrgId !== selectedUser.organizationId) {
      assignOrgMutation.mutate({
        userId: selectedUser.id,
        organizationId: newOrgId,
        role: editRole === "admin" ? "admin" : "member",
      });
    } else {
      setEditDialogOpen(false);
    }
  };

  const handleSuspendUser = () => {
    if (!selectedUser) return;
    const newStatus = selectedUser.status === "suspended" ? "active" : "suspended";
    setStatusMutation.mutate({
      userId: selectedUser.id,
      status: newStatus,
      reason: newStatus === "suspended" ? "Manuell gesperrt durch Admin" : undefined,
    });
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    deleteMutation.mutate({
      userId: selectedUser.id,
      hardDelete: deleteHard,
      reason: "Gelöscht durch Admin",
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-purple-500">Owner</Badge>;
      case "admin":
        return <Badge className="bg-blue-500">Admin</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "suspended":
        return <Badge variant="destructive" className="flex items-center gap-1"><Ban className="h-3 w-3" /> Gesperrt</Badge>;
      case "deleted":
        return <Badge variant="outline" className="text-gray-400 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Gelöscht</Badge>;
      default:
        return <Badge className="bg-green-500 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Aktiv</Badge>;
    }
  };

  const formatLastSeen = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Gerade aktiv";
    if (hours < 24) return `Vor ${hours}h`;
    if (days < 7) return `Vor ${days}d`;
    return d.toLocaleDateString("de-DE");
  };

  const exportUsersCSV = () => {
    if (!data?.users) return;
    
    const headers = ["ID", "Name", "E-Mail", "Firma", "Rolle", "Status", "Organisation", "Aufgaben", "Kosten", "Registriert"];
    const rows = data.users.map(u => [
      u.id,
      u.name || "",
      u.email || "",
      (u as UserData).companyName || "",
      u.role,
      (u as UserData).status || "active",
      u.organizationName || "",
      u.executionCount,
      u.totalCost.toFixed(4),
      new Date(u.createdAt).toLocaleDateString("de-DE")
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ki2go_users_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A5F]">
              User-Verwaltung
            </h1>
            <p className="text-gray-600 mt-1">
              Alle Benutzer verwalten: Rollen, Status, Löschen
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={exportUsersCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV Export
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gesamt User</p>
                  <p className="text-2xl font-bold text-[#1E3A5F]">
                    {data?.pagination.total || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-[#5FBDCE]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Aktiv</p>
                  <p className="text-2xl font-bold text-green-600">
                    {data?.users.filter(u => (u as UserData).status !== "suspended" && (u as UserData).status !== "deleted").length || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gesperrt</p>
                  <p className="text-2xl font-bold text-red-600">
                    {data?.users.filter(u => (u as UserData).status === "suspended").length || 0}
                  </p>
                </div>
                <Ban className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Mit Organisation</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {data?.users.filter(u => u.organizationName).length || 0}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gesamtkosten</p>
                  <p className="text-2xl font-bold text-orange-600">
                    €{data?.users.reduce((sum, u) => sum + (u.totalCost || 0), 0).toFixed(2) || "0.00"}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="User suchen (Name, E-Mail, Firma)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="suspended">Gesperrt</SelectItem>
              <SelectItem value="deleted">Gelöscht</SelectItem>
            </SelectContent>
          </Select>
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
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead className="text-center">Aufgaben</TableHead>
                    <TableHead className="text-right">Kosten</TableHead>
                    <TableHead>Zuletzt aktiv</TableHead>
                    <TableHead className="text-center">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.users.map((u) => (
                    <TableRow 
                      key={u.id} 
                      className={`cursor-pointer hover:bg-slate-50 ${(u as UserData).status === "deleted" ? "opacity-50" : ""}`}
                      onClick={() => handleEditUser(u as UserData)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            (u as UserData).status === "suspended" ? "bg-red-100" : 
                            (u as UserData).status === "deleted" ? "bg-gray-100" : "bg-[#5FBDCE]/10"
                          }`}>
                            <User className={`h-5 w-5 ${
                              (u as UserData).status === "suspended" ? "text-red-500" : 
                              (u as UserData).status === "deleted" ? "text-gray-400" : "text-[#5FBDCE]"
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-[#1E3A5F]">{u.name || "Unbekannt"}</p>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Mail className="h-3 w-3" />
                              <span>{u.email || "-"}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge((u as UserData).status)}
                      </TableCell>
                      <TableCell>
                        {u.organizationName ? (
                          <div className="flex items-center space-x-1">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>{u.organizationName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(u.role)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span>{u.executionCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        €{(u.totalCost || 0).toFixed(4)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{formatLastSeen(u.lastSignedIn)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditUser(u as UserData);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {u.role !== "owner" && (u as UserData).status !== "deleted" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(u as UserData);
                                setSuspendDialogOpen(true);
                              }}
                              className={(u as UserData).status === "suspended" ? "text-green-600" : "text-orange-600"}
                            >
                              {(u as UserData).status === "suspended" ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Ban className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data?.users || data.users.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Keine User gefunden
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

      {/* User bearbeiten Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-[#5FBDCE]" />
              <span>User-Details</span>
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full">
            <div className="border-b mb-4">
              <TabsList className="flex h-12 items-center gap-0 bg-muted/30 p-1 rounded-lg w-full">
                <TabsTrigger 
                  value="profile" 
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                >
                  Profil
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                >
                  Einstellungen
                </TabsTrigger>
                <TabsTrigger 
                  value="danger" 
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                >
                  Gefahrenzone
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Profil Tab */}
            <TabsContent value="profile" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Name</Label>
                  <p className="font-medium">{selectedUser?.name || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">E-Mail</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {selectedUser?.email || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Firma</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {selectedUser?.companyName || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Position</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    {selectedUser?.position || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Telefon</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {selectedUser?.phone || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Branche</Label>
                  <p className="font-medium">{selectedUser?.industry || "-"}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs text-gray-500">Adresse</Label>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {selectedUser?.address ? (
                      `${selectedUser.address}, ${selectedUser.postalCode || ""} ${selectedUser.city || ""}, ${selectedUser.country || ""}`
                    ) : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Wie gefunden</Label>
                  <p className="font-medium">{selectedUser?.howFound || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Profil vollständig</Label>
                  <p className="font-medium">
                    {selectedUser?.profileCompleted ? (
                      <Badge className="bg-green-500">Ja</Badge>
                    ) : (
                      <Badge variant="outline">Nein</Badge>
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Consent & Registrierung</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">AGB akzeptiert</Label>
                    <p className="font-medium">
                      {selectedUser?.termsAcceptedAt ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {new Date(selectedUser.termsAcceptedAt).toLocaleDateString("de-DE")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <XCircle className="h-4 w-4" />
                          Nein
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Datenschutz akzeptiert</Label>
                    <p className="font-medium">
                      {selectedUser?.privacyAcceptedAt ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {new Date(selectedUser.privacyAcceptedAt).toLocaleDateString("de-DE")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <XCircle className="h-4 w-4" />
                          Nein
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Registriert am</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      }) : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Zuletzt aktiv</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {selectedUser?.lastSignedIn ? formatLastSeen(selectedUser.lastSignedIn) : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Nutzungsstatistiken</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <FileText className="h-5 w-5 mx-auto text-[#5FBDCE] mb-1" />
                    <p className="text-2xl font-bold text-[#1E3A5F]">{selectedUser?.executionCount || 0}</p>
                    <p className="text-xs text-gray-500">Aufgaben</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <FileText className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                    <p className="text-2xl font-bold text-[#1E3A5F]">{selectedUser?.documentCount || 0}</p>
                    <p className="text-xs text-gray-500">Dokumente</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <DollarSign className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                    <p className="text-2xl font-bold text-[#1E3A5F]">€{(selectedUser?.totalCost || 0).toFixed(4)}</p>
                    <p className="text-xs text-gray-500">Kosten</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Einstellungen Tab */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedUser?.status)}
                  {selectedUser?.role !== "owner" && selectedUser?.status !== "deleted" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSuspendDialogOpen(true)}
                      className={selectedUser?.status === "suspended" ? "text-green-600" : "text-orange-600"}
                    >
                      {selectedUser?.status === "suspended" ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Entsperren
                        </>
                      ) : (
                        <>
                          <Ban className="h-4 w-4 mr-1" />
                          Sperren
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Rolle ändern */}
              <div className="space-y-2">
                <Label>Rolle</Label>
                <Select 
                  value={editRole} 
                  onValueChange={setEditRole}
                  disabled={selectedUser?.role === "owner"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rolle wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>User</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Admin</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Admins können ihre Firma verwalten und User einladen
                </p>
              </div>

              {/* Organisation zuweisen */}
              <div className="space-y-2">
                <Label>Organisation</Label>
                <Select value={editOrgId} onValueChange={setEditOrgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Organisation wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center space-x-2">
                        <UserMinus className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">Keine Organisation</span>
                      </div>
                    </SelectItem>
                    {orgsData?.organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4" />
                          <span>{org.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  User ohne Organisation können keine Aufgaben ausführen
                </p>
              </div>
            </TabsContent>

            {/* Gefahrenzone Tab */}
            <TabsContent value="danger" className="space-y-4 mt-4">
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h4 className="font-medium text-red-700 flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5" />
                  Gefahrenzone
                </h4>
                
                {selectedUser?.role === "owner" ? (
                  <p className="text-sm text-gray-600">
                    Der Owner-Account kann nicht gelöscht werden.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-sm mb-1">User löschen</h5>
                      <p className="text-xs text-gray-600 mb-3">
                        Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten werden anonymisiert oder gelöscht.
                      </p>
                      <Button
                        variant="destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                        disabled={selectedUser?.status === "deleted"}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        User löschen
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Schließen
            </Button>
            <Button 
              className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
              onClick={handleSaveUser}
              disabled={setRoleMutation.isPending || assignOrgMutation.isPending}
            >
              {(setRoleMutation.isPending || assignOrgMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Änderungen speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sperren/Entsperren Dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {selectedUser?.status === "suspended" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  User entsperren?
                </>
              ) : (
                <>
                  <Ban className="h-5 w-5 text-orange-500" />
                  User sperren?
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.status === "suspended" ? (
                <>
                  <strong>{selectedUser?.name || selectedUser?.email}</strong> wird wieder Zugriff auf die Plattform erhalten.
                </>
              ) : (
                <>
                  <strong>{selectedUser?.name || selectedUser?.email}</strong> wird keinen Zugriff mehr auf die Plattform haben, bis der Account entsperrt wird.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendUser}
              className={selectedUser?.status === "suspended" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
            >
              {setStatusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {selectedUser?.status === "suspended" ? "Entsperren" : "Sperren"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Löschen Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              User endgültig löschen?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Sie sind dabei, <strong>{selectedUser?.name || selectedUser?.email}</strong> zu löschen.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="hardDelete"
                    checked={deleteHard}
                    onChange={(e) => setDeleteHard(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="hardDelete" className="text-sm">
                    <strong>DSGVO-konforme Löschung:</strong> Alle personenbezogenen Daten werden unwiderruflich gelöscht. 
                    Workflow-Statistiken bleiben anonymisiert erhalten.
                  </label>
                </div>
              </div>
              {!deleteHard && (
                <p className="text-sm text-gray-500">
                  Ohne diese Option wird der User nur anonymisiert und als "gelöscht" markiert.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
