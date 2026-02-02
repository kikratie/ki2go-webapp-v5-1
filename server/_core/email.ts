import { ENV } from "./env";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Sendet eine E-Mail über den Manus Forge API Service
 * Nutzt die gleiche API wie die Notification-Funktion
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  // Für jetzt loggen wir die E-Mail nur - in Produktion würde hier
  // ein echter E-Mail-Service wie SendGrid, Resend oder AWS SES verwendet
  console.log("[Email] Would send email:", {
    to: payload.to,
    subject: payload.subject,
    preview: payload.text?.substring(0, 100) || payload.html.substring(0, 100),
  });
  
  // TODO: Echten E-Mail-Service integrieren wenn verfügbar
  // Für jetzt simulieren wir erfolgreichen Versand
  return true;
}

/**
 * Sendet eine Einladungs-E-Mail an einen neuen Mitarbeiter
 */
export async function sendInvitationEmail(params: {
  to: string;
  inviterName: string;
  organizationName: string;
  inviteToken: string;
}): Promise<boolean> {
  const { to, inviterName, organizationName, inviteToken } = params;
  
  // Basis-URL für die Einladung
  const baseUrl = "https://ki2goapp-qtfyr7bg.manus.space";
  const inviteUrl = `${baseUrl}/invite/accept?token=${inviteToken}`;
  
  const subject = `${inviterName} lädt Sie zu ${organizationName} auf KI2GO ein`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Einladung zu KI2GO</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="${baseUrl}/ki2go-logo.png" alt="KI2GO" style="height: 40px;" onerror="this.style.display='none'">
    <h1 style="color: #0d9488; margin: 10px 0;">KI2GO</h1>
  </div>
  
  <div style="background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%); border-radius: 12px; padding: 30px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #0f766e;">Sie wurden eingeladen!</h2>
    <p><strong>${inviterName}</strong> hat Sie eingeladen, dem Team von <strong>${organizationName}</strong> auf KI2GO beizutreten.</p>
    <p>Mit KI2GO können Sie:</p>
    <ul style="padding-left: 20px;">
      <li>KI-gestützte Analysen in Sekunden erstellen</li>
      <li>Dokumente automatisch verarbeiten</li>
      <li>Bis zu 60 Minuten pro Aufgabe sparen</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Einladung annehmen
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">
    Oder kopieren Sie diesen Link in Ihren Browser:<br>
    <a href="${inviteUrl}" style="color: #0d9488; word-break: break-all;">${inviteUrl}</a>
  </p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    Diese E-Mail wurde von KI2GO gesendet.<br>
    Falls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.
  </p>
</body>
</html>
  `.trim();
  
  const text = `
${inviterName} lädt Sie zu ${organizationName} auf KI2GO ein

Sie wurden eingeladen, dem Team von ${organizationName} auf KI2GO beizutreten.

Mit KI2GO können Sie:
- KI-gestützte Analysen in Sekunden erstellen
- Dokumente automatisch verarbeiten
- Bis zu 60 Minuten pro Aufgabe sparen

Klicken Sie hier um die Einladung anzunehmen:
${inviteUrl}

Falls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.
  `.trim();
  
  return sendEmail({ to, subject, html, text });
}

/**
 * Sendet eine Erinnerungs-E-Mail wenn das Abo bald abläuft
 */
export async function sendSubscriptionExpiryReminder(params: {
  to: string;
  userName: string;
  organizationName: string;
  expiryDate: Date;
  daysRemaining: number;
}): Promise<boolean> {
  const { to, userName, organizationName, expiryDate, daysRemaining } = params;
  
  const baseUrl = "https://ki2goapp-qtfyr7bg.manus.space";
  const upgradeUrl = `${baseUrl}/abo`;
  
  const formattedDate = expiryDate.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  
  const urgencyColor = daysRemaining <= 3 ? "#dc2626" : daysRemaining <= 7 ? "#f59e0b" : "#0d9488";
  
  const subject = daysRemaining <= 3 
    ? `⚠️ Ihr KI2GO Abo läuft in ${daysRemaining} Tagen ab!`
    : `Ihr KI2GO Abo läuft am ${formattedDate} ab`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abo-Erinnerung</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0d9488; margin: 10px 0;">KI2GO</h1>
  </div>
  
  <div style="background: #fff; border: 2px solid ${urgencyColor}; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: ${urgencyColor};">
      ${daysRemaining <= 3 ? "⚠️ " : ""}Ihr Abo läuft bald ab
    </h2>
    <p>Hallo ${userName},</p>
    <p>Ihr KI2GO Abo für <strong>${organizationName}</strong> läuft am <strong>${formattedDate}</strong> ab.</p>
    <p style="font-size: 24px; font-weight: bold; color: ${urgencyColor}; text-align: center; margin: 20px 0;">
      Noch ${daysRemaining} ${daysRemaining === 1 ? "Tag" : "Tage"}
    </p>
    <p>Verlängern Sie jetzt, um weiterhin von allen KI2GO-Funktionen zu profitieren:</p>
    <ul style="padding-left: 20px;">
      <li>Unbegrenzte KI-Analysen</li>
      <li>Team-Zusammenarbeit</li>
      <li>Prioritäts-Support</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${upgradeUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Jetzt verlängern
    </a>
  </div>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    Diese E-Mail wurde von KI2GO gesendet.<br>
    Sie erhalten diese E-Mail, weil Sie ein aktives Abo haben.
  </p>
</body>
</html>
  `.trim();
  
  const text = `
Ihr KI2GO Abo läuft bald ab

Hallo ${userName},

Ihr KI2GO Abo für ${organizationName} läuft am ${formattedDate} ab.
Noch ${daysRemaining} ${daysRemaining === 1 ? "Tag" : "Tage"}.

Verlängern Sie jetzt, um weiterhin von allen KI2GO-Funktionen zu profitieren:
- Unbegrenzte KI-Analysen
- Team-Zusammenarbeit
- Prioritäts-Support

Jetzt verlängern: ${upgradeUrl}
  `.trim();
  
  return sendEmail({ to, subject, html, text });
}

