import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, Trash2, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Página para gerenciar fotos dos quartos
 * Permite adicionar e deletar fotos de cada quarto
 */
export default function AdminRoomPhotos() {
  const { user, isAuthenticated } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [isMainPhoto, setIsMainPhoto] = useState(false);

  // Buscar quartos
  const { data: rooms, isLoading: roomsLoading } = trpc.rooms.list.useQuery();

  // Buscar fotos do quarto selecionado
  const { data: photos, isLoading: photosLoading, refetch: refetchPhotos } = trpc.roomPhotos.getByRoomId.useQuery(
    { roomId: selectedRoomId || 0 },
    { enabled: selectedRoomId !== null }
  );

  // Adicionar foto
  const addPhoto = trpc.roomPhotos.add.useMutation({
    onSuccess: () => {
      toast.success("Foto adicionada com sucesso!");
      setNewPhotoUrl("");
      setNewPhotoCaption("");
      setIsMainPhoto(false);
      refetchPhotos();
    },
    onError: () => {
      toast.error("Erro ao adicionar foto");
    },
  });

  // Deletar foto
  const deletePhoto = trpc.roomPhotos.delete.useMutation({
    onSuccess: () => {
      toast.success("Foto deletada com sucesso!");
      refetchPhotos();
    },
    onError: () => {
      toast.error("Erro ao deletar foto");
    },
  });

  // Verificar se é admin
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Acesso Negado</h2>
          <p className="text-foreground/70">Apenas administradores podem acessar este painel.</p>
        </Card>
      </div>
    );
  }

  const handleAddPhoto = async () => {
    if (!selectedRoomId || !newPhotoUrl.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      await addPhoto.mutateAsync({
        roomId: selectedRoomId,
        photoUrl: newPhotoUrl,
        caption: newPhotoCaption || undefined,
        displayOrder: (photos?.length || 0) + 1,
        isMainPhoto: isMainPhoto ? 1 : 0,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Gerenciar Fotos dos Quartos</h1>
            <p className="text-foreground/70">Adicione e gerencie as fotos de cada quarto</p>
          </div>
        </div>

        {/* Seleção de Quarto */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Selecione um Quarto</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roomsLoading ? (
              <p className="text-foreground/70">Carregando quartos...</p>
            ) : rooms && rooms.length > 0 ? (
              rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRoomId === room.id
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent"
                  }`}
                >
                  <p className="font-semibold text-foreground">{room.name}</p>
                  <p className="text-sm text-foreground/70">{room.capacity} pessoas</p>
                </button>
              ))
            ) : (
              <p className="text-foreground/70">Nenhum quarto disponível</p>
            )}
          </div>
        </Card>

        {/* Adicionar Foto */}
        {selectedRoomId && (
          <Card className="p-6 bg-accent/5">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Adicionar Nova Foto
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="photoUrl">URL da Foto *</Label>
                <Input
                  id="photoUrl"
                  type="url"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="https://exemplo.com/foto.jpg"
                  required
                />
                <p className="text-xs text-foreground/70 mt-1">
                  Copie a URL da imagem hospedada (ex: CDN, Google Drive, etc)
                </p>
              </div>

              <div>
                <Label htmlFor="photoCaption">Descrição da Foto</Label>
                <Input
                  id="photoCaption"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  placeholder="Ex: Vista da cama, Banheiro, etc"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isMainPhoto"
                  checked={isMainPhoto}
                  onChange={(e) => setIsMainPhoto(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <Label htmlFor="isMainPhoto" className="cursor-pointer">
                  Usar como foto principal do quarto
                </Label>
              </div>

              <Button
                onClick={handleAddPhoto}
                disabled={addPhoto.isPending || !newPhotoUrl.trim()}
                className="w-full bg-accent hover:bg-opacity-90 text-white"
              >
                {addPhoto.isPending ? "Adicionando..." : "Adicionar Foto"}
              </Button>
            </div>
          </Card>
        )}

        {/* Galeria de Fotos */}
        {selectedRoomId && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Fotos do Quarto
            </h3>

            {photosLoading ? (
              <p className="text-foreground/70">Carregando fotos...</p>
            ) : photos && photos.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <div key={photo.id} className="rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-200 flex items-center justify-center overflow-hidden">
                      <img
                        src={photo.photoUrl}
                        alt={photo.caption || "Foto do quarto"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="p-4">
                      {photo.caption && (
                        <p className="text-sm text-foreground mb-2 font-semibold">{photo.caption}</p>
                      )}
                      {photo.isMainPhoto === 1 && (
                        <p className="text-xs bg-accent/20 text-accent px-2 py-1 rounded mb-3 inline-block">
                          Foto Principal
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => window.open(photo.photoUrl, "_blank")}
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs border-red-600 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja deletar esta foto?")) {
                              deletePhoto.mutate({ photoId: photo.id });
                            }
                          }}
                          disabled={deletePhoto.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
                <p className="text-foreground/70">Nenhuma foto adicionada ainda</p>
                <p className="text-sm text-foreground/50">Adicione fotos usando o formulário acima</p>
              </div>
            )}
          </Card>
        )}

        {/* Instruções */}
        <Card className="p-6 bg-secondary/5 border-secondary/20">
          <h4 className="font-bold text-foreground mb-3">📝 Como Adicionar Fotos</h4>
          <ol className="text-foreground/70 text-sm space-y-2 list-decimal list-inside">
            <li>Selecione um quarto na seção acima</li>
            <li>Hospede a imagem em um serviço online (Google Drive, Imgur, etc)</li>
            <li>Copie a URL da imagem e cole no campo "URL da Foto"</li>
            <li>Adicione uma descrição opcional (ex: "Vista da cama")</li>
            <li>Marque como "foto principal" se desejar que apareça primeiro</li>
            <li>Clique em "Adicionar Foto"</li>
          </ol>
        </Card>
      </div>
    </DashboardLayout>
  );
}
