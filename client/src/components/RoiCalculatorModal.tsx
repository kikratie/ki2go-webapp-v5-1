import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Calculator, 
  Clock, 
  Euro, 
  TrendingUp, 
  ExternalLink,
  Info,
  FileText,
  AlertTriangle,
  Download,
  Printer
} from "lucide-react";
import { toast } from "sonner";

interface RoiSource {
  name: string;
  url: string;
  finding: string;
}

interface RoiCalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Vorausgefüllte Werte aus dem Template
  defaultValues: {
    hourlyRate: number;
    tasksPerMonth: number;
    documentsPerTask: number;
    manualBaseTime: number;
    timePerDocument: number;
    ki2goBaseTime: number;
    ki2goTimePerDocument: number;
  };
  // Quellenangaben
  sources?: RoiSource[];
  // Template-Name für Kontext
  templateName?: string;
}

export function RoiCalculatorModal({
  open,
  onOpenChange,
  defaultValues,
  sources = [],
  templateName = "diese Aufgabe",
}: RoiCalculatorModalProps) {
  // Bearbeitbare Werte
  const [hourlyRate, setHourlyRate] = useState(defaultValues.hourlyRate);
  const [tasksPerMonth, setTasksPerMonth] = useState(defaultValues.tasksPerMonth);
  const [documentsPerTask, setDocumentsPerTask] = useState(defaultValues.documentsPerTask);
  const [manualBaseTime, setManualBaseTime] = useState(defaultValues.manualBaseTime);
  const [timePerDocument, setTimePerDocument] = useState(defaultValues.timePerDocument);
  const [ki2goBaseTime, setKi2goBaseTime] = useState(defaultValues.ki2goBaseTime);
  const [ki2goTimePerDocument, setKi2goTimePerDocument] = useState(defaultValues.ki2goTimePerDocument);

  // Berechnungen
  const calculations = useMemo(() => {
    // Manuelle Zeit pro Aufgabe
    const manualTimePerTask = manualBaseTime + (timePerDocument * documentsPerTask);
    
    // KI2GO Zeit pro Aufgabe
    const ki2goTimePerTask = ki2goBaseTime + (ki2goTimePerDocument * Math.max(0, documentsPerTask - 1));
    
    // Zeitersparnis pro Aufgabe (Minuten)
    const savedTimePerTask = manualTimePerTask - ki2goTimePerTask;
    
    // Geldersparnis pro Aufgabe
    const savedMoneyPerTask = (savedTimePerTask / 60) * hourlyRate;
    
    // Monatliche Ersparnis
    const savedTimePerMonth = savedTimePerTask * tasksPerMonth;
    const savedMoneyPerMonth = savedMoneyPerTask * tasksPerMonth;
    
    // Jährliche Ersparnis
    const savedTimePerYear = savedTimePerMonth * 12;
    const savedMoneyPerYear = savedMoneyPerMonth * 12;
    
    // Prozentuale Zeitersparnis
    const percentageSaved = manualTimePerTask > 0 
      ? Math.round((savedTimePerTask / manualTimePerTask) * 100) 
      : 0;

    return {
      manualTimePerTask,
      ki2goTimePerTask,
      savedTimePerTask,
      savedMoneyPerTask,
      savedTimePerMonth,
      savedMoneyPerMonth,
      savedTimePerYear,
      savedMoneyPerYear,
      percentageSaved,
    };
  }, [hourlyRate, tasksPerMonth, documentsPerTask, manualBaseTime, timePerDocument, ki2goBaseTime, ki2goTimePerDocument]);

  // Reset auf Standardwerte
  const handleReset = () => {
    setHourlyRate(defaultValues.hourlyRate);
    setTasksPerMonth(defaultValues.tasksPerMonth);
    setDocumentsPerTask(defaultValues.documentsPerTask);
    setManualBaseTime(defaultValues.manualBaseTime);
    setTimePerDocument(defaultValues.timePerDocument);
    setKi2goBaseTime(defaultValues.ki2goBaseTime);
    setKi2goTimePerDocument(defaultValues.ki2goTimePerDocument);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calculator className="h-6 w-6 text-primary" />
            Ihr individueller ROI-Rechner
          </DialogTitle>
          <DialogDescription>
            Berechnen Sie Ihre persönliche Zeitersparnis und den finanziellen Nutzen für {templateName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Eingabebereich */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Linke Spalte: Ihre Werte */}
            <div className="space-y-5 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <h3 className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Ihre Werte
              </h3>
              
              {/* Stundensatz */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Stundensatz für Berechnung</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  Interner Stundensatz, externer Dienstleister (z.B. Anwalt) oder Mischkalkulation
                </p>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[hourlyRate]}
                    onValueChange={(v) => setHourlyRate(v[0])}
                    min={20}
                    max={200}
                    step={5}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1 min-w-[80px]">
                    <Input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                      className="w-20 h-8 text-right"
                    />
                    <span className="text-sm text-muted-foreground">€</span>
                  </div>
                </div>
              </div>

              {/* Aufgaben pro Monat */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Aufgaben pro Monat</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[tasksPerMonth]}
                    onValueChange={(v) => setTasksPerMonth(v[0])}
                    min={1}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={tasksPerMonth}
                    onChange={(e) => setTasksPerMonth(Number(e.target.value) || 1)}
                    className="w-20 h-8 text-right"
                  />
                </div>
              </div>

              {/* Dokumente pro Aufgabe */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Dokumente pro Aufgabe</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[documentsPerTask]}
                    onValueChange={(v) => setDocumentsPerTask(v[0])}
                    min={1}
                    max={20}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={documentsPerTask}
                    onChange={(e) => setDocumentsPerTask(Number(e.target.value) || 1)}
                    className="w-20 h-8 text-right"
                  />
                </div>
              </div>
            </div>

            {/* Rechte Spalte: Zeitaufwand */}
            <div className="space-y-5 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Zeitaufwand (Minuten)
              </h3>
              
              {/* Manuelle Basiszeit */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Manuelle Basiszeit (ohne Dokumente)</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[manualBaseTime]}
                    onValueChange={(v) => setManualBaseTime(v[0])}
                    min={5}
                    max={120}
                    step={5}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1 min-w-[80px]">
                    <Input
                      type="number"
                      value={manualBaseTime}
                      onChange={(e) => setManualBaseTime(Number(e.target.value) || 5)}
                      className="w-20 h-8 text-right"
                    />
                    <span className="text-sm text-muted-foreground">Min</span>
                  </div>
                </div>
              </div>

              {/* Zeit pro Dokument (manuell) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Zusätzliche Zeit pro Dokument (manuell)</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[timePerDocument]}
                    onValueChange={(v) => setTimePerDocument(v[0])}
                    min={1}
                    max={60}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1 min-w-[80px]">
                    <Input
                      type="number"
                      value={timePerDocument}
                      onChange={(e) => setTimePerDocument(Number(e.target.value) || 1)}
                      className="w-20 h-8 text-right"
                    />
                    <span className="text-sm text-muted-foreground">Min</span>
                  </div>
                </div>
              </div>

              {/* KI2GO Basiszeit */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">KI2GO Bearbeitungszeit (Basis)</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[ki2goBaseTime]}
                    onValueChange={(v) => setKi2goBaseTime(v[0])}
                    min={1}
                    max={30}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1 min-w-[80px]">
                    <Input
                      type="number"
                      value={ki2goBaseTime}
                      onChange={(e) => setKi2goBaseTime(Number(e.target.value) || 1)}
                      className="w-20 h-8 text-right"
                    />
                    <span className="text-sm text-muted-foreground">Min</span>
                  </div>
                </div>
              </div>

              {/* KI2GO Zeit pro Dokument */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">KI2GO Zeit pro zusätzlichem Dokument</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[ki2goTimePerDocument]}
                    onValueChange={(v) => setKi2goTimePerDocument(v[0])}
                    min={0}
                    max={10}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1 min-w-[80px]">
                    <Input
                      type="number"
                      value={ki2goTimePerDocument}
                      onChange={(e) => setKi2goTimePerDocument(Number(e.target.value) || 0)}
                      className="w-20 h-8 text-right"
                    />
                    <span className="text-sm text-muted-foreground">Min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ergebnisbereich */}
          <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ihre Ersparnis
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Pro Aufgabe */}
              <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {calculations.savedTimePerTask} Min
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Zeitersparnis/Aufgabe</div>
              </div>
              
              <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  €{calculations.savedMoneyPerTask.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Geldersparnis/Aufgabe</div>
              </div>
              
              {/* Pro Monat */}
              <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(calculations.savedTimePerMonth / 60)}h
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Stunden/Monat</div>
              </div>
              
              <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  €{calculations.savedMoneyPerMonth.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Ersparnis/Monat</div>
              </div>
            </div>

            {/* Jahresersparnis Highlight */}
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-center">
                <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">
                  Ihre jährliche Ersparnis
                </div>
                <div className="text-4xl font-bold text-purple-700 dark:text-purple-300">
                  €{calculations.savedMoneyPerYear.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                  {Math.round(calculations.savedTimePerYear / 60)} Stunden Zeitersparnis • {calculations.percentageSaved}% schneller
                </div>
              </div>
            </div>
          </div>

          {/* Quellenangaben */}
          {sources.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Datengrundlage & Quellenangaben
              </h4>
              <div className="space-y-2">
                {sources.map((source, index) => (
                  <div key={index} className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">[{index + 1}]</span>{" "}
                    <span className="font-medium">{source.name}</span>
                    {source.finding && (
                      <span className="text-gray-600 dark:text-gray-400">: "{source.finding}"</span>
                    )}
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 ml-2 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Quelle
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200 space-y-2">
                <p className="font-semibold">Wichtiger Hinweis zur Berechnung:</p>
                <p>
                  Die dargestellten Werte basieren auf Durchschnittswerten und Erfahrungswerten aus vergleichbaren 
                  Anwendungsfällen. Die tatsächliche Zeitersparnis kann je nach Komplexität der Aufgabe, 
                  Dokumentenqualität, individuellen Anforderungen und Ihrer spezifischen Arbeitsweise variieren.
                </p>
                <p>
                  Der angegebene Stundensatz dient als Berechnungsgrundlage für die monetäre Bewertung und 
                  entspricht nicht zwingend Ihren tatsächlichen internen Kosten. Wir empfehlen, die Werte 
                  an Ihre individuellen Gegebenheiten anzupassen.
                </p>
                <p>
                  Diese Berechnung stellt keine Garantie für konkrete Einsparungen dar und dient ausschließlich 
                  als Orientierungshilfe für Ihre Entscheidungsfindung.
                </p>
              </div>
            </div>
          </div>

          {/* Aktionen */}
          <div className="flex justify-between items-center pt-2">
            <Button variant="outline" onClick={handleReset} size="sm">
              Auf Standardwerte zurücksetzen
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  // PDF-Export via Browser-Druckfunktion
                  const printContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>ROI-Berechnung - ${templateName}</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                        h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
                        h2 { color: #374151; margin-top: 30px; }
                        .section { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
                        .result-box { background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #22c55e; }
                        .result-big { font-size: 32px; font-weight: bold; color: #16a34a; }
                        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                        td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
                        td:first-child { font-weight: 500; width: 60%; }
                        td:last-child { text-align: right; }
                        .disclaimer { background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 30px; font-size: 12px; border: 1px solid #f59e0b; }
                        .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
                        @media print { body { padding: 20px; } }
                      </style>
                    </head>
                    <body>
                      <h1>📊 ROI-Berechnung: ${templateName}</h1>
                      <p>Erstellt am: ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      
                      <h2>Ihre Eingabewerte</h2>
                      <div class="section">
                        <table>
                          <tr><td>Stundensatz</td><td>€${hourlyRate}</td></tr>
                          <tr><td>Aufgaben pro Monat</td><td>${tasksPerMonth}</td></tr>
                          <tr><td>Dokumente pro Aufgabe</td><td>${documentsPerTask}</td></tr>
                          <tr><td>Manuelle Basiszeit</td><td>${manualBaseTime} Min</td></tr>
                          <tr><td>Zeit pro Dokument (manuell)</td><td>${timePerDocument} Min</td></tr>
                          <tr><td>KI2GO Basiszeit</td><td>${ki2goBaseTime} Min</td></tr>
                          <tr><td>KI2GO Zeit pro zusätzlichem Dokument</td><td>${ki2goTimePerDocument} Min</td></tr>
                        </table>
                      </div>
                      
                      <h2>Berechnete Ersparnis</h2>
                      <div class="result-box">
                        <table>
                          <tr><td>Zeitersparnis pro Aufgabe</td><td><strong>${calculations.savedTimePerTask} Minuten</strong></td></tr>
                          <tr><td>Geldersparnis pro Aufgabe</td><td><strong>€${calculations.savedMoneyPerTask.toFixed(0)}</strong></td></tr>
                          <tr><td>Zeitersparnis pro Monat</td><td><strong>${Math.floor(calculations.savedTimePerMonth / 60)}h ${calculations.savedTimePerMonth % 60}min</strong></td></tr>
                          <tr><td>Geldersparnis pro Monat</td><td><strong>€${calculations.savedMoneyPerMonth.toFixed(0)}</strong></td></tr>
                        </table>
                        <div style="text-align: center; margin-top: 20px;">
                          <p style="margin: 0; color: #16a34a;">Ihre jährliche Ersparnis</p>
                          <p class="result-big">€${calculations.savedMoneyPerYear.toLocaleString('de-DE')}</p>
                          <p style="margin: 0; color: #6b7280;">${Math.floor(calculations.savedTimePerYear / 60)} Stunden Zeitersparnis • ${calculations.percentageSaved}% schneller</p>
                        </div>
                      </div>
                      
                      ${sources && sources.length > 0 ? `
                        <h2>Quellenangaben</h2>
                        <div class="section">
                          <ul>
                            ${sources.map((s, i) => `<li><strong>${s.name}</strong>${s.finding ? `: "${s.finding}"` : ''}</li>`).join('')}
                          </ul>
                        </div>
                      ` : ''}
                      
                      <div class="disclaimer">
                        <strong>⚠️ Wichtiger Hinweis:</strong><br/>
                        Die dargestellten Werte basieren auf Durchschnittswerten und Erfahrungswerten aus vergleichbaren 
                        Anwendungsfällen. Die tatsächliche Zeitersparnis kann je nach Komplexität der Aufgabe, 
                        Dokumentenqualität und individuellen Anforderungen variieren. Diese Berechnung stellt keine 
                        Garantie für konkrete Einsparungen dar.
                      </div>
                      
                      <div class="footer">
                        <p>Erstellt mit KI2GO - Die Ergebnismaschine</p>
                        <p>www.ki2go.at</p>
                      </div>
                    </body>
                    </html>
                  `;
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(printContent);
                    printWindow.document.close();
                    printWindow.onload = () => {
                      setTimeout(() => {
                        printWindow.print();
                      }, 250);
                    };
                    toast.success("PDF-Druckdialog geöffnet - Wählen Sie 'Als PDF speichern'");
                  } else {
                    toast.error("Pop-up wurde blockiert. Bitte erlauben Sie Pop-ups.");
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Als PDF exportieren
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Schließen
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
