import React, { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

const PRICE_PER_NIGHT = 8000; // R$ 80 em centavos
const CLEANING_FEE = 2000; // R$ 20 em centavos
const DISCOUNT_PERCENTAGE = 12; // 12% de desconto para 1 hóspede

export default function Booking() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    roomId: "1",
    checkInDate: "",
    checkOutDate: "",
    numberOfGuests: "1",
    guestName: "",
    guestEmail: "",
    phone: "",
    cpf: "",
  });

  const { data: rooms = [] } = trpc.rooms.list.useQuery();
  const { data: blockedDates = [] } = trpc.blockedDates.list.useQuery({ roomId: parseInt(formData.roomId) });
  const createBookingMutation = trpc.bookings.create.useMutation();

  const pricing = useMemo(() => {
    const checkIn = formData.checkInDate ? new Date(formData.checkInDate) : null;
    const checkOut = formData.checkOutDate ? new Date(formData.checkOutDate) : null;

    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return { nights: 0, subtotal: 0, discount: 0, durationDiscount: 0, durationDiscountPercent: 0, cleaning: CLEANING_FEE, total: CLEANING_FEE };
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const subtotal = nights * PRICE_PER_NIGHT;

    // Calcular desconto por duração (7+ noites = 10%, 14+ noites = 15%)
    let durationDiscountPercent = 0;
    if (nights >= 14) {
      durationDiscountPercent = 15;
    } else if (nights >= 7) {
      durationDiscountPercent = 10;
    }
    
    // Aplicar desconto de duração sobre o subtótal
    const durationDiscount = durationDiscountPercent > 0 ? Math.floor(subtotal * durationDiscountPercent / 100) : 0;
    
    // Desconto por número de hóspedes (12%) - só aplica se não houver desconto por duração
    const guestDiscount = (formData.numberOfGuests === "1" && durationDiscountPercent === 0) ? Math.floor(subtotal * DISCOUNT_PERCENTAGE / 100) : 0;
    
    // Usar o maior desconto entre hóspede e duração
    const totalDiscount = Math.max(guestDiscount, durationDiscount);
    const total = subtotal - totalDiscount + CLEANING_FEE;

    return { nights, subtotal, discount: totalDiscount, durationDiscount, durationDiscountPercent, cleaning: CLEANING_FEE, total };
  }, [formData.checkInDate, formData.checkOutDate, formData.numberOfGuests, formData.roomId, PRICE_PER_NIGHT, rooms]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Aplicar máscara de telefone
    if (name === 'phone') {
      // Remover caracteres não-numéricos
      const onlyNumbers = value.replace(/\D/g, '');
      
      // Limitar a 20 dígitos para suportar números internacionais completos
      // Exemplos: Brasil (13), EUA (11), Alemanha (11-13), etc.
      const limited = onlyNumbers.slice(0, 20);
      
      // Se começa com 55 (Brasil), aplicar máscara brasileira
      // Se tem 11 dígitos e começa com 1 (DDD brasileiro), também aplicar máscara brasileira
      // Senão, mostrar apenas os números com +
      let formatted = limited;
      const isBrazilianWithCode = limited.startsWith('55') && limited.length >= 13;
      // Um número é brasileiro se tem 11 dígitos, começa com 1-9 e o segundo dígito é 1-9 (DDD válido 11-99)
      const isBrazilianWithoutCode = limited.length === 11 && /^[1-9][1-9]\d{9}$/.test(limited);
      
      if (isBrazilianWithCode) {
        // Máscara brasileira com código de país: +55 (XX) XXXXX-XXXX
        const brazilianPart = limited.slice(2);
        if (brazilianPart.length <= 2) {
          formatted = `+55 (${brazilianPart}`;
        } else if (brazilianPart.length <= 7) {
          formatted = `+55 (${brazilianPart.slice(0, 2)}) ${brazilianPart.slice(2)}`;
        } else {
          formatted = `+55 (${brazilianPart.slice(0, 2)}) ${brazilianPart.slice(2, 7)}-${brazilianPart.slice(7)}`;
        }
      } else if (isBrazilianWithoutCode) {
        // Máscara brasileira sem código de país: (XX) XXXXX-XXXX
        formatted = `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
      } else if (limited.length > 0) {
        // Para números internacionais, mostrar com + no início
        formatted = `+${limited}`;
      }
      
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Verificar se a data está bloqueada
  // Funcao para normalizar data sem timezone (apenas YYYY-MM-DD)
  const normalizeDate = (dateStr: string | Date): Date => {
    if (typeof dateStr === 'string') {
      // Extrair apenas a parte da data (suporta ISO, YYYY-MM-DD, e MySQL YYYY-MM-DD HH:mm:ss)
      let dateOnly = dateStr;
      if (dateStr.includes('T')) {
        dateOnly = dateStr.split('T')[0];
      } else if (dateStr.includes(' ')) {
        dateOnly = dateStr.split(' ')[0];
      }
      
      const [year, month, day] = dateOnly.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return dateStr;
  };

  const isDateBlocked = (date: string): boolean => {
    if (!date) return false;
    const normalizedDate = normalizeDate(date);
    return blockedDates.some(bd => {
      const blockedStart = normalizeDate(bd.startDate);
      const blockedEnd = normalizeDate(bd.endDate);
      return normalizedDate >= blockedStart && normalizedDate <= blockedEnd;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!formData.checkInDate || !formData.checkOutDate) {
      alert("Por favor, selecione as datas de check-in e check-out");
      return;
    }

    if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
      alert("Data de check-out deve ser após check-in");
      return;
    }

    if (!formData.guestName.trim()) {
      alert("Por favor, digite seu nome");
      return;
    }

    if (!formData.guestEmail.trim()) {
      alert("Por favor, digite seu email");
      return;
    }

    if (!formData.phone.trim()) {
      alert("Por favor, digite seu telefone");
      return;
    }

    if (!formData.cpf.trim()) {
      alert("Por favor, digite seu CPF");
      return;
    }

    // Verificar disponibilidade usando fetch direto
    const response = await fetch('/api/trpc/rooms.checkAvailability?input=' + encodeURIComponent(JSON.stringify({
      roomId: parseInt(formData.roomId),
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
    })));
    const result = await response.json();
    const availability = result.result?.data || { available: false };

    if (!availability?.available) {
      alert("Quarto não disponível para essas datas");
      return;
    }

    // Criar reserva
    try {
      const booking = await createBookingMutation.mutateAsync({
        roomId: parseInt(formData.roomId),
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        numberOfGuests: formData.numberOfGuests,
        firstName: formData.guestName.split(' ')[0],
        lastName: formData.guestName.split(' ').slice(1).join(' '),
        email: formData.guestEmail,
        phone: formData.phone,
        cpf: formData.cpf,
        totalPrice: pricing.total,
        checkInTime: '14:00',
        checkOutTime: '12:00',
      });

      // Redirecionar para página de confirmação
      setLocation(`/booking-confirmation/${booking.id}`);
    } catch (error) {
      console.error("Erro ao criar reserva:", error);
      alert("Erro ao criar reserva. Tente novamente.");
    }
  };

  const handleSendWhatsApp = () => {
    const message = `
*Olá ${formData.guestName}!*

Aqui está o resumo da sua reserva:

*Detalhes da Reserva:*
📅 Check-in: ${formData.checkInDate}
📅 Check-out: ${formData.checkOutDate}
🛏️ Quarto: ${rooms.find(r => r.id === parseInt(formData.roomId))?.name || 'N/A'}
👥 Hóspedes: ${formData.numberOfGuests}
💰 Total: R$ ${(pricing.total / 100).toFixed(2)}

*Contato:*
📧 Email: ${formData.guestEmail}
📱 Telefone: ${formData.phone}

Obrigado por escolher o Hostel Bryan Tatuapé! 🙏
    `.trim();

    const phoneNumber = '5511952197283';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const selectedRoom = rooms.find(r => r.id === parseInt(formData.roomId));
  const roomPrice = selectedRoom ? selectedRoom.pricePerNight : PRICE_PER_NIGHT;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">Fazer Reserva</h1>
        <p className="text-center text-gray-600 mb-8">
          Preencha o formulário abaixo para reservar seu quarto
        </p>

        <Card className="p-8">
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
                      <div>
                        <div>{room.name} - R$ {(room.pricePerNight / 100).toFixed(2)}/noite</div>
                        <div className="text-xs text-gray-500">{room.type}</div>
                      </div>
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
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'hóspede' : 'hóspedes'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dados Pessoais */}
            <div>
              <Label htmlFor="guestName">Nome *</Label>
              <Input
                name="guestName"
                value={formData.guestName}
                onChange={handleInputChange}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div>
              <Label htmlFor="guestEmail">Email *</Label>
              <Input
                type="email"
                name="guestEmail"
                value={formData.guestEmail}
                onChange={handleInputChange}
                placeholder="seu@email.com"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>

            {/* Resumo de Preços */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Diárias ({pricing.nights} noites):</span>
                <span>R$ {(pricing.subtotal / 100).toFixed(2)}</span>
              </div>
              {pricing.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto ({pricing.durationDiscountPercent}%):</span>
                  <span>-R$ {(pricing.discount / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxa de limpeza:</span>
                <span>R$ {(pricing.cleaning / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>R$ {(pricing.total / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={createBookingMutation.isPending}
              >
                {createBookingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando reserva...
                  </>
                ) : (
                  'Confirmar Reserva'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendWhatsApp}
                className="flex-1"
              >
                Enviar por WhatsApp
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
