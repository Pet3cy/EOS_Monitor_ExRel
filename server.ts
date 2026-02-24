import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // In-memory store for tokens (for demo purposes)
  let userTokens: any = null;

  const getOAuth2Client = (redirectUri: string) => {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
  };

  app.get("/api/auth/url", (req, res) => {
    try {
      const redirectUri = req.query.redirectUri as string;
      if (!redirectUri) {
        return res.status(400).json({ error: "redirectUri is required" });
      }

      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(500).json({ 
          error: "Missing Google OAuth credentials.",
          needsSetup: true
        });
      }

      const oauth2Client = getOAuth2Client(redirectUri);
      const scopes = [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.readonly",
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
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', code: '${code}' }, '*');
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

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ 
        error: "Missing Google OAuth credentials.",
        needsSetup: true
      });
    }

    try {
      const oauth2Client = getOAuth2Client(redirectUri);
      const { tokens } = await oauth2Client.getToken(code);
      userTokens = tokens;
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
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials(userTokens);
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

    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials(userTokens);
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      const folderId = '1obdX4rkD2A0Cn_ayk3dtJqR96ASiGl3j';
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "files(id, name, mimeType)",
      });

      const files = response.data.files || [];
      let allContent = '';

      for (const file of files) {
        if (file.id && file.mimeType === 'text/plain') {
          try {
            const fileRes = await drive.files.get({
              fileId: file.id,
              alt: 'media'
            }, { responseType: 'text' });
            allContent += `\n\n--- Paper: ${file.name} ---\n${fileRes.data}`;
          } catch (err) {
            console.error(`Failed to fetch content for ${file.name}`, err);
          }
        } else if (file.id && file.mimeType === 'application/vnd.google-apps.document') {
          try {
            const fileRes = await drive.files.export({
              fileId: file.id,
              mimeType: 'text/plain'
            }, { responseType: 'text' });
            allContent += `\n\n--- Paper: ${file.name} ---\n${fileRes.data}`;
          } catch (err) {
            console.error(`Failed to export content for ${file.name}`, err);
          }
        }
      }

      res.json({ content: allContent });
    } catch (error: any) {
      console.error("Error fetching papers content:", error);
      res.status(500).json({ error: error.message || "Failed to fetch papers content" });
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
