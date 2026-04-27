import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * Página de upload de fotos dos quartos
 * Permite fazer upload de até 10 fotos por quarto
 * As fotos são otimizadas automaticamente
 */
export default function PhotoUpload() {
  const [selectedRoomId, setSelectedRoomId] = useState<number>(1);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Buscar quartos
  const { data: rooms } = trpc.rooms.list.useQuery();

  // Buscar fotos do quarto selecionado
  const { data: roomPhotos, refetch: refetchPhotos } = trpc.roomPhotos.getByRoom.useQuery({
    roomId: selectedRoomId,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = 10 - (roomPhotos?.length || 0);
    const currentCount = uploadedPhotos.length;
    
    if (currentCount + files.length > maxFiles) {
      alert(`Máximo de ${maxFiles} foto(s) permitida(s). Você já selecionou ${currentCount}.`);
      return;
    }

    setUploadedPhotos([...uploadedPhotos, ...files]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadedPhotos.length === 0) {
      alert("Selecione pelo menos uma foto");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Fazer upload de cada foto
      for (const file of uploadedPhotos) {
        // Otimizar imagem antes de fazer upload
        const optimizedFile = await optimizeImage(file);
        
        // Fazer upload para S3 via API
        const formData = new FormData();
        formData.append("file", optimizedFile);
        formData.append("roomId", selectedRoomId.toString());

        await fetch("/api/upload-room-photo", {
          method: "POST",
          body: formData,
        });
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Limpar e atualizar
      setUploadedPhotos([]);
      await refetchPhotos();
      
      alert("Fotos enviadas com sucesso!");
      setUploadProgress(0);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload das fotos");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const optimizeImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Redimensionar se maior que 1200px
          if (width > 1200) {
            height = (height * 1200) / width;
            width = 1200;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            const optimizedFile = new File([blob!], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(optimizedFile);
          }, "image/jpeg", 0.8);
        };
      };
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">Upload de Fotos dos Quartos</h1>

        {/* Seleção de Quarto */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Selecionar Quarto</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rooms?.map((room) => (
              <button
                key={room.id}
                onClick={() => {
                  setSelectedRoomId(room.id);
                  setUploadedPhotos([]);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRoomId === room.id
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-accent"
                }`}
              >
                <p className="font-semibold text-foreground">{room.name}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Fotos Existentes */}
        {roomPhotos && roomPhotos.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Fotos Existentes ({roomPhotos.length}/10)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {roomPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.photoUrl}
                    alt={`Foto ${photo.id}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      // TODO: Implementar deleção de foto
                      alert("Deleção de fotos em desenvolvimento");
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Upload de Novas Fotos */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Adicionar Novas Fotos ({uploadedPhotos.length} selecionada(s))
          </h2>

          {/* Área de Drag and Drop */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-6 hover:border-accent transition-colors">
            <Upload className="w-12 h-12 text-accent mx-auto mb-4" />
            <p className="text-foreground mb-2">Arraste as fotos aqui ou clique para selecionar</p>
            <p className="text-foreground/60 text-sm mb-4">
              Máximo de {10 - (roomPhotos?.length || 0)} foto(s) permitida(s)
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading || (uploadedPhotos.length + (roomPhotos?.length || 0)) >= 10}
              className="hidden"
              id="photo-input"
            />
            <Button
              onClick={() => document.getElementById('photo-input')?.click()}
              className="bg-accent hover:bg-opacity-90 text-white cursor-pointer"
              disabled={isUploading || (uploadedPhotos.length + (roomPhotos?.length || 0)) >= 10}
            >
              Selecionar Fotos
            </Button>
          </div>

          {/* Preview das Fotos Selecionadas */}
          {uploadedPhotos.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-4">Fotos Selecionadas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedPhotos.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index}`}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barra de Progresso */}
          {uploadProgress > 0 && (
            <div className="mb-6">
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-foreground/60 mt-2">{uploadProgress}%</p>
            </div>
          )}

          {/* Botão de Upload */}
          <Button
            onClick={handleUpload}
            disabled={uploadedPhotos.length === 0 || isUploading}
            className="w-full bg-accent hover:bg-opacity-90 text-white py-3 text-lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Enviar {uploadedPhotos.length} Foto(s)
              </>
            )}
          </Button>
        </Card>

        {/* Informações */}
        <Card className="p-6 bg-accent/5">
          <h3 className="font-semibold text-foreground mb-2">ℹ️ Informações</h3>
          <ul className="text-sm text-foreground/70 space-y-1">
            <li>• Máximo de 10 fotos por quarto</li>
            <li>• Fotos são otimizadas automaticamente (redimensionadas e comprimidas)</li>
            <li>• Formatos aceitos: JPG, PNG, WebP</li>
            <li>• Tamanho máximo por foto: 5MB</li>
            <li>• As fotos aparecerão na galeria após o upload</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
