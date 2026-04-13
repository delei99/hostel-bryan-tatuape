import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Users, DollarSign, MessageCircle } from "lucide-react";
import { Link } from "wouter";

/**
 * Página de reserva com formulário elegante
 * Permite seleção de quarto, datas, hóspedes e cálculo automático de preço
 */
export default function Booking() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cpf: "",
    nationality: "",
    roomId: 1,
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    numberOfGuests: 1,
    dailyType: "individual" as "couple" | "individual",
    specialRequests: "",
    paymentMethod: "cash",
  });

  // Constantes
  const CLEANING_FEE = 700; // R$ 7,00 em centavos
  const DISCOUNT_PERCENTAGE = 12; // 12% de desconto para uma pessoa

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  // Buscar quartos disponíveis
  const { data: rooms, isLoading: roomsLoading } = trpc.rooms.list.useQuery();

  // Criar reserva
  const createBooking = trpc.bookings.create.useMutation();

  // Calcular preço total com desconto e limpeza
  const priceCalculation = useMemo(() => {
    if (!rooms || !formData.checkInDate || !formData.checkOutDate) {
      return { subtotal: 0, discountAmount: 0, totalPrice: 0, nights: 0 };
    }
    
    const room = rooms.find(r => r.id === formData.roomId);
    if (!room) return { subtotal: 0, discountAmount: 0, totalPrice: 0, nights: 0 };
    
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    const subtotal = Math.max(0, nights) * room.pricePerNight;
    // Desconto de 12% apenas para 1 pessoa
    const discountAmount = formData.numberOfGuests === 1 ? Math.floor(subtotal * (DISCOUNT_PERCENTAGE / 100)) : 0;
    const totalPrice = subtotal - discountAmount + CLEANING_FEE;
    
    return { subtotal, discountAmount, totalPrice, nights };
  }, [rooms, formData.checkInDate, formData.checkOutDate, formData.roomId, formData.numberOfGuests]);

  const { subtotal, discountAmount, totalPrice } = priceCalculation;

  // Validar datas
  const isValidDateRange = () => {
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    return checkOut > checkIn;
  };

  // Validar formulário - TODOS OS CAMPOS OBRIGATÓRIOS
  const isFormValid = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.includes("@") &&
      formData.phone.trim() &&
      formData.cpf.trim() &&
      formData.nationality.trim() &&
      formData.roomId > 0 &&
      isValidDateRange() &&
      formData.numberOfGuests > 0
    );
  };

  // Enviar reserva - mostra página de revisão
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Por favor, preencha todos os campos corretamente");
      return;
    }

    // Mostrar página de revisão
    setShowReview(true);
  };

  // Finalizar reserva
  const handleFinalizeBooking = async () => {
    setIsSubmitting(true);

    try {
      const result = await createBooking.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf,
        nationality: formData.nationality,
        roomId: formData.roomId,
        checkInDate: new Date(formData.checkInDate),
        checkOutDate: new Date(formData.checkOutDate),
        numberOfGuests: formData.numberOfGuests,
        dailyType: formData.dailyType,
        subtotal,
        discountPercentage: formData.numberOfGuests === 1 ? DISCOUNT_PERCENTAGE : 0,
        discountAmount,
        cleaningFee: CLEANING_FEE,
        totalPrice,
        specialRequests: formData.specialRequests,
        paymentMethod: formData.paymentMethod,
      });

      setConfirmationCode(result.confirmationCode);
      setShowReview(false);
      toast.success("Reserva criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar reserva. Tente novamente.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tela de confirmação
  if (confirmationCode) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Reserva Confirmada!</h2>
              <p className="text-foreground/70">Sua reserva foi criada com sucesso</p>
            </div>

            <div className="bg-accent/10 rounded-lg p-6 mb-6">
              <p className="text-sm text-foreground/70 mb-2">Código de Confirmação</p>
              <p className="text-2xl font-bold text-accent font-mono">{confirmationCode}</p>
            </div>

            <p className="text-foreground/70 mb-8">
              Um e-mail de confirmação foi enviado para <strong>{formData.email}</strong>
            </p>

            <Link href="/">
              <Button className="w-full bg-accent hover:bg-opacity-90 text-white">
                Voltar para Home
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // Página de Resumo
  if (showReview) {
    const room = rooms?.find(r => r.id === formData.roomId);
    const checkInDate = new Date(formData.checkInDate);
    const checkOutDate = new Date(formData.checkOutDate);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Gerar mensagem WhatsApp
    const whatsappMessage = `Olá! Gostaria de confirmar minha reserva no Hostel Bryan Tatuapé:\n\n` +
      `*Dados do Hóspede:*\n` +
      `Nome: ${formData.firstName} ${formData.lastName}\n` +
      `Email: ${formData.email}\n` +
      `Telefone: ${formData.phone}\n` +
      `CPF: ${formData.cpf}\n\n` +
      `*Detalhes da Reserva:*\n` +
      `Quarto: ${room?.name}\n` +
      `Check-in: ${checkInDate.toLocaleDateString('pt-BR')}\n` +
      `Check-out: ${checkOutDate.toLocaleDateString('pt-BR')}\n` +
      `Noites: ${nights}\n` +
      `Hóspedes: ${formData.numberOfGuests} pessoa${formData.numberOfGuests > 1 ? 's' : ''}\n\n` +
      `*Valores:*\n` +
      `Subtotal: R$ ${(subtotal / 100).toFixed(2)}\n` +
      `${discountAmount > 0 ? `Desconto (12%): -R$ ${(discountAmount / 100).toFixed(2)}\n` : ''}` +
      `Limpeza: R$ ${(CLEANING_FEE / 100).toFixed(2)}\n` +
      `*Total: R$ ${(totalPrice / 100).toFixed(2)}*\n\n` +
      `${formData.specialRequests ? `Observações: ${formData.specialRequests}\n\n` : ''}` +
      `Aguardo confirmação!`;

    const whatsappUrl = `https://wa.me/5511952197283?text=${encodeURIComponent(whatsappMessage)}`;

    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl">
          <button
            onClick={() => setShowReview(false)}
            className="flex items-center gap-2 text-accent hover:text-accent/80 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <Card className="p-8">
            <h2 className="text-3xl font-bold text-foreground mb-8">Resumo da Reserva</h2>

            {/* Dados do Hóspede */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-foreground mb-4">Dados do Hóspede</h3>
              <div className="bg-accent/5 rounded-lg p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Nome:</span>
                  <span className="font-semibold text-foreground">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Email:</span>
                  <span className="font-semibold text-foreground">{formData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Telefone:</span>
                  <span className="font-semibold text-foreground">{formData.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">CPF:</span>
                  <span className="font-semibold text-foreground">{formData.cpf}</span>
                </div>
              </div>
            </div>

            {/* Detalhes da Reserva */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-foreground mb-4">Detalhes da Reserva</h3>
              <div className="bg-accent/5 rounded-lg p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Quarto:</span>
                  <span className="font-semibold text-foreground">{room?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Check-in:</span>
                  <span className="font-semibold text-foreground">{checkInDate.toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Check-out:</span>
                  <span className="font-semibold text-foreground">{checkOutDate.toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Noites:</span>
                  <span className="font-semibold text-foreground">{nights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Hóspedes:</span>
                  <span className="font-semibold text-foreground">{formData.numberOfGuests} pessoa{formData.numberOfGuests > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Valores */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-foreground mb-4">Valores</h3>
              <div className="bg-accent/5 rounded-lg p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Subtotal ({nights}x):</span>
                  <span className="font-semibold text-foreground">R$ {(subtotal / 100).toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-accent">
                    <span className="text-foreground/70">Desconto (12%):</span>
                    <span className="font-semibold">-R$ {(discountAmount / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-foreground/70">Limpeza:</span>
                  <span className="font-semibold text-foreground">R$ {(CLEANING_FEE / 100).toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="text-lg font-bold text-foreground">Total:</span>
                  <span className="text-lg font-bold text-accent">R$ {(totalPrice / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <Button
                onClick={() => setShowReview(false)}
                variant="outline"
                className="flex-1"
              >
                Editar Reserva
              </Button>
              <Button
                onClick={async () => {
                  await handleFinalizeBooking();
                  if (confirmationCode) {
                    setTimeout(() => {
                      window.open(whatsappUrl, '_blank');
                    }, 500);
                  }
                }}
                disabled={isSubmitting}
                className="flex-1 bg-accent hover:bg-opacity-90 text-white flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                {isSubmitting ? "Finalizando..." : "Finalizar e Enviar WhatsApp"}
              </Button>
              
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Formulário de Reserva
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl">
        <Link href="/">
          <button className="flex items-center gap-2 text-accent hover:text-accent/80 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </Link>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="md:col-span-2">
            <Card className="p-8">
              <h1 className="text-4xl font-bold text-foreground mb-8">Fazer Reserva</h1>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Seção: Dados Pessoais */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Dados Pessoais *</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Sobrenome *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Contato */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Contato *</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Documentos */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Documentos *</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationality">Nacionalidade *</Label>
                      <Input
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        placeholder="Ex: Brasileira"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Acomodação */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Acomodação *</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="roomId">Quarto *</Label>
                      <Select
                        value={formData.roomId.toString()}
                        onValueChange={(value) => setFormData({ ...formData, roomId: parseInt(value) })}
                      >
                        <SelectTrigger id="roomId" className="w-full">
                          <SelectValue placeholder="Selecione um quarto" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomsLoading ? (
                            <SelectItem value="0" disabled>Carregando quartos...</SelectItem>
                          ) : (
                            rooms?.map(room => (
                              <SelectItem key={room.id} value={room.id.toString()}>
                                {room.name} - R$ {(room.pricePerNight / 100).toFixed(2)}/noite
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="numberOfGuests">Número de Hóspedes *</Label>
                      <Select
                        value={formData.numberOfGuests.toString()}
                        onValueChange={(value) => setFormData({ ...formData, numberOfGuests: parseInt(value) })}
                      >
                        <SelectTrigger id="numberOfGuests" className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Pessoa</SelectItem>
                          <SelectItem value="2">2 Pessoas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Seção: Datas */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Datas *</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="checkInDate">Check-in *</Label>
                      <Input
                        id="checkInDate"
                        type="date"
                        value={formData.checkInDate}
                        onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkOutDate">Check-out *</Label>
                      <Input
                        id="checkOutDate"
                        type="date"
                        value={formData.checkOutDate}
                        onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Pedidos Especiais */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Pedidos Especiais</h3>
                  <div>
                    <Label htmlFor="specialRequests">Observações</Label>
                    <textarea
                      id="specialRequests"
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      placeholder="Deixe aqui qualquer observação importante..."
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Botão Enviar */}
                <Button
                  type="submit"
                  disabled={!isFormValid() || isSubmitting}
                  className="w-full bg-accent hover:bg-opacity-90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Processando..." : "Revisar Reserva"}
                </Button>
              </form>
            </Card>
          </div>

          {/* Resumo Lateral */}
          <div>
            <Card className="p-6 sticky top-8">
              <h3 className="text-lg font-bold text-foreground mb-6">Resumo</h3>
              
              {rooms && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-foreground/70 mb-1">Quarto</p>
                    <p className="font-semibold text-foreground">{rooms.find(r => r.id === formData.roomId)?.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-foreground/70 mb-1">Período</p>
                    <p className="font-semibold text-foreground">
                      {new Date(formData.checkInDate).toLocaleDateString('pt-BR')} - {new Date(formData.checkOutDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-foreground/70">Subtotal:</span>
                      <span className="font-semibold">R$ {(subtotal / 100).toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between mb-2 text-accent">
                        <span className="text-foreground/70">Desconto (12%):</span>
                        <span className="font-semibold">-R$ {(discountAmount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between mb-4">
                      <span className="text-foreground/70">Limpeza:</span>
                      <span className="font-semibold">R$ {(CLEANING_FEE / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-4">
                      <span className="font-bold text-foreground">Total:</span>
                      <span className="text-lg font-bold text-accent">R$ {(totalPrice / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
