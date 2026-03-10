import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import fs from "fs";

dotenv.config();

const TOKEN_FILE = './.user-tokens.json';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // In-memory store for tokens (for demo purposes)
  let userTokens: any = null;
  if (fs.existsSync(TOKEN_FILE)) {
    try { userTokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')); } catch {}
  }

  const getOAuth2Client = (redirectUri?: string) => {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri || `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`
    );
  };

  const getAuthenticatedClient = () => {
    const client = getOAuth2Client();
    if (userTokens) {
      client.setCredentials(userTokens);
    }
    return client;
  };

  app.get("/api/auth/url", (req, res) => {
    try {
      const redirectUri = req.query.redirectUri as string;
      if (!redirectUri) {
        return res.status(400).json({ error: "redirectUri is required" });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return res.status(500).json({ 
          error: "Missing Google OAuth credentials.",
          needsSetup: true
        });
      }

      const oauth2Client = getOAuth2Client(redirectUri);
      const scopes = [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/calendar.readonly",
      ];

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        prompt: "consent",
      });

      res.json({ url: authUrl });
    } catch (error: any) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({ error: error.message || "Failed to generate auth URL" });
    }
  });

  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code } = req.query;
    const safeCode = typeof code === 'string' ? code.replace(/[^a-zA-Z0-9/_\-\.=]/g, '') : '';
    const origin = process.env.APP_URL || 'http://localhost:3000';
    
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage(
                { type: 'OAUTH_AUTH_SUCCESS', code: ${JSON.stringify(safeCode)} },
                ${JSON.stringify(origin)}
              );
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  });

  app.post("/api/auth/token", async (req, res) => {
    const { code, redirectUri } = req.body;
    if (!code || !redirectUri) {
      return res.status(400).json({ error: "code and redirectUri are required" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        error: "Missing Google OAuth credentials.",
        needsSetup: true
      });
    }

    try {
      const oauth2Client = getOAuth2Client(redirectUri);
      const { tokens } = await oauth2Client.getToken(code);
      userTokens = tokens;
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error exchanging code for token:", error);
      res.status(500).json({ error: error.message || "Failed to exchange code for token" });
    }
  });

  app.get("/api/auth/status", (req, res) => {
    res.json({ connected: !!userTokens });
  });

  app.post("/api/auth/disconnect", (req, res) => {
    userTokens = null;
    if (fs.existsSync(TOKEN_FILE)) fs.unlinkSync(TOKEN_FILE);
    res.json({ success: true });
  });

  app.get("/api/drive/files", async (req, res) => {
    if (!userTokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const folderId = req.query.folderId as string;
    if (!folderId) {
      return res.status(400).json({ error: "folderId is required" });
    }

    try {
      const oauth2Client = getAuthenticatedClient();
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "files(id, name, mimeType, webViewLink, iconLink, modifiedTime)",
        orderBy: "modifiedTime desc",
      });

      res.json({ files: response.data.files || [] });
    } catch (error: any) {
      console.error("Error fetching files:", error);
      res.status(500).json({ error: error.message || "Failed to fetch files" });
    }
  });

  app.get("/api/drive/papers/content", async (req, res) => {
    if (!userTokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const folderId = process.env.PAPERS_FOLDER_ID;
    if (!folderId) {
      return res.status(500).json({ error: "PAPERS_FOLDER_ID not set in .env" });
    }

    try {
      const oauth2Client = getAuthenticatedClient();
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "files(id, name, mimeType)",
      });

      const files = response.data.files || [];
      let allContent = '';

      const filePromises = files.map(async (file) => {
        if (file.id && file.mimeType === 'text/plain') {
          try {
            const fileRes = await drive.files.get({
              fileId: file.id,
              alt: 'media'
            }, { responseType: 'text' });
            return `\n\n--- Paper: ${file.name} ---\n${fileRes.data}`;
          } catch (err) {
            console.error(`Failed to fetch content for ${file.name}`, err);
            return '';
          }
        } else if (file.id && file.mimeType === 'application/vnd.google-apps.document') {
          try {
            const fileRes = await drive.files.export({
              fileId: file.id,
              mimeType: 'text/plain'
            }, { responseType: 'text' });
            return `\n\n--- Paper: ${file.name} ---\n${fileRes.data}`;
          } catch (err) {
            console.error(`Failed to export content for ${file.name}`, err);
            return '';
          }
        }
        return '';
      });

      const results = await Promise.all(filePromises);
      allContent += results.join('');

      res.json({ content: allContent });
    } catch (error: any) {
      console.error("Error fetching papers content:", error);
      res.status(500).json({ error: error.message || "Failed to fetch papers content" });
    }
  });

  app.get("/api/calendar/events", async (req, res) => {
    if (!userTokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const oauth2Client = getAuthenticatedClient();
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const calendarIds = (process.env.CALENDAR_IDS || '').split(',').filter(Boolean);

      const timeMin = new Date('2026-01-01T00:00:00Z').toISOString();
      let allEvents: any[] = [];

      for (const calendarId of calendarIds) {
        try {
          const response = await calendar.events.list({
            calendarId: calendarId,
            timeMin: timeMin,
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime',
          });
          
          if (response.data.items) {
            allEvents.push(...response.data.items.map(item => ({ ...item, sourceCalendar: calendarId })));
          }
        } catch (err) {
          console.error(`Failed to fetch events for calendar ${calendarId}`, err);
        }
      }

      res.json({ events: allEvents });
    } catch (error: any) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: error.message || "Failed to fetch calendar events" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
