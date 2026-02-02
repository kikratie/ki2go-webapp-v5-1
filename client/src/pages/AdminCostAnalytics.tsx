import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign,
  Loader2,
  TrendingUp,
  Building2,
  FileText,
  Coins,
  BarChart3,
  Calendar
} from "lucide-react";

export default function AdminCostAnalytics() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("month");

  const { data, isLoading } = trpc.audit.getCostAnalytics.useQuery({
    period,
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

  const formatCost = (cost: number) => {
    if (cost === 0) return "€0.00";
    if (cost < 0.01) return `€${cost.toFixed(4)}`;
    return `€${cost.toFixed(2)}`;
  };

  const getPeriodLabel = (p: string) => {
    switch (p) {
      case "day": return "Heute";
      case "week": return "Diese Woche";
      case "month": return "Dieser Monat";
      case "year": return "Dieses Jahr";
      default: return p;
    }
  };

  // Max-Werte für Fortschrittsbalken
  const maxOrgCost = Math.max(...(data?.byOrganization.map(o => o.totalCost) || [1]));
  const maxTemplateCost = Math.max(...(data?.byTemplate.map(t => t.totalCost) || [1]));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A5F]">
              Kosten-Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Detaillierte Kostenübersicht nach Zeitraum, Firma und Aufgabe
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Heute</SelectItem>
                <SelectItem value="week">Diese Woche</SelectItem>
                <SelectItem value="month">Dieser Monat</SelectItem>
                <SelectItem value="year">Dieses Jahr</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline"
              onClick={() => navigate("/admin")}
            >
              Zurück zum Admin
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#5FBDCE]" />
          </div>
        ) : (
          <>
            {/* Übersichts-Karten */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-700">Gesamtkosten</p>
                      <p className="text-3xl font-bold text-orange-900">
                        {formatCost(data?.summary.totalCost || 0)}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">{getPeriodLabel(period)}</p>
                    </div>
                    <DollarSign className="h-10 w-10 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700">Ausführungen</p>
                      <p className="text-3xl font-bold text-blue-900">
                        {data?.summary.executionCount || 0}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">{getPeriodLabel(period)}</p>
                    </div>
                    <FileText className="h-10 w-10 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700">Tokens gesamt</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {(data?.summary.totalTokens || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">{getPeriodLabel(period)}</p>
                    </div>
                    <Coins className="h-10 w-10 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">Ø pro Aufgabe</p>
                      <p className="text-3xl font-bold text-green-900">
                        {formatCost(data?.summary.avgCostPerExecution || 0)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Durchschnitt</p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Kosten nach Organisation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-[#5FBDCE]" />
                  <span>Kosten nach Organisation</span>
                </CardTitle>
                <CardDescription>
                  Aufschlüsselung der Kosten pro Firma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data?.byOrganization && data.byOrganization.length > 0 ? (
                  <div className="space-y-4">
                    {data.byOrganization.map((org, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{org.organizationName}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-gray-500">{org.executionCount} Aufgaben</span>
                            <span className="font-bold text-orange-600">{formatCost(org.totalCost)}</span>
                          </div>
                        </div>
                        <Progress 
                          value={(org.totalCost / maxOrgCost) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Keine Daten verfügbar</p>
                )}
              </CardContent>
            </Card>

            {/* Kosten nach Template */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-[#5FBDCE]" />
                  <span>Kosten nach Aufgabe (Top 10)</span>
                </CardTitle>
                <CardDescription>
                  Welche Aufgaben verursachen die meisten Kosten?
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data?.byTemplate && data.byTemplate.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aufgabe</TableHead>
                        <TableHead className="text-center">Ausführungen</TableHead>
                        <TableHead className="text-right">Ø Kosten</TableHead>
                        <TableHead className="text-right">Gesamtkosten</TableHead>
                        <TableHead className="w-[200px]">Anteil</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.byTemplate.map((template, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{template.templateName}</TableCell>
                          <TableCell className="text-center">{template.executionCount}</TableCell>
                          <TableCell className="text-right">{formatCost(template.avgCost)}</TableCell>
                          <TableCell className="text-right font-bold text-orange-600">
                            {formatCost(template.totalCost)}
                          </TableCell>
                          <TableCell>
                            <Progress 
                              value={(template.totalCost / maxTemplateCost) * 100} 
                              className="h-2"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500 py-4">Keine Daten verfügbar</p>
                )}
              </CardContent>
            </Card>

            {/* Kostenhinweis */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <DollarSign className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Kostenberechnung</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Die Kosten werden basierend auf dem Token-Verbrauch berechnet. 
                      Input-Tokens (Prompt) und Output-Tokens (Antwort) werden separat gezählt. 
                      Die tatsächlichen Kosten können je nach verwendetem LLM-Modell variieren.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
