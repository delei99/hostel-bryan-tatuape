import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function RoomGallery() {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("1");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Buscar quartos
  const { data: rooms = [] } = trpc.rooms.list.useQuery();

  // Buscar fotos do quarto selecionado
  const { data: roomPhotos = [] } = trpc.roomPhotos.getByRoom.useQuery(
    { roomId: parseInt(selectedRoomId) },
    { enabled: !!selectedRoomId }
  );

  const selectedRoom = rooms.find(r => r.id === parseInt(selectedRoomId));

  // Imagens do carrossel (fotos do quarto ou placeholder)
  const carouselImages = roomPhotos.length > 0
    ? roomPhotos.map(photo => ({
        id: photo.id,
        url: photo.photoUrl,
        title: photo.caption || selectedRoom?.name || "Quarto",
      }))
    : [
        {
          id: 1,
          url: "https://via.placeholder.com/800x600?text=Quarto+" + selectedRoomId,
          title: selectedRoom?.name || "Quarto",
        },
      ];

  const handlePrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? carouselImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) =>
      prev === carouselImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    setCurrentImageIndex(0);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-6xl">
        {/* Voltar */}
        <Link href="/" className="flex items-center gap-2 text-accent hover:text-accent/80 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Home
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-6">Galeria de Quartos</h1>
          
          {/* Dropdown de Quartos */}
          <div className="flex items-center gap-4">
            <label className="text-foreground font-semibold">Selecione um Quarto:</label>
            <Select value={selectedRoomId} onValueChange={handleRoomChange}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id.toString()}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Carrossel de Fotos */}
        {selectedRoom && (
          <Card className="p-8">
            <div className="relative bg-gradient-to-br from-accent/10 to-secondary/10 rounded-lg overflow-hidden mb-6">
              {/* Imagem Principal */}
              <div className="relative w-full h-96 md:h-screen flex items-center justify-center bg-black">
                <img
                  src={carouselImages[currentImageIndex].url}
                  alt={carouselImages[currentImageIndex].title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/800x600?text=Imagem+não+disponível";
                  }}
                />

                {/* Botões de Navegação */}
                {carouselImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevious}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full transition-all z-10"
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full transition-all z-10"
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                {/* Contador de Imagens */}
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {carouselImages.length}
                </div>
              </div>

              {/* Título da Imagem */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {carouselImages[currentImageIndex].title}
                </h2>
              </div>

              {/* Miniaturas */}
              {carouselImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {carouselImages.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-accent"
                          : "border-transparent hover:border-accent/50"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`Miniatura ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/80x80?text=Img";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informações do Quarto */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {selectedRoom.name}
                </h3>
                <p className="text-foreground/70 mb-6">
                  {selectedRoom.description || "Quarto confortável e bem equipado no Hostel Bryan Tatuapé."}
                </p>
                <div className="space-y-3 mb-6">
                  <p className="text-foreground text-lg font-semibold text-accent">
                    Quarto para 1 ou 2 pessoas
                  </p>
                  <p className="text-foreground">
                    <span className="font-semibold">Capacidade:</span> 2 pessoa(s)
                  </p>
                  <p className="text-foreground">
                    <span className="font-semibold">Preço:</span> R$ 80,00 por noite
                  </p>
                </div>
              </div>

              <div className="flex items-end">
                <Link href={`/reservar?roomId=${selectedRoomId}`} className="w-full">
                  <Button className="w-full bg-accent hover:bg-opacity-90 text-white py-6 text-lg">
                    Solicitar Reserva
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
