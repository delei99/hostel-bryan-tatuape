import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Phone, Mail, Wifi, Users } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Landing page elegante e sofisticada para o Hostel Bryan Tatuapé
 * Apresenta informações do hostel, localização, comodidades e galeria
 */
export default function Home() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  // Buscar fotos reais dos quartos
  const { data: rooms } = trpc.rooms.list.useQuery();
  
  // Fotos padrão de exemplo como fallback
  const defaultGalleryImages = [
    { id: 1, title: "Recepção", alt: "Recepção elegante do hostel" },
    { id: 2, title: "Quarto Compartilhado", alt: "Quarto compartilhado moderno" },
    { id: 3, title: "Quarto Privado", alt: "Quarto privado confortável" },
    { id: 4, title: "Área Comum", alt: "Área comum para hóspedes" },
    { id: 5, title: "Cozinha", alt: "Cozinha equipada" },
    { id: 6, title: "Varanda", alt: "Varanda com vista" },
  ];

  // Integrar fotos reais dos quartos com fallback para padrão
  const galleryImages = useMemo(() => {
    if (rooms && rooms.length > 0) {
      return rooms
        .filter(room => room.imageUrl)
        .map(room => ({
          id: room.id,
          title: room.name,
          alt: room.name,
          imageUrl: room.imageUrl || undefined,
        }))
        .slice(0, 6) as Array<{ id: number; title: string; alt: string; imageUrl?: string }>;
    }
    return defaultGalleryImages as Array<{ id: number; title: string; alt: string; imageUrl?: string }>;
  }, [rooms]);

  // Comodidades do hostel
  const amenities = [
    { icon: Wifi, title: "WiFi Rápido", description: "Conexão de alta velocidade em todos os ambientes" },
    { icon: Users, title: "Espaço Social", description: "Área comum para conhecer outros hóspedes" },
    { icon: MapPin, title: "Localização Estratégica", description: "Próximo a pontos turísticos e transportes" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">Hostel Bryan Tatuapé</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#sobre" className="text-foreground hover:text-accent transition-colors">Sobre</a>
            <a href="#comodidades" className="text-foreground hover:text-accent transition-colors">Comodidades</a>
            <a href="#galeria" className="text-foreground hover:text-accent transition-colors">Galeria</a>
            <a href="#contato" className="text-foreground hover:text-accent transition-colors">Contato</a>
            <Link href="/reservar">
              <Button className="bg-accent hover:bg-opacity-90">Fazer Reserva</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-accent/10 to-secondary/10 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-72 h-72 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-secondary rounded-full blur-3xl"></div>
        </div>
        
        <div className="container relative z-10">
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Bem-vindo ao Hostel Bryan Tatuapé
            </h2>
            <p className="text-lg md:text-xl text-foreground/70 mb-8 leading-relaxed">
              Sua experiência perfeita de hospedagem no coração de São Paulo. Conforto, elegância e hospitalidade em um único lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/reservar">
                <Button size="lg" className="bg-accent hover:bg-opacity-90 text-white">
                  Reservar Agora
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10">
                Saiba Mais
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="py-20 md:py-32">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-4xl font-bold text-foreground mb-6">Sobre o Hostel Bryan Tatuapé</h3>
              <p className="text-foreground/70 mb-4 leading-relaxed">
                O Hostel Bryan Tatuapé é um espaço sofisticado e acolhedor, perfeito para viajantes que buscam conforto e convivência. Localizado no bairro tradicional de Tatuapé, oferecemos uma experiência única com design elegante e serviços de qualidade.
              </p>
              <p className="text-foreground/70 mb-6 leading-relaxed">
                Com 7 quartos confortáveis, combinamos privacidade e conforto, enquanto nossas áreas comuns promovem encontros memoráveis entre hóspedes de todo o mundo.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-accent" />
                  <span className="text-foreground">Rua Mauro Pinheiro 69, Chácara Califórnia - São Paulo, SP</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-accent" />
                  <span className="text-foreground">(11) 99521-97283</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-accent" />
                  <span className="text-foreground">contato@hostelbryan.com.br</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-accent/20 to-secondary/20 rounded-2xl p-8 h-screen md:h-96 flex items-center justify-center overflow-hidden">
              <img 
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663547970962/iAcfZDXDNVkXabyqU5LtFN/IMG_20260416_154525_d0eaf8de.jpg" 
                alt="Fachada do Hostel Bryan Tatuapé"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mapa Interativo */}
      <section className="py-20 md:py-32 bg-accent/5">
        <div className="container">
          <h3 className="text-4xl font-bold text-foreground mb-12 text-center">Localização</h3>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-foreground/70 mb-6 leading-relaxed">
                Estamos estrategicamente localizados no bairro de Tatuapé, um dos mais tradicionais de São Paulo, com fácil acesso a transportes públicos, restaurantes, comércios e pontos turísticos.
              </p>
              <p className="text-foreground/70 mb-8 leading-relaxed">
                Clique no botão abaixo para traçar uma rota até o hostel usando seu aplicativo de mapas favorito.
              </p>
              <Button 
                size="lg" 
                className="bg-accent hover:bg-opacity-90 text-white"
                onClick={() => window.open('https://maps.google.com/?q=Rua+Mauro+Pinheiro+69,+Chácara+Califórnia,+São+Paulo', '_blank')}
              >
                <MapPin className="w-5 h-5 mr-2" />
                Ver Rotas no Google Maps
              </Button>
            </div>
            <div className="bg-gradient-to-br from-accent/30 to-secondary/30 rounded-2xl overflow-hidden h-96">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-foreground/50">Mapa interativo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comodidades */}
      <section id="comodidades" className="py-24 md:py-40 bg-white/50">
        <div className="container">
          <h3 className="text-4xl font-bold text-foreground mb-12 text-center">Nossas Comodidades</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {amenities.map((amenity, index) => {
              const Icon = amenity.icon;
              return (
                <Card key={index} className="p-8 hover:shadow-lg transition-shadow">
                  <Icon className="w-12 h-12 text-accent mb-4" />
                  <h4 className="text-xl font-bold text-foreground mb-2">{amenity.title}</h4>
                  <p className="text-foreground/70">{amenity.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Galeria */}
      <section id="galeria" className="py-24 md:py-40 bg-accent/5">
        <div className="container">
          <h3 className="text-4xl font-bold text-foreground mb-12 text-center">Galeria</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {galleryImages.map((image) => (
              <div
                key={image.id}
                onClick={() => setSelectedImage(image.id)}
                className="bg-gradient-to-br from-accent/20 to-secondary/20 rounded-xl overflow-hidden h-64 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
              >
                {image.imageUrl ? (
                  <img
                    src={image.imageUrl}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-foreground font-semibold">{image.title}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-40 bg-gradient-to-r from-accent to-secondary">
        <div className="container text-center">
          <h3 className="text-4xl font-bold text-white mb-6">Pronto para sua próxima aventura?</h3>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Reserve seu quarto agora e desfrute de uma experiência inesquecível no Hostel Bryan Tatuapé.
          </p>
          <Link href="/reservar">
            <Button size="lg" className="bg-white text-accent hover:bg-white/90">
              Fazer Reserva Agora
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-foreground text-white py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Hostel Bryan Tatuapé</h4>
              <p className="text-white/70 text-sm">Sua experiência perfeita de hospedagem em São Paulo.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contato</h4>
              <p className="text-white/70 text-sm mb-2">(11) 99521-97283</p>
              <p className="text-white/70 text-sm">contato@hostelbryan.com.br</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Endereço</h4>
              <p className="text-white/70 text-sm">Rua Mauro Pinheiro 69</p>
              <p className="text-white/70 text-sm">Chácara Califórnia</p>
              <p className="text-white/70 text-sm">CEP 03404-120</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Links Rápidos</h4>
              <ul className="text-white/70 text-sm space-y-2">
                <li><a href="#sobre" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#comodidades" className="hover:text-white transition-colors">Comodidades</a></li>
                <li><a href="#galeria" className="hover:text-white transition-colors">Galeria</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/70 text-sm">
            <p>&copy; 2026 Hostel Bryan Tatuapé. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
