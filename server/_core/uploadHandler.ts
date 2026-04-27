import { Request, Response } from "express";
import { storagePut } from "../storage";
import sharp from "sharp";

/**
 * Handler para upload de fotos dos quartos
 * Otimiza a imagem antes de fazer upload para S3
 */
export async function handleRoomPhotoUpload(req: Request, res: Response) {
  try {
    const { roomId } = req.body;
    const file = req.file;

    if (!file || !roomId) {
      return res.status(400).json({ error: "Arquivo ou roomId faltando" });
    }

    // Validar tipo de arquivo
    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "Arquivo deve ser uma imagem" });
    }

    // Otimizar imagem com sharp
    const optimizedBuffer = await sharp(file.buffer)
      .resize(1200, 1200, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Fazer upload para S3
    const fileKey = `room-photos/${roomId}/${Date.now()}-${file.originalname}`;
    const { url } = await storagePut(fileKey, optimizedBuffer, "image/jpeg");

    // Salvar referência no banco de dados
    const { db } = await import("../db");
    await db.roomPhotos.create({
      roomId: parseInt(roomId),
      url,
      fileKey,
    });

    return res.json({ success: true, url });
  } catch (error) {
    console.error("Erro ao fazer upload de foto:", error);
    return res.status(500).json({ error: "Erro ao fazer upload" });
  }
}
