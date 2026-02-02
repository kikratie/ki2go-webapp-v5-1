import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Clock,
  FileText,
  Star,
  ArrowRight,
  Filter,
  LayoutGrid,
  List,
  Sparkles,
} from "lucide-react";
import * as LucideIcons from "lucide-react";

// Dynamisches Icon basierend auf dem Namen
const DynamicIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.FileText;
  return <IconComponent className={className} style={style} />;
};

export default function Tasks() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Lade verfügbare Aufgaben
  const { data: tasks, isLoading: tasksLoading } = trpc.workflow.getAvailableTasks.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Lade Kategorien für Filter
  const { data: categories } = trpc.category.list.useQuery();

  // Filtere Aufgaben
  const filteredTasks = tasks?.filter((task) => {
    const matchesSearch =
      !searchQuery ||
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || task.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (authLoading) {
    return (
      <div className="container py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-16 text-center">
        <Sparkles className="mx-auto h-16 w-16 text-primary/50 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Willkommen bei KI2GO</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Melden Sie sich an, um auf Ihre freigegebenen Aufgaben zuzugreifen und
          KI-gestützte Ergebnisse zu erhalten.
        </p>
        <Button asChild size="lg">
          <a href={`${import.meta.env.VITE_OAUTH_PORTAL_URL}?app_id=${import.meta.env.VITE_APP_ID}`}>
            Anmelden
          </a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Aufgaben" />
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Ihre Aufgaben</h1>
          <p className="text-muted-foreground">
            Wählen Sie eine Aufgabe aus, um ein KI-gestütztes Ergebnis zu erhalten.
          </p>
        </div>

      {/* Filter & Suche */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Aufgabe suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {/* Kategorie-Filter */}
          <select
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Alle Kategorien</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Aufgaben-Liste */}
      {tasksLoading ? (
        <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className={viewMode === "grid" ? "h-48 rounded-xl" : "h-24 rounded-xl"} />
          ))}
        </div>
      ) : filteredTasks?.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
          <h2 className="text-xl font-semibold mb-2">Keine Aufgaben gefunden</h2>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Versuchen Sie eine andere Suche."
              : "Es wurden Ihnen noch keine Aufgaben zugewiesen."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks?.map((task) => (
            <Link key={task.id} href={`/aufgabe/${task.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className="p-2.5 rounded-lg"
                      style={{ backgroundColor: `${task.color}20` }}
                    >
                      <DynamicIcon
                        name={task.icon || "FileText"}
                        className="h-5 w-5"
                        style={{ color: task.color ?? undefined }}
                      />
                    </div>
                    {task.documentRequired === 1 && (
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        Dokument
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
                    {task.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-2 mb-4">
                    {task.shortDescription}
                  </CardDescription>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>~{task.estimatedTimeSavings} Min. gespart</span>
                    </div>
                    {task.avgRating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span>{Number(task.avgRating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks?.map((task) => (
            <Link key={task.id} href={`/aufgabe/${task.slug}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className="p-2.5 rounded-lg shrink-0"
                    style={{ backgroundColor: `${task.color}20` }}
                  >
                    <DynamicIcon
                      name={task.icon || "FileText"}
                      className="h-5 w-5"
                      style={{ color: task.color ?? undefined }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {task.shortDescription}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                    {task.documentRequired === 1 && (
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        Dokument
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>~{task.estimatedTimeSavings} Min.</span>
                    </div>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