/**
 * Sendet eine Benachrichtigung wenn die Credits fast aufgebraucht sind
 */
export async function sendLowCreditsWarning(params: {
  to: string;
  userName: string;
  creditsRemaining: number;
  creditsTotal: number;
}): Promise<boolean> {
  const { to, userName, creditsRemaining, creditsTotal } = params;
  
  const baseUrl = "https://ki2goapp-qtfyr7bg.manus.space";
  const upgradeUrl = `${baseUrl}/abo`;
  
  const percentRemaining = Math.round((creditsRemaining / creditsTotal) * 100);
  
  const subject = creditsRemaining <= 5 
    ? `⚠️ Nur noch ${creditsRemaining} Credits übrig!`
    : `Ihre KI2GO Credits werden knapp (${percentRemaining}% übrig)`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credits-Warnung</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0d9488; margin: 10px 0;">KI2GO</h1>
  </div>
  
  <div style="background: #fff; border: 2px solid #f59e0b; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #f59e0b;">Credits werden knapp</h2>
    <p>Hallo ${userName},</p>
    <p>Sie haben nur noch <strong>${creditsRemaining} von ${creditsTotal} Credits</strong> übrig.</p>
    
    <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <div style="background: #e5e7eb; border-radius: 4px; height: 20px; overflow: hidden;">
        <div style="background: linear-gradient(90deg, #f59e0b, #ef4444); height: 100%; width: ${percentRemaining}%;"></div>
      </div>
      <p style="text-align: center; margin: 10px 0 0; font-weight: bold; color: #f59e0b;">
        ${percentRemaining}% übrig
      </p>
    </div>
    
    <p>Upgraden Sie jetzt für mehr Credits und zusätzliche Funktionen.</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${upgradeUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Credits aufladen
    </a>
  </div>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    Diese E-Mail wurde von KI2GO gesendet.
  </p>
</body>
</html>
  `.trim();
  
  const text = `
Ihre KI2GO Credits werden knapp

Hallo ${userName},

Sie haben nur noch ${creditsRemaining} von ${creditsTotal} Credits übrig (${percentRemaining}%).

Upgraden Sie jetzt für mehr Credits und zusätzliche Funktionen: ${upgradeUrl}
  `.trim();
  
  return sendEmail({ to, subject, html, text });
}

/**
 * Sendet eine Willkommens-E-Mail nach der Registrierung
 */
export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
}): Promise<boolean> {
  const { to, userName } = params;
  
  const baseUrl = "https://ki2goapp-qtfyr7bg.manus.space";
  
  const subject = "Willkommen bei KI2GO! 🎉";
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Willkommen bei KI2GO</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0d9488; margin: 10px 0;">🎉 Willkommen bei KI2GO!</h1>
  </div>
  
  <div style="background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%); border-radius: 12px; padding: 30px; margin-bottom: 20px;">
    <p style="font-size: 18px;">Hallo ${userName},</p>
    <p>Herzlich willkommen bei KI2GO - Ihrer KI-Plattform für effiziente Geschäftsprozesse!</p>
    <p>Mit Ihrem Account können Sie jetzt:</p>
    <ul style="padding-left: 20px;">
      <li><strong>KI-Analysen erstellen</strong> - Verträge, Bilanzen, CVs und mehr</li>
      <li><strong>Zeit sparen</strong> - Bis zu 60 Minuten pro Aufgabe</li>
      <li><strong>Ergebnisse speichern</strong> - Alle Analysen sicher in der Cloud</li>
    </ul>
  </div>
  
  <h3 style="color: #0f766e;">Erste Schritte:</h3>
  <ol style="padding-left: 20px;">
    <li>Wählen Sie eine Aufgabe aus dem Dashboard</li>
    <li>Laden Sie Ihre Dokumente hoch</li>
    <li>Erhalten Sie sofort KI-gestützte Ergebnisse</li>
  </ol>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${baseUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Zum Dashboard
    </a>
  </div>
  
  <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung!</p>
  <p>Ihr KI2GO Team</p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    Diese E-Mail wurde von KI2GO gesendet.
  </p>
</body>
</html>
  `.trim();
  
  const text = `
Willkommen bei KI2GO!

Hallo ${userName},

Herzlich willkommen bei KI2GO - Ihrer KI-Plattform für effiziente Geschäftsprozesse!

Mit Ihrem Account können Sie jetzt:
- KI-Analysen erstellen - Verträge, Bilanzen, CVs und mehr
- Zeit sparen - Bis zu 60 Minuten pro Aufgabe
- Ergebnisse speichern - Alle Analysen sicher in der Cloud

Erste Schritte:
1. Wählen Sie eine Aufgabe aus dem Dashboard
2. Laden Sie Ihre Dokumente hoch
3. Erhalten Sie sofort KI-gestützte Ergebnisse

Zum Dashboard: ${baseUrl}/dashboard

Bei Fragen stehen wir Ihnen gerne zur Verfügung!

Ihr KI2GO Team
  `.trim();
  
  return sendEmail({ to, subject, html, text });
}
