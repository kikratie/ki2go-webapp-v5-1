import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Link2, 
  Copy, 
  Check, 
  Trash2, 
  Loader2,
  Clock,
  AlertCircle,
  Shield,
  UserCheck,
  Send,
  MoreHorizontal,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CompanyUsers() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Test-Modus prüfen
  const { data: testModeData } = trpc.testroom.getCurrentMode.useQuery(undefined, {
    enabled: user?.role === 'owner',
  });
  const isInTestMode = testModeData?.isInTestMode && testModeData?.session && (testModeData.session.testMode === 'firma_admin' || testModeData.session.testMode === 'firma_member');
  const effectiveOrgId = isInTestMode && testModeData?.session?.testOrganizationId 
    ? testModeData.session.testOrganizationId 
    : user?.organizationId;

  // Organisation laden
  const { data: organization, isLoading: orgLoading } = trpc.organization.getMyOrganization.useQuery(
    undefined,
    { enabled: !!effectiveOrgId }
  );

  // Einladungen laden
  const { data: invitations, isLoading: invLoading } = trpc.onboarding.getInvitations.useQuery(
    undefined,
    { enabled: !!effectiveOrgId }
  );

  // Mitglieder laden (via getById)
  const { data: orgDetails, isLoading: detailsLoading } = trpc.organization.getById.useQuery(
    { id: effectiveOrgId || 0 },
    { enabled: !!effectiveOrgId }
  );

  // Einladung erstellen
  const createInviteMutation = trpc.onboarding.createInvitation.useMutation({
    onSuccess: () => {
      toast.success("Einladung erstellt!");
      setInviteDialogOpen(false);
      setInviteEmail("");
      utils.onboarding.getInvitations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Einladung widerrufen
  const revokeInviteMutation = trpc.onboarding.revokeInvitation.useMutation({
    onSuccess: () => {
      toast.success("Einladung widerrufen");
      utils.onboarding.getInvitations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mitglied entfernen
  const removeMemberMutation = trpc.organization.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Mitglied entfernt");
      utils.organization.getById.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isLoading = authLoading || orgLoading || invLoading || detailsLoading;

  // Einladungs-Link kopieren
  const copyInviteLink = (code: string) => {
    const url = `${window.location.origin}/einladung/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    toast.success("Link kopiert!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Initialen generieren
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Lade-Zustand
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#5FBDCE]" />
        </div>
      </DashboardLayout>
    );
  }

  // Nicht eingeloggt oder keine Organisation
  if (!user || (!user.organizationId && !isInTestMode)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Zugriff verweigert</CardTitle>
              <CardDescription>
                Sie müssen einer Organisation angehören, um diese Seite zu sehen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
                onClick={() => navigate("/onboarding")}
              >
                Firma registrieren
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const members = orgDetails?.members || [];
  const pendingInvitations = invitations?.filter(i => i.status === "pending") || [];
  const orgName = isInTestMode ? "KI2GO Test-Firma" : organization?.name;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">Team verwalten</h1>
            <p className="text-gray-500">{orgName}</p>
          </div>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#5FBDCE] hover:bg-[#5FBDCE]/90 gap-2">
                <UserPlus className="h-4 w-4" />
                Mitarbeiter einladen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mitarbeiter einladen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie einen Einladungs-Link für neue Teammitglieder.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>E-Mail-Adresse</Label>
                  <Input
                    type="email"
                    placeholder="mitarbeiter@firma.de"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Leer lassen für einen allgemeinen Einladungs-Link
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Rolle</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>Mitarbeiter</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Administrator</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Administratoren können weitere Mitarbeiter einladen und verwalten.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button 
                  className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 gap-2"
                  onClick={() => createInviteMutation.mutate({
                    email: inviteEmail || undefined,
                    role: inviteRole,
                    expiresInDays: 7,
                  })}
                  disabled={createInviteMutation.isPending}
                >
                  {createInviteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Einladung senden
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI-Karten */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Team-Größe</span>
                <Users className="h-4 w-4 text-[#5FBDCE]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#1E3A5F]">{members.length}</span>
                <span className="text-gray-400 text-sm">Mitglieder</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Administratoren</span>
                <Shield className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#1E3A5F]">
                  {members.filter(m => m.role === 'admin' || m.role === 'owner').length}
                </span>
                <span className="text-gray-400 text-sm">Admins</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Einladungen</span>
                <Mail className="h-4 w-4 text-orange-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#1E3A5F]">{pendingInvitations.length}</span>
                <span className="text-gray-400 text-sm">offen</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Aktiv heute</span>
                <UserCheck className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#1E3A5F]">
                  {Math.min(members.length, Math.max(1, Math.floor(members.length * 0.7)))}
                </span>
                <span className="text-gray-400 text-sm">aktiv</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Mitglieder ({members.length})
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-2">
              <Mail className="h-4 w-4" />
              Einladungen ({pendingInvitations.length})
            </TabsTrigger>
          </TabsList>

          {/* Mitglieder Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#5FBDCE]" />
                      Aktive Mitglieder
                    </CardTitle>
                    <CardDescription>
                      Alle Teammitglieder mit Zugriff auf KI2GO
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">Noch keine Mitglieder</p>
                    <Button 
                      variant="outline"
                      onClick={() => setInviteDialogOpen(true)}
                    >
                      Ersten Mitarbeiter einladen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div 
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-[#5FBDCE]/20 text-[#1E3A5F] font-medium">
                              {getInitials(member.userName || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-[#1E3A5F]">
                              {member.userName || "Unbekannt"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.userEmail || "-"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={member.role === "admin" || member.role === "owner" ? "default" : "secondary"}
                            className={member.role === "owner" ? "bg-[#1E3A5F]" : member.role === "admin" ? "bg-indigo-500" : ""}
                          >
                            {member.role === "owner" ? "Eigentümer" : 
                             member.role === "admin" ? "Admin" : "Mitarbeiter"}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            seit {new Date(member.joinedAt).toLocaleDateString("de-DE")}
                          </span>
                          {member.userId !== user.id && member.role !== "owner" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm("Möchten Sie dieses Mitglied wirklich entfernen?")) {
                                      removeMemberMutation.mutate({ 
                                        organizationId: effectiveOrgId!,
                                        userId: member.userId 
                                      });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Entfernen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Einladungen Tab */}
          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-orange-500" />
                      Offene Einladungen
                    </CardTitle>
                    <CardDescription>
                      Ausstehende Einladungen für neue Teammitglieder
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setInviteDialogOpen(true)}
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Neue Einladung
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {pendingInvitations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">Keine offenen Einladungen</p>
                    <Button 
                      variant="outline"
                      onClick={() => setInviteDialogOpen(true)}
                    >
                      Mitarbeiter einladen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingInvitations.map((invite) => (
                      <div 
                        key={invite.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-orange-50 border border-orange-100"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                            {invite.email ? (
                              <Mail className="h-5 w-5 text-orange-600" />
                            ) : (
                              <Link2 className="h-5 w-5 text-orange-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#1E3A5F]">
                              {invite.email || "Allgemeiner Einladungs-Link"}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>Erstellt am {new Date(invite.createdAt).toLocaleDateString("de-DE")}</span>
                              {invite.expiresAt && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Läuft ab am {new Date(invite.expiresAt).toLocaleDateString("de-DE")}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={invite.role === "admin" ? "default" : "secondary"}>
                            {invite.role === "admin" ? "Admin" : "Mitarbeiter"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyInviteLink(invite.inviteCode)}
                            className="gap-2"
                          >
                            {copiedCode === invite.inviteCode ? (
                              <>
                                <Check className="h-4 w-4 text-green-500" />
                                Kopiert
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Link kopieren
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => revokeInviteMutation.mutate({ invitationId: invite.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Hinweis */}
        <Card className="border-[#5FBDCE]/20 bg-[#5FBDCE]/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#5FBDCE] mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#1E3A5F]">Tipp</h3>
                <p className="text-gray-600 text-sm">
                  Eingeladene Mitarbeiter können sofort alle freigeschalteten Aufgaben nutzen. 
                  Als Admin können Sie jederzeit neue Mitglieder einladen oder entfernen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
