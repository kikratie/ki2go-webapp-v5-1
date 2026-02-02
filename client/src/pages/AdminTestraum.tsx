import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Play, Square, Users, FlaskConical, RotateCcw, Plus, Trash2, Edit, UserPlus, Beaker, Settings, History } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

type TestMode = "user" | "firma_admin" | "firma_member";
type Scenario = "normal" | "credits_low" | "credits_empty" | "subscription_expiring" | "subscription_expired" | "account_suspended";

const TEST_MODES = [
  { value: "user", label: "Normaler User", description: "Standard-Benutzer ohne Admin-Rechte" },
  { value: "firma_admin", label: "Firmen-Admin", description: "Administrator einer Firma mit Mitarbeiter-Verwaltung" },
  { value: "firma_member", label: "Firmen-Mitarbeiter", description: "Mitarbeiter einer Firma ohne Admin-Rechte" }
];

const SCENARIOS = [
  { value: "normal", label: "Normal", description: "Alles funktioniert wie erwartet", color: "bg-green-500" },
  { value: "credits_low", label: "Credits niedrig (10%)", description: "Warnung wird angezeigt", color: "bg-yellow-500" },
  { value: "credits_empty", label: "Credits leer", description: "Keine Aufgaben mehr möglich", color: "bg-red-500" },
  { value: "subscription_expiring", label: "Abo läuft ab (7 Tage)", description: "Ablauf-Warnung wird angezeigt", color: "bg-orange-500" },
  { value: "subscription_expired", label: "Abo abgelaufen", description: "Eingeschränkter Zugang", color: "bg-red-600" },
  { value: "account_suspended", label: "Account gesperrt", description: "Kein Zugang möglich", color: "bg-gray-500" }
];

