import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Upload, Trash2, X, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function RoomPhotosUpload() {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [isMainPhoto, setIsMainPhoto] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Buscar quartos
  const { data: rooms = [] } = trpc.rooms.list.useQuery();

  // Buscar fotos do quarto selecionado
  const { data: roomPhotos = [], refetch: refetchPhotos } = trpc.roomPhotos.getByRoom.useQuery(
    { roomId: parseInt(selectedRoomId) },
    { enabled: !!selectedRoomId }
  );

  const uploadPhoto = trpc.roomPhotos.uploadAndOptimize.useMutation();
  const deletePhoto = trpc.roomPhotos.delete.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (uploadedFiles.length + files.length > 10) {
      toast.error("Máximo de 10 fotos por quarto!");
      return;
    }

    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (!selectedRoomId) {
      toast.error("Selecione um quarto!");
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.error("Selecione pelo menos uma foto!");
      return;
    }

    try {
      setIsUploading(true);
      let uploadedCount = 0;

      for (const file of uploadedFiles) {
        // Ler arquivo como base64
        const reader = new FileReader();
        
        await new Promise((resolve, reject) => {
          reader.onload = async () => {
            try {
              const base64 = (reader.result as string).split(',')[1];
              
              await uploadPhoto.mutateAsync({
                roomId: parseInt(selectedRoomId),
                fileBase64: base64,
                fileName: file.name,
                caption: caption || undefined,
                isMainPhoto: isMainPhoto && uploadedCount === 0 ? 1 : 0,
              });

              uploadedCount++;
              resolve(null);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      toast.success(`${uploadedCount} foto(s) enviada(s) com sucesso!`);
      setUploadedFiles([]);
      setCaption("");
      setIsMainPhoto(false);
      refetchPhotos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload das fotos");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm("Tem certeza que deseja deletar esta foto?")) return;

    try {
      await deletePhoto.mutateAsync({ photoId });
      toast.success("Foto deletada com sucesso!");
      refetchPhotos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar foto");
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl">
        <Link href="/" className="flex items-center gap-2 text-accent hover:text-accent/80 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-8">Upload de Fotos dos Quartos</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulário de Upload */}
          <Card className="p-6 lg:col-span-1">
            <h2 className="text-xl font-bold text-foreground mb-6">Adicionar Fotos</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="room">Quarto</Label>
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um quarto" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={String(room.id)}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="caption">Legenda (Opcional)</Label>
                <Input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ex: Vista da cama"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isMainPhoto"
                  checked={isMainPhoto}
                  onChange={(e) => setIsMainPhoto(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="isMainPhoto" className="text-sm cursor-pointer">
                  Definir primeira como principal
                </label>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="fileInput"
                />
                <label htmlFor="fileInput" className="cursor-pointer block">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-foreground">
                    Clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ou arraste aqui
                  </p>
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    {uploadedFiles.length} foto(s) selecionada(s)
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span className="truncate">{file.name}</span>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-600 hover:text-red-700 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleUploadFiles}
                disabled={isUploading || uploadedFiles.length === 0 || !selectedRoomId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Enviar Fotos
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Lista de Fotos */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Fotos do Quarto
              {selectedRoomId && ` - ${rooms.find(r => r.id === parseInt(selectedRoomId))?.name}`}
            </h2>

            {!selectedRoomId ? (
              <p className="text-muted-foreground text-center py-8">
                Selecione um quarto para ver suas fotos
              </p>
            ) : roomPhotos.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma foto adicionada para este quarto
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {roomPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={photo.photoUrl}
                        alt={photo.caption || "Foto do quarto"}
                        className="w-full h-full object-cover"
                      />
                      {photo.isMainPhoto === 1 && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                          Principal
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      {photo.caption && (
                        <p className="text-sm font-medium text-foreground mb-2">
                          {photo.caption}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mb-3">
                        Ordem: {photo.displayOrder}
                      </p>

                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Deletar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Informações */}
        <Card className="p-6 mt-6 bg-blue-50">
          <h3 className="text-lg font-bold text-foreground mb-2">ℹ️ Informações</h3>
          <ul className="text-sm text-foreground space-y-1">
            <li>✓ Máximo de 10 fotos por quarto</li>
            <li>✓ Fotos são automaticamente otimizadas (redimensionadas e comprimidas)</li>
            <li>✓ Armazenadas em S3 para máxima performance</li>
            <li>✓ Suporta formatos: JPG, PNG, GIF, WebP</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
