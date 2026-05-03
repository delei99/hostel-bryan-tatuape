import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, Star } from "lucide-react";

interface Photo {
  id?: number;
  photoUrl: string;
  caption?: string;
  displayOrder?: number;
  isMainPhoto?: boolean;
  file?: File;
  isNew?: boolean;
}

interface RoomPhotoGalleryProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  isLoading?: boolean;
}

export default function RoomPhotoGallery({ photos, onPhotosChange, isLoading = false }: RoomPhotoGalleryProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida.");
      return;
    }

    setUploadingIndex(index);

    try {
      // Criar FormData para upload
      const formData = new FormData();
      formData.append("file", file);

      // Fazer upload para S3 via endpoint do servidor
      const response = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao fazer upload da foto");
      }

      const { url } = await response.json();

      // Atualizar foto na galeria
      const updatedPhotos = [...photos];
      updatedPhotos[index] = {
        ...updatedPhotos[index],
        photoUrl: url,
        file: undefined,
      };

      onPhotosChange(updatedPhotos);
      toast.success("Foto enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da foto");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleAddPhoto = () => {
    const newPhoto: Photo = {
      photoUrl: "",
      caption: "",
      displayOrder: photos.length,
      isMainPhoto: photos.length === 0,
      isNew: true,
    };
    onPhotosChange([...photos, newPhoto]);
  };

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    // Atualizar displayOrder
    updatedPhotos.forEach((photo, i) => {
      photo.displayOrder = i;
    });
    onPhotosChange(updatedPhotos);
    toast.success("Foto removida");
  };

  const handleSetMainPhoto = (index: number) => {
    const updatedPhotos = photos.map((photo, i) => ({
      ...photo,
      isMainPhoto: i === index,
    }));
    onPhotosChange(updatedPhotos);
    toast.success("Foto principal atualizada");
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index].caption = caption;
    onPhotosChange(updatedPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Galeria de Fotos</Label>
        <Button
          type="button"
          onClick={handleAddPhoto}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Adicionar Foto
        </Button>
      </div>

      {photos.length === 0 ? (
        <Card className="p-8 text-center border-2 border-dashed">
          <p className="text-gray-500">Nenhuma foto adicionada. Clique em "Adicionar Foto" para começar.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {photos.map((photo, index) => (
            <Card key={index} className="p-4 space-y-3">
              {/* Prévia da foto */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden h-40 flex items-center justify-center">
                {photo.photoUrl ? (
                  <>
                    <img
                      src={photo.photoUrl}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {photo.isMainPhoto && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Principal
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Clique para fazer upload</p>
                  </div>
                )}
              </div>

              {/* Input de arquivo */}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, index)}
                disabled={uploadingIndex === index || isLoading}
                className="hidden"
                id={`photo-input-${index}`}
              />
              <label htmlFor={`photo-input-${index}`}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full cursor-pointer"
                  disabled={uploadingIndex === index || isLoading}
                  onClick={() => document.getElementById(`photo-input-${index}`)?.click()}
                >
                  {uploadingIndex === index ? "Enviando..." : "Escolher Imagem"}
                </Button>
              </label>

              {/* Campo de legenda */}
              <div>
                <Label className="text-xs text-gray-600">Legenda (opcional)</Label>
                <Input
                  type="text"
                  placeholder="Ex: Vista do quarto"
                  value={photo.caption || ""}
                  onChange={(e) => handleCaptionChange(index, e.target.value)}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2">
                {!photo.isMainPhoto && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetMainPhoto(index)}
                    disabled={isLoading}
                    className="flex-1 flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" />
                    Principal
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemovePhoto(index)}
                  disabled={isLoading}
                  className="flex-1 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Remover
                </Button>
              </div>

              {/* Indicador de status */}
              {!photo.photoUrl && (
                <p className="text-xs text-orange-600 text-center">Foto não enviada</p>
              )}
              {photo.photoUrl && (
                <p className="text-xs text-green-600 text-center">✓ Foto enviada</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Resumo */}
      {photos.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-700">
          <p>
            <strong>{photos.filter((p) => p.photoUrl).length}</strong> de{" "}
            <strong>{photos.length}</strong> fotos enviadas
            {photos.find((p) => p.isMainPhoto) && (
              <>
                {" "}
                • <strong>Foto principal:</strong> {photos.find((p) => p.isMainPhoto)?.caption || "Sem legenda"}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
