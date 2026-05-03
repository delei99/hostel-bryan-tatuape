import { Request, Response } from "express";
import { storagePut } from "../storage";
import crypto from "crypto";

export async function handlePhotoUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo fornecido" });
    }

    const file = req.file;

    // Validar tipo de arquivo
    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "Arquivo não é uma imagem válida" });
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "Arquivo muito grande. Máximo 5MB." });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const fileKey = `room-photos/${timestamp}-${randomSuffix}.${file.mimetype.split("/")[1]}`;

    // Fazer upload para S3
    const { url } = await storagePut(fileKey, file.buffer, file.mimetype);

    return res.json({ url });
  } catch (error) {
    console.error("[Upload] Erro ao fazer upload:", error);
    return res.status(500).json({ error: "Erro ao fazer upload da foto" });
  }
}
