import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, MessageCircle, CheckCircle } from "lucide-react";
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  // Buscar quartos
  const { data: rooms = [] } = trpc.rooms.list.useQuery();
  const createBooking = trpc.bookings.create.useMutation();

  // Constantes
  const PRICE_PER_NIGHT = 8000;
  const CLEANING_FEE = 700;
  const DISCOUNT_PERCENTAGE = 12;

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

  // Validação simples
  const canSubmit = () => {
    return (
      formData.firstName.trim() !== "" &&
      formData.lastName.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.phone.trim() !== "" &&
      formData.cpf.trim() !== "" &&
      formData.nationality.trim() !== "" &&
      formData.checkInDate !== "" &&
      formData.checkOutDate !== ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit()) {
      toast.error("Por favor, preencha todos os campos!");
      return;
    }

    try {
      setIsSubmitting(true);
      const roomId = parseInt(formData.roomId);
      const numberOfGuests = parseInt(formData.numberOfGuests);
      
      const result = await createBooking.mutateAsync({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        cpf: formData.cpf.trim(),
        nationality: formData.nationality.trim(),
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
        specialRequests: formData.specialRequests.trim(),
      });

      toast.success("Reserva criada com sucesso!");
      setBookingSuccess({
        ...result,
        roomId,
        numberOfGuests,
      });

    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao criar reserva. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!bookingSuccess) return;

    const room = rooms.find(r => r.id === bookingSuccess.roomId);
    const numberOfGuests = bookingSuccess.numberOfGuests;
    
    const message = `*Reserva Confirmada - Hostel Bryan Tatuapé*\n\n` +
      `*Código: ${bookingSuccess.confirmationCode}*\n\n` +
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

    const whatsappUrl = `https://wa.me/5511952197283?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Reserva Confirmada!</h1>
              <p className="text-lg text-muted-foreground mb-4">
                Código: <span className="font-bold text-accent">{bookingSuccess.confirmationCode}</span>
              </p>
            </div>

            <div className="bg-accent/5 p-4 rounded-lg mb-6">
              <p className="text-foreground mb-4">
                Clique no botão abaixo para enviar a confirmação para o WhatsApp
              </p>
              <Button
                onClick={handleSendWhatsApp}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Enviar para WhatsApp
              </Button>
            </div>

            <Link href="/" className="text-accent hover:text-accent/80">
              Voltar para Home
            </Link>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Quarto */}
            <div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkInDate">Check-in *</Label>
                <Input
                  type="date"
                  name="checkInDate"
                  value={formData.checkInDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="checkOutDate">Check-out *</Label>
                <Input
                  type="date"
                  name="checkOutDate"
                  value={formData.checkOutDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Número de Hóspedes */}
            <div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Primeiro Nome *</Label>
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="João"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Silva"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="joao@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  placeholder="123.456.789-00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="nationality">Nacionalidade *</Label>
                <Input
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  placeholder="Brasileira"
                  required
                />
              </div>
            </div>

            {/* Observações */}
            <div>
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
            <div className="p-4 bg-accent/5 rounded-lg">
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
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-opacity-90 text-white py-6 text-lg flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              {isSubmitting ? "Finalizando..." : "Finalizar Reserva"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
