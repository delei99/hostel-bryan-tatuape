import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Link } from "wouter";

export default function Booking() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cpf: "",
    nationality: "",
    roomId: "1",
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    numberOfGuests: "1",
    specialRequests: "",
  });

  const [showReview, setShowReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);

  // Buscar quartos
  const { data: rooms = [] } = trpc.rooms.list.useQuery();
  const createBooking = trpc.bookings.create.useMutation();

  // Constantes
  const PRICE_PER_NIGHT = 8000; // R$ 80,00 em centavos
  const CLEANING_FEE = 700; // R$ 7,00 em centavos
  const DISCOUNT_PERCENTAGE = 12; // 12% de desconto para uma pessoa

  // Calcular preço
  const priceCalculation = useMemo(() => {
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return { nights: 0, subtotal: 0, discount: 0, cleaning: CLEANING_FEE, total: 0 };

    const subtotal = nights * PRICE_PER_NIGHT;
    const discount = formData.numberOfGuests === "1" ? Math.floor(subtotal * DISCOUNT_PERCENTAGE / 100) : 0;
    const total = subtotal - discount + CLEANING_FEE;

    return { nights, subtotal, discount, cleaning: CLEANING_FEE, total };
  }, [formData.checkInDate, formData.checkOutDate, formData.numberOfGuests]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = formData.firstName && formData.lastName && formData.email && formData.phone && formData.cpf && formData.nationality && formData.checkInDate && formData.checkOutDate;

  const handleReviewClick = () => {
    if (!isFormValid) {
      toast.error("Por favor, preencha todos os campos obrigatórios!");
      return;
    }
    setShowReview(true);
  };

  const handleFinalizeBooking = async () => {
    try {
      setIsSubmitting(true);
      const roomId = parseInt(formData.roomId);
      const numberOfGuests = parseInt(formData.numberOfGuests);
      
      const result = await createBooking.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf,
        nationality: formData.nationality,
        roomId,
        checkInDate: new Date(formData.checkInDate),
        checkOutDate: new Date(formData.checkOutDate),
        numberOfGuests,
        dailyType: numberOfGuests === 1 ? "individual" : "couple",
        subtotal: priceCalculation.subtotal,
        discountPercentage: numberOfGuests === 1 ? DISCOUNT_PERCENTAGE : 0,
        discountAmount: priceCalculation.discount,
        cleaningFee: CLEANING_FEE,
        totalPrice: priceCalculation.total,
        specialRequests: formData.specialRequests,
      });

      setConfirmationCode(result.confirmationCode);
      toast.success("Reserva criada com sucesso!");

      // Gerar mensagem WhatsApp
      const room = rooms.find(r => r.id === roomId);
      const message = `*Reserva Confirmada - Hostel Bryan Tatuapé*\n\n` +
        `*Código: ${result.confirmationCode}*\n\n` +
        `*Hóspede:* ${formData.firstName} ${formData.lastName}\n` +
        `*Email:* ${formData.email}\n` +
        `*Telefone:* ${formData.phone}\n` +
        `*CPF:* ${formData.cpf}\n` +
        `*Nacionalidade:* ${formData.nationality}\n\n` +
        `*Quarto:* ${room?.name}\n` +
        `*Check-in:* ${new Date(formData.checkInDate).toLocaleDateString('pt-BR')}\n` +
        `*Check-out:* ${new Date(formData.checkOutDate).toLocaleDateString('pt-BR')}\n` +
        `*Hóspedes:* ${numberOfGuests} pessoa${numberOfGuests > 1 ? 's' : ''}\n\n` +
        `*Valores:*\n` +
        `Subtotal: R$ ${(priceCalculation.subtotal / 100).toFixed(2)}\n` +
        `${priceCalculation.discount > 0 ? `Desconto (12%): -R$ ${(priceCalculation.discount / 100).toFixed(2)}\n` : ''}` +
        `Limpeza: R$ ${(priceCalculation.cleaning / 100).toFixed(2)}\n` +
        `*Total: R$ ${(priceCalculation.total / 100).toFixed(2)}*\n\n` +
        `${formData.specialRequests ? `Observações: ${formData.specialRequests}\n\n` : ''}` +
        `Aguardo confirmação!`;

      // Abrir WhatsApp
      const whatsappUrl = `https://wa.me/5511952197283?text=${encodeURIComponent(message)}`;
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 500);

    } catch (error) {
      console.error("Erro ao criar reserva:", error);
      toast.error("Erro ao criar reserva. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showReview) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl">
          <button
            onClick={() => setShowReview(false)}
            className="flex items-center gap-2 text-accent hover:text-accent/80 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <Card className="p-8">
            <h2 className="text-3xl font-bold text-foreground mb-8">Resumo da Reserva</h2>

            {/* Dados do Hóspede */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-foreground mb-4">Dados do Hóspede</h3>
              <div className="bg-accent/5 rounded-lg p-6 space-y-2">
                <div><span className="text-foreground/70">Nome:</span> <span className="font-semibold">{formData.firstName} {formData.lastName}</span></div>
                <div><span className="text-foreground/70">Email:</span> <span className="font-semibold">{formData.email}</span></div>
                <div><span className="text-foreground/70">Telefone:</span> <span className="font-semibold">{formData.phone}</span></div>
                <div><span className="text-foreground/70">CPF:</span> <span className="font-semibold">{formData.cpf}</span></div>
                <div><span className="text-foreground/70">Nacionalidade:</span> <span className="font-semibold">{formData.nationality}</span></div>
              </div>
            </div>

            {/* Detalhes da Reserva */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-foreground mb-4">Detalhes da Reserva</h3>
              <div className="bg-accent/5 rounded-lg p-6 space-y-2">
                <div><span className="text-foreground/70">Quarto:</span> <span className="font-semibold">{rooms.find(r => r.id === parseInt(formData.roomId))?.name}</span></div>
                <div><span className="text-foreground/70">Check-in:</span> <span className="font-semibold">{new Date(formData.checkInDate).toLocaleDateString('pt-BR')}</span></div>
                <div><span className="text-foreground/70">Check-out:</span> <span className="font-semibold">{new Date(formData.checkOutDate).toLocaleDateString('pt-BR')}</span></div>
                <div><span className="text-foreground/70">Noites:</span> <span className="font-semibold">{priceCalculation.nights}</span></div>
                <div><span className="text-foreground/70">Hóspedes:</span> <span className="font-semibold">{formData.numberOfGuests} pessoa{parseInt(formData.numberOfGuests) > 1 ? 's' : ''}</span></div>
              </div>
            </div>

            {/* Valores */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-foreground mb-4">Valores</h3>
              <div className="bg-accent/5 rounded-lg p-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Subtotal ({priceCalculation.nights}x):</span>
                  <span className="font-semibold">R$ {(priceCalculation.subtotal / 100).toFixed(2)}</span>
                </div>
                {priceCalculation.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto (12%):</span>
                    <span className="font-semibold">-R$ {(priceCalculation.discount / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-foreground/70">Limpeza:</span>
                  <span className="font-semibold">R$ {(priceCalculation.cleaning / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg">
                  <span className="font-bold text-foreground">Total:</span>
                  <span className="font-bold text-accent">R$ {(priceCalculation.total / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <Button
                onClick={() => setShowReview(false)}
                variant="outline"
                className="flex-1"
                disabled={isSubmitting}
              >
                Voltar
              </Button>
              <Button
                onClick={handleFinalizeBooking}
                disabled={isSubmitting}
                className="flex-1 bg-accent hover:bg-opacity-90 text-white flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                {isSubmitting ? "Finalizando..." : "Enviar para WhatsApp"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-2xl">
        <Link href="/" className="flex items-center gap-2 text-accent hover:text-accent/80 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <Card className="p-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">Fazer Reserva</h1>

          {/* Seleção de Quarto */}
          <div className="mb-6">
            <Label htmlFor="roomId">Quarto *</Label>
            <Select value={formData.roomId} onValueChange={(value) => handleSelectChange('roomId', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rooms.map(room => (
                  <SelectItem key={room.id} value={room.id.toString()}>
                    {room.name} - R$ 80,00/noite
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="checkInDate">Check-in *</Label>
              <Input
                type="date"
                name="checkInDate"
                value={formData.checkInDate}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="checkOutDate">Check-out *</Label>
              <Input
                type="date"
                name="checkOutDate"
                value={formData.checkOutDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Número de Hóspedes */}
          <div className="mb-6">
            <Label htmlFor="numberOfGuests">Número de Hóspedes *</Label>
            <Select value={formData.numberOfGuests} onValueChange={(value) => handleSelectChange('numberOfGuests', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Pessoa</SelectItem>
                <SelectItem value="2">2 Pessoas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dados Pessoais */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="firstName">Primeiro Nome *</Label>
              <Input
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="João"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Sobrenome *</Label>
              <Input
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Silva"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="joao@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                placeholder="123.456.789-00"
              />
            </div>
            <div>
              <Label htmlFor="nationality">Nacionalidade *</Label>
              <Input
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                placeholder="Brasileira"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="mb-8">
            <Label htmlFor="specialRequests">Observações</Label>
            <textarea
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleInputChange}
              placeholder="Alguma solicitação especial?"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              rows={3}
            />
          </div>

          {/* Resumo de Preço */}
          <div className="mb-8 p-4 bg-accent/5 rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Subtotal ({priceCalculation.nights} noites):</span>
              <span>R$ {(priceCalculation.subtotal / 100).toFixed(2)}</span>
            </div>
            {priceCalculation.discount > 0 && (
              <div className="flex justify-between mb-2 text-green-600">
                <span>Desconto (12%):</span>
                <span>-R$ {(priceCalculation.discount / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between mb-2">
              <span>Limpeza:</span>
              <span>R$ {(priceCalculation.cleaning / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-accent">R$ {(priceCalculation.total / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Botão */}
          <Button
            onClick={handleReviewClick}
            disabled={!isFormValid}
            className="w-full bg-accent hover:bg-opacity-90 text-white py-6 text-lg"
          >
            Revisar Reserva
          </Button>
        </Card>
      </div>
    </div>
  );
}
