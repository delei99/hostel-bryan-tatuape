import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Users, DollarSign } from "lucide-react";
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

  // Validar formulário
  const isFormValid = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.includes("@") &&
      isValidDateRange() &&
      formData.numberOfGuests > 0
    );
  };

  // Enviar reserva
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Por favor, preencha todos os campos corretamente");
      return;
    }

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
          <Link href="/">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Home
            </Button>
          </Link>

          <Card className="p-12 text-center bg-gradient-to-br from-accent/10 to-secondary/10">
            <div className="mb-6">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">✓</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Reserva Confirmada!</h2>
            <p className="text-foreground/70 mb-8">
              Sua reserva foi criada com sucesso. Um email de confirmação foi enviado para {formData.email}.
            </p>
            <div className="bg-white rounded-lg p-6 mb-8 border-2 border-accent">
              <p className="text-foreground/70 mb-2">Código de Confirmação</p>
              <p className="text-3xl font-bold text-accent">{confirmationCode}</p>
            </div>
            <p className="text-foreground/70 mb-8">
              Guarde este código para referência futura. Você pode entrar em contato conosco usando este código.
            </p>
            <Link href="/">
              <Button size="lg" className="bg-accent hover:bg-opacity-90">
                Voltar para Home
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Home
          </Button>
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Fazer Reserva</h1>
          <p className="text-foreground/70">Preencha o formulário abaixo para reservar seu quarto no Hostel Bryan Tatuapé</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Seção: Dados Pessoais */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Dados Pessoais</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Seu nome"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Sobrenome *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Seu sobrenome"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Contato */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Contato</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seu.email@exemplo.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(11) 98765-4321"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Informações Adicionais */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Informações Adicionais</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationality">Nacionalidade</Label>
                      <Input
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        placeholder="Brasileira"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Hospedagem */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Detalhes da Hospedagem</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="roomId">Tipo de Quarto *</Label>
                      <Select
                        value={formData.roomId.toString()}
                        onValueChange={(value) => setFormData({ ...formData, roomId: parseInt(value) })}
                      >
                        <SelectTrigger id="roomId" className="w-full">
                          <SelectValue placeholder="Selecione um quarto" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomsLoading ? (
                            <div className="p-2 text-foreground/70">Carregando quartos...</div>
                          ) : rooms && rooms.length > 0 ? (
                            rooms.map((room) => (
                              <SelectItem key={room.id} value={room.id.toString()}>
                                {room.name} - R$ {(room.pricePerNight / 100).toFixed(2)}/noite
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-foreground/70">Nenhum quarto disponível</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

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

                {/* Seção: Tipo de Diária */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Tipo de Diária</h3>
                  <div className="space-y-3">
                    <label className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.dailyType === "couple"
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent"
                    }`}>
                      <input
                        type="radio"
                        name="dailyType"
                        value="couple"
                        checked={formData.dailyType === "couple"}
                        onChange={(e) => setFormData({ ...formData, dailyType: e.target.value as "couple" | "individual" })}
                        className="mr-3"
                      />
                      <span className="font-semibold text-foreground">Diária de Casal</span>
                      <p className="text-sm text-foreground/70 mt-1">Preço normal para 2 ou mais pessoas</p>
                    </label>
                    
                    <label className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.dailyType === "individual"
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent"
                    }`}>
                      <input
                        type="radio"
                        name="dailyType"
                        value="individual"
                        checked={formData.dailyType === "individual"}
                        onChange={(e) => setFormData({ ...formData, dailyType: e.target.value as "couple" | "individual" })}
                        className="mr-3"
                      />
                      <span className="font-semibold text-foreground">Diária Individual</span>
                      <p className="text-sm text-accent font-semibold">Desconto de 12% para uma pessoa</p>
                      <p className="text-sm text-foreground/70 mt-1">Aplica-se automaticamente quando há apenas 1 hóspede</p>
                    </label>
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
                      placeholder="Algum pedido especial? (ex: cama de casal, andar alto)"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Seção: Pagamento */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Método de Pagamento</h3>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={formData.paymentMethod === "cash"}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="mr-3"
                      />
                      <span className="text-foreground">Dinheiro (no local)</span>
                    </label>
                    <label className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === "card"}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="mr-3"
                      />
                      <span className="text-foreground">Cartão de Crédito</span>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-accent hover:bg-opacity-90 text-white"
                  disabled={isSubmitting || !isFormValid()}
                >
                  {isSubmitting ? "Processando..." : "Confirmar Reserva"}
                </Button>
              </form>
            </Card>
          </div>

          {/* Resumo da Reserva */}
          <div>
            <Card className="p-6 sticky top-24 bg-gradient-to-br from-accent/10 to-secondary/10">
              <h3 className="text-xl font-bold text-foreground mb-6">Resumo da Reserva</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-foreground/70 mb-1">Quarto</p>
                  <p className="font-semibold text-foreground">
                    {rooms?.find(r => r.id === formData.roomId)?.name || "Selecionando..."}
                  </p>
                  {rooms?.find(r => r.id === formData.roomId)?.imageUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden h-32 bg-gray-200">
                      <img
                        src={rooms.find(r => r.id === formData.roomId)?.imageUrl || ""}
                        alt="Foto do quarto"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-foreground/70">
                  <Calendar className="w-4 h-4" />
                  <div>
                    <p className="text-sm">
                      {new Date(formData.checkInDate).toLocaleDateString('pt-BR')} até{" "}
                      {new Date(formData.checkOutDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-foreground/70">
                  <Users className="w-4 h-4" />
                  <p className="text-sm">{formData.numberOfGuests} {formData.numberOfGuests === 1 ? "hóspede" : "hóspedes"}</p>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-foreground/70">
                    <span>Diária</span>
                    <span>
                      R$ {rooms?.find(r => r.id === formData.roomId)?.pricePerNight ? 
                        (rooms.find(r => r.id === formData.roomId)!.pricePerNight / 100).toFixed(2) : 
                        "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between text-foreground/70">
                    <span>Noites</span>
                    <span>
                      {priceCalculation.nights}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-foreground">
                    <span>Subtotal</span>
                    <span>R$ {(subtotal / 100).toFixed(2)}</span>
                  </div>
                </div>

                {discountAmount > 0 && (
                  <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-200">
                    <div className="flex justify-between text-green-700">
                      <span className="font-semibold">Desconto 12% (1 pessoa)</span>
                      <span>-R$ {(discountAmount / 100).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-6 border-t border-border pt-4">
                  <div className="flex justify-between text-foreground/70">
                    <span>Limpeza</span>
                    <span>R$ {(CLEANING_FEE / 100).toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-accent">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-semibold">Total</span>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-accent" />
                      <span className="text-2xl font-bold text-accent">
                        {(totalPrice / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
