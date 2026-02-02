import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { categoryRouter } from "./routers/category";
import { businessAreaRouter } from "./routers/businessArea";
import { templateRouter } from "./routers/template";
import { metapromptRouter } from "./routers/metaprompt";
import { organizationRouter } from "./routers/organization";
import { workflowRouter } from "./routers/workflow";
import { taskRequestRouter } from "./routers/taskRequest";
import { documentRouter } from "./routers/document";
import { exportRouter } from "./routers/export";
import { subscriptionRouter } from "./routers/subscription";
import { onboardingRouter } from "./routers/onboarding";
import { auditRouter } from "./routers/audit";
import { customSuperpromptRouter } from "./routers/customSuperprompt";
import { userRouter } from "./routers/user";
import { dashboardRouter } from "./routers/dashboard";
import { documentsRouter } from "./routers/documents";
import { myTemplatesRouter } from "./routers/myTemplates";
import { firmaDashboardRouter } from "./routers/firmaDashboard";
import { ownerDashboardRouter } from "./routers/ownerDashboard";
import { customerManagementRouter } from "./routers/customerManagement";
import { subscriptionPlansRouter } from "./routers/subscriptionPlans";
import { userSubscriptionRouter } from "./routers/userSubscription";
import { testroomRouter } from "./routers/testroom";
import { dataExportRouter } from "./routers/dataExport";

export const appRouter = router({
  // System & Auth
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Kategorien & Unternehmensbereiche (editierbar)
  category: categoryRouter,
  businessArea: businessAreaRouter,

  // Task Templates (Admin-verwaltete Aufgaben)
  template: templateRouter,

  // Metaprompt-Verwaltung & Generator
  metaprompt: metapromptRouter,

  // Organisation & Multi-Tenant
  organization: organizationRouter,

  // Workflow-Ausführung
  workflow: workflowRouter,

  // Individuelle Anfragen
  taskRequest: taskRequestRouter,

  // Dokument-Upload & Verwaltung
  document: documentRouter,

  // Export-Funktionen
  export: exportRouter,

  // Subscription & Abonnements
  subscription: subscriptionRouter,

  // Onboarding & Firmen-Registrierung
  onboarding: onboardingRouter,

  // Audit, Qualitätskontrolle & Kosten-Tracking (Owner)
  audit: auditRouter,

  // Custom Superprompts (User/Firmen-spezifisch)
  customSuperprompt: customSuperpromptRouter,

  // User-Profil & Verwaltung
  user: userRouter,

  // Dashboard-Daten
  dashboard: dashboardRouter,

  // Dokumenten-Manager (Meine Dokumente)
  documents: documentsRouter,

  // Meine Templates (Kunden-Sicht auf Custom Templates)
  myTemplates: myTemplatesRouter,

  // Firmen-Admin Dashboard (Nutzungs-Statistiken pro Mitarbeiter)
  firmaDashboard: firmaDashboardRouter,

  // Owner Dashboard (Manus-Kosten, Kunden-Übersicht)
  ownerDashboard: ownerDashboardRouter,

  // Kunden-Management Dashboard (Owner)
  customerManagement: customerManagementRouter,

  // Subscription-Pakete Verwaltung (Owner)
  subscriptionPlans: subscriptionPlansRouter,
  
  // User Subscription (Mein Abo)
  userSubscription: userSubscriptionRouter,
  
  // Testraum (Owner Test-Sessions)
  testroom: testroomRouter,

  // Daten-Export/Import (Owner)
  dataExport: dataExportRouter,
});

export type AppRouter = typeof appRouter;
