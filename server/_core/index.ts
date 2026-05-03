import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import sharp from "sharp";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Configure multer for file uploads (memory storage)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
      // Aceitar apenas imagens
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos de imagem são permitidos'));
      }
    }
  });
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Endpoint genérico de upload de fotos (sem salvar no banco)
  app.post('/api/upload-photo', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'Arquivo faltando' });
      }
      
      // Otimizar imagem com Sharp
      const optimizedBuffer = await sharp(file.buffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      // Fazer upload para S3
      const { storagePut } = await import('../storage');
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `room-photos/${timestamp}-${randomSuffix}.jpg`;
      const { url } = await storagePut(fileKey, optimizedBuffer, 'image/jpeg');
      
      return res.json({ url });
    } catch (error) {
      console.error('Erro ao fazer upload de foto:', error);
      return res.status(500).json({ error: 'Erro ao fazer upload: ' + (error instanceof Error ? error.message : 'Erro desconhecido') });
    }
  });
  
  // Endpoint de upload de fotos com salvar no banco
  app.post('/api/upload-room-photo', upload.single('file'), async (req, res) => {
    try {
      const { roomId } = req.body;
      const file = req.file;
      
      if (!file || !roomId) {
        return res.status(400).json({ error: 'Arquivo ou roomId faltando' });
      }
      
      // Validar roomId
      const parsedRoomId = parseInt(roomId);
      if (isNaN(parsedRoomId)) {
        return res.status(400).json({ error: 'roomId inválido' });
      }
      
      // Otimizar imagem com Sharp
      const optimizedBuffer = await sharp(file.buffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      // Fazer upload para S3
      const { storagePut } = await import('../storage');
      const fileKey = `room-photos/${parsedRoomId}/${Date.now()}-${file.originalname}`;
      const { url } = await storagePut(fileKey, optimizedBuffer, 'image/jpeg');
      
      // Salvar referência no banco de dados
      const { addRoomPhoto } = await import('../db');
      const result = await addRoomPhoto({
        roomId: parsedRoomId,
        photoUrl: url,
        displayOrder: 0,
        isMainPhoto: 0
      });
      
      return res.json({ success: true, url, photoId: result });
    } catch (error) {
      console.error('Erro ao fazer upload de foto:', error);
      return res.status(500).json({ error: 'Erro ao fazer upload: ' + (error instanceof Error ? error.message : 'Erro desconhecido') });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