export default function AdminTestraum() {
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<TestMode>("user");
  const [selectedScenario, setSelectedScenario] = useState<Scenario>("normal");
  const [selectedPlanId, setSelectedPlanId] = useState<number | undefined>();
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "member">("member");

  // Queries
  const { data: currentMode, refetch: refetchMode } = trpc.testroom.getCurrentMode.useQuery();
  const { data: testUsers, refetch: refetchUsers } = trpc.testroom.getTestUsers.useQuery();
  const { data: availablePlans } = trpc.testroom.getAvailablePlans.useQuery();
  const { data: sessionHistory } = trpc.testroom.getSessionHistory.useQuery();
  const { data: categories } = trpc.testroom.getCategories.useQuery();
  const { data: businessAreas } = trpc.testroom.getBusinessAreas.useQuery();

  // Mutations
  const enterTestMode = trpc.testroom.enterTestMode.useMutation({
    onMutate: (variables) => {
      console.log("[Testraum] Mutation gestartet mit:", variables);
    },
    onSuccess: (data) => {
      console.log("[Testraum] Mutation erfolgreich:", data);
      toast({ title: "Testraum aktiviert", description: "Du bist jetzt im Test-Modus" });
      refetchMode();
    },
    onError: (error) => {
      console.error("[Testraum] Mutation Fehler:", error);
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  });

  const exitTestMode = trpc.testroom.exitTestMode.useMutation({
    onSuccess: () => {
      toast({ title: "Testraum beendet", description: "Du bist zurück im Owner-Modus" });
      refetchMode();
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  });

  const changeScenario = trpc.testroom.changeScenario.useMutation({
    onSuccess: () => {
      toast({ title: "Szenario geändert" });
      refetchMode();
    }
  });

  const createTestUser = trpc.testroom.createTestUser.useMutation({
    onSuccess: () => {
      toast({ title: "Test-User erstellt" });
      refetchUsers();
      setIsCreateUserOpen(false);
      setNewUserName("");
      setNewUserEmail("");
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  });

  const deleteTestUser = trpc.testroom.deleteTestUser.useMutation({
    onSuccess: () => {
      toast({ title: "Test-User gelöscht" });
      refetchUsers();
    }
  });

  const resetTestData = trpc.testroom.resetTestData.useMutation({
    onSuccess: () => {
      toast({ title: "Test-Daten zurückgesetzt", description: "Alle Test-User und Sessions wurden gelöscht" });
      refetchUsers();
      refetchMode();
    }
  });

  const handleEnterTestMode = () => {
    console.log("[Testraum] Test starten geklickt", { selectedMode, selectedScenario, selectedPlanId });
    enterTestMode.mutate({
      testMode: selectedMode,
      scenario: selectedScenario,
      simulatedPlanId: selectedPlanId
    });
  };

  const handleCreateTestUser = () => {
    if (!newUserName.trim()) {
      toast({ title: "Fehler", description: "Name ist erforderlich", variant: "destructive" });
      return;
    }
    createTestUser.mutate({
      name: newUserName,
      email: newUserEmail || undefined,
      role: newUserRole
    });
  };

  const isInTestMode = currentMode?.isInTestMode;
  const activeSession = currentMode?.session;

  // Debug: Zeige den aktuellen Status
  console.log("[Testraum] Status:", { isInTestMode, currentMode, isPending: enterTestMode.isPending });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FlaskConical className="h-8 w-8 text-purple-600" />
              Testraum
            </h1>
            <p className="text-muted-foreground mt-1">
              Teste alle Funktionen aus User-Perspektive - 1:1 identisch mit echten Kunden
            </p>
          </div>
          {isInTestMode && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-lg px-4 py-2">
              <Beaker className="h-4 w-4 mr-2" />
              Test-Modus aktiv
            </Badge>
          )}
        </div>

        {/* Status Banner */}
        {isInTestMode && activeSession && (
          <Card className="border-purple-300 bg-purple-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <AlertCircle className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Du testest als: <span className="text-purple-700">{TEST_MODES.find(m => m.value === activeSession.testMode)?.label}</span></p>
                    <p className="text-sm text-muted-foreground">
                      Szenario: {SCENARIOS.find(s => s.value === activeSession.simulatedScenario)?.label}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => exitTestMode.mutate()} disabled={exitTestMode.isPending}>
                  <Square className="h-4 w-4 mr-2" />
                  Test beenden
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="start" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="start" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Test starten
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Test-Mitarbeiter
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Szenarien
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Verlauf
            </TabsTrigger>
          </TabsList>

          {/* Tab: Test starten */}
          <TabsContent value="start" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Rollen-Auswahl */}
              <Card>
                <CardHeader>
                  <CardTitle>1. Rolle auswählen</CardTitle>
                  <CardDescription>Als welcher Benutzertyp möchtest du testen?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {TEST_MODES.map((mode) => (
                    <div
                      key={mode.value}
                      onClick={() => setSelectedMode(mode.value as TestMode)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedMode === mode.value
                          ? "border-purple-500 bg-purple-50"
                          : "border-border hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{mode.label}</p>
                          <p className="text-sm text-muted-foreground">{mode.description}</p>
                        </div>
                        {selectedMode === mode.value && (
                          <Badge className="bg-purple-500">Ausgewählt</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Paket-Auswahl */}
              <Card>
                <CardHeader>
                  <CardTitle>2. Paket simulieren</CardTitle>
                  <CardDescription>Welches Abo-Paket soll simuliert werden?</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedPlanId?.toString() || "default"}
                    onValueChange={(v) => setSelectedPlanId(v === "default" ? undefined : parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Standard-Paket verwenden" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Standard-Paket verwenden</SelectItem>
                      {availablePlans?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name} ({plan.userLimit} User, {plan.creditLimit || "∞"} Credits)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="mt-6">
                    <Label className="text-base">Szenario</Label>
                    <p className="text-sm text-muted-foreground mb-3">Simuliere verschiedene Zustände</p>
                    <Select
                      value={selectedScenario}
                      onValueChange={(v) => setSelectedScenario(v as Scenario)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCENARIOS.map((scenario) => (
                          <SelectItem key={scenario.value} value={scenario.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${scenario.color}`} />
                              {scenario.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Start Button */}
            <Card className="border-purple-200">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Bereit zum Testen?</h3>
                    <p className="text-muted-foreground">
                      Du wirst die App genau so erleben wie ein {TEST_MODES.find(m => m.value === selectedMode)?.label}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleEnterTestMode}
                    disabled={enterTestMode.isPending || isInTestMode}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {isInTestMode ? "Test läuft bereits" : "Test starten"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Test-Mitarbeiter */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Test-Mitarbeiter</CardTitle>
                    <CardDescription>
                      Erstelle simulierte Mitarbeiter für deine Test-Firma
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Test-User erstellen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Neuen Test-User erstellen</DialogTitle>
                        <DialogDescription>
                          Dieser User wird deiner Test-Firma hinzugefügt
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Name *</Label>
                          <Input
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="Max Mustermann"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>E-Mail (optional)</Label>
                          <Input
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="max@test-firma.de"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rolle</Label>
                          <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as "admin" | "member")}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Firmen-Admin</SelectItem>
                              <SelectItem value="member">Mitarbeiter</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                          Abbrechen
                        </Button>
                        <Button onClick={handleCreateTestUser} disabled={createTestUser.isPending}>
                          Erstellen
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {testUsers && testUsers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Rolle</TableHead>
                        <TableHead>Kategorie</TableHead>
                        <TableHead>Bereich</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role === "admin" ? "Admin" : "Mitarbeiter"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {categories?.find(c => c.id === user.categoryId)?.name || "-"}
                          </TableCell>
                          <TableCell>
                            {businessAreas?.find(b => b.id === user.businessAreaId)?.name || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteTestUser.mutate({ id: user.id })}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Test-Mitarbeiter erstellt</p>
                    <p className="text-sm">Erstelle Test-User um Team-Funktionen zu testen</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Echte Einladung senden */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Echte Einladung senden
                </CardTitle>
                <CardDescription>
                  Lade eine echte Person ein, um den kompletten Einladungs-Flow zu testen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input placeholder="E-Mail-Adresse eingeben" className="flex-1" />
                  <Button variant="outline">
                    Einladung senden
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Die Person erhält eine echte Einladungs-E-Mail und kann der Test-Firma beitreten
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Szenarien */}
          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SCENARIOS.map((scenario) => (
                <Card
                  key={scenario.value}
                  className={`cursor-pointer transition-all ${
                    activeSession?.simulatedScenario === scenario.value
                      ? "border-purple-500 ring-2 ring-purple-200"
                      : "hover:border-purple-300"
                  }`}
                  onClick={() => {
                    if (isInTestMode) {
                      changeScenario.mutate({ scenario: scenario.value as Scenario });
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${scenario.color}`} />
                      <CardTitle className="text-lg">{scenario.label}</CardTitle>
                    </div>
                    <CardDescription>{scenario.description}</CardDescription>
                  </CardHeader>
                  {activeSession?.simulatedScenario === scenario.value && (
                    <CardContent>
                      <Badge className="bg-purple-500">Aktiv</Badge>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {!isInTestMode && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-4 opacity-50" />
                  <p>Starte zuerst einen Test, um Szenarien zu wechseln</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Verlauf */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Test-Verlauf</CardTitle>
                    <CardDescription>Deine letzten Test-Sessions</CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => resetTestData.mutate()}
                    disabled={resetTestData.isPending}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Alle Test-Daten zurücksetzen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sessionHistory && sessionHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Modus</TableHead>
                        <TableHead>Szenario</TableHead>
                        <TableHead>Dauer</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionHistory.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            {new Date(session.startedAt).toLocaleString("de-DE")}
                          </TableCell>
                          <TableCell>
                            {TEST_MODES.find(m => m.value === session.testMode)?.label}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${SCENARIOS.find(s => s.value === session.simulatedScenario)?.color}`} />
                              {SCENARIOS.find(s => s.value === session.simulatedScenario)?.label}
                            </div>
                          </TableCell>
                          <TableCell>
                            {session.endedAt
                              ? `${Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)} Min.`
                              : "-"
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant={session.isActive ? "default" : "secondary"}>
                              {session.isActive ? "Aktiv" : "Beendet"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Test-Sessions durchgeführt</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
