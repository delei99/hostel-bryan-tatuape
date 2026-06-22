import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, MessageCircle, CheckCircle, Copy } from "lucide-react";
import { Link, useLocation } from "wouter";
import React from "react";

export default function Booking() {
  // Obter roomId da URL se fornecido
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const roomIdFromUrl = urlParams.get('roomId');
  
  // Funcao para obter data local sem timezone
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Validar CPF
  const validateCPF = (cpf: string) => {
    const cleaned = cpf.replace(/[^0-9]/g, '');
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleaned)) return false;
    let sum = 0;
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
    return true;
  };

  // Validar RG
  const validateRG = (rg: string) => {
    const cleaned = rg.replace(/[^0-9]/g, '');
    return cleaned.length >= 7 && cleaned.length <= 9;
  };

  // Validar Passaporte
  const validatePassport = (passport: string) => {
    const cleaned = passport.replace(/[^a-zA-Z0-9]/g, '');
    return cleaned.length >= 6 && cleaned.length <= 9;
  };

  // Formatar CPF com máscara (000.000.000-00)
  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/[^0-9]/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  };

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cpf: "",
    nationality: "",
    documentType: "rg",
    documentNumber: "",
    documentUF: "SP",
    documentNumberPassport: "",
    roomId: roomIdFromUrl || "1",
    checkInDate: getLocalDateString(today),
    checkOutDate: getLocalDateString(tomorrow),
    checkInTime: "14:00",
    checkOutTime: "12:00",
    numberOfGuests: "1",
    specialRequests: "",
    paymentAtBooking: 0, // Pagamento no ato da reserva (em centavos)
  });

  const [paymentAtBooking, setPaymentAtBooking] = useState(0); // Pagamento no ato da reserva (em centavos)

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [reservationId, setReservationId] = useState<number | null>(null);

  
  // Atualizar roomId se vier da URL
  React.useEffect(() => {
    if (roomIdFromUrl && roomIdFromUrl !== formData.roomId) {
      setFormData(prev => ({ ...prev, roomId: roomIdFromUrl }));
    }
  }, [roomIdFromUrl]);

  // Buscar quartos
  const { data: rooms = [] } = trpc.rooms.list.useQuery();
  
  // Buscar datas bloqueadas
  const { data: blockedDates = [] } = trpc.blockedDates.list.useQuery(
    { roomId: parseInt(formData.roomId) },
    { enabled: !!formData.roomId }
  );

  // Estado para armazenar exceções
  // Nota: Exceções são gerenciáveis apenas na página admin
  // Na página de reserva, usamos apenas os bloqueios diretos
  const allExceptions: Array<{ exceptionDate: Date; blockedDateId: number }> = [];
  
  const createBooking = trpc.bookings.create.useMutation();

  // Obter o preço vigente do quarto selecionado
  const selectedRoom = rooms.find(r => r.id === parseInt(formData.roomId));
  const PRICE_PER_NIGHT = selectedRoom?.pricePerNight || 8000; // Usar preço vigente ou padrão
  const CLEANING_FEE = selectedRoom?.cleaningFee || 700; // Usar taxa de limpeza do banco ou padrão (R$ 7,00)
  const DISCOUNT_PERCENTAGE = 12;
  const DISCOUNT_7_DAYS = selectedRoom?.discount7Days || 8; // % de desconto para 7+ dias
  const DISCOUNT_15_DAYS = selectedRoom?.discount15Days || 16; // % de desconto para 15+ dias
  const DISCOUNT_30_DAYS = selectedRoom?.discount30Days || 45; // % de desconto para 30+ dias

  // Calcular preço com desconto por duração
  const priceCalculation = useMemo(() => {
    // Parse datas sem timezone issues
    const [inYear, inMonth, inDay] = formData.checkInDate.split('-').map(Number);
    const [outYear, outMonth, outDay] = formData.checkOutDate.split('-').map(Number);
    const checkIn = new Date(inYear, inMonth - 1, inDay);
    const checkOut = new Date(outYear, outMonth - 1, outDay);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return { nights: 0, subtotal: 0, discount: 0, durationDiscount: 0, durationDiscountPercent: 0, cleaning: CLEANING_FEE, total: 0 };

    const subtotal = nights * PRICE_PER_NIGHT;
    
    // Desconto por duração da reserva (tem prioridade)
    let durationDiscountPercent = 0;
    if (nights >= 30) {
      durationDiscountPercent = DISCOUNT_30_DAYS; // Desconto para 30+ dias (dinâmico)
    } else if (nights >= 15) {
      durationDiscountPercent = DISCOUNT_15_DAYS; // Desconto para 15+ dias (dinâmico)
    } else if (nights >= 7) {
      durationDiscountPercent = DISCOUNT_7_DAYS; // Desconto para 7+ dias (dinâmico)
    }
    
    // Aplicar desconto de duração sobre o subtótal
    const durationDiscount = durationDiscountPercent > 0 ? Math.floor(subtotal * durationDiscountPercent / 100) : 0;
    
    // Desconto por número de hóspedes (12%) - só aplica se não houver desconto por duração
    const guestDiscount = (formData.numberOfGuests === "1" && durationDiscountPercent === 0) ? Math.floor(subtotal * DISCOUNT_PERCENTAGE / 100) : 0;
    
    // Usar o maior desconto entre hóspede e duração
    const totalDiscount = Math.max(guestDiscount, durationDiscount);
    const total = subtotal - totalDiscount + CLEANING_FEE;

    return { nights, subtotal, discount: totalDiscount, durationDiscount, durationDiscountPercent, cleaning: CLEANING_FEE, total };
  }, [formData.checkInDate, formData.checkOutDate, formData.numberOfGuests, formData.roomId, PRICE_PER_NIGHT, CLEANING_FEE, DISCOUNT_7_DAYS, DISCOUNT_15_DAYS, DISCOUNT_30_DAYS, rooms]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    
    // Aplicar máscara de CPF
    if (name === "cpf") {
      value = formatCPF(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
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
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        console.error('[Booking] Invalid date format:', dateStr);
        return new Date();
      }
      return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }
    // Se for Date object (vindo do backend como ISO string), usar UTC getters
    const d = new Date(dateStr);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  };

  const isDateBlocked = (checkInStr: string, checkOutStr: string) => {
    const checkIn = normalizeDate(checkInStr);
    const checkOut = normalizeDate(checkOutStr);
    
    // Verificar cada período bloqueado
    for (const blocked of blockedDates) {
      const blockedStart = normalizeDate(blocked.startDate);
      const blockedEnd = normalizeDate(blocked.endDate);
      
      // Verificar se há conflito de datas
      // Conflito ocorre se: checkIn < blockedEnd && checkOut > blockedStart
      // Nota: checkOut nao bloqueia (hospede sai naquele dia)
      if (checkIn < blockedEnd && checkOut > blockedStart) {
        // Ha conflito - esta bloqueado
        return true;
      }
    }

    return false; // Nenhum período bloqueado ou todas as datas têm exceções
  };

  // Validação simples
  const canSubmit = () => {
    const isBlocked = isDateBlocked(formData.checkInDate, formData.checkOutDate);
    const cpfValid = validateCPF(formData.cpf);
    
    // RG e Passaporte são opcionais, mas se preenchidos devem ser válidos
    const rgValid = formData.documentNumber.trim() === "" || validateRG(formData.documentNumber);
    const passportValid = (formData.documentNumberPassport || "").trim() === "" || validatePassport(formData.documentNumberPassport || "");
    
    return (
      !isBlocked &&
      formData.firstName.trim() !== "" &&
      formData.lastName.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.phone.trim() !== "" &&
      cpfValid &&
      formData.nationality.trim() !== "" &&
      rgValid &&
      passportValid &&
      formData.checkInDate !== "" &&
      formData.checkOutDate !== ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit()) {
      if (isDateBlocked(formData.checkInDate, formData.checkOutDate)) {
        toast.error("Desculpe, essas datas estão bloqueadas. Escolha outras datas.");
      } else if (!validateCPF(formData.cpf)) {
        toast.error("CPF inválido. Verifique o número digitado.");
      } else if (formData.documentNumber.trim() !== "" && !validateRG(formData.documentNumber)) {
        toast.error("RG inválido. Deve ter entre 7 e 9 dígitos.");
      } else if ((formData.documentNumberPassport || "").trim() !== "" && !validatePassport(formData.documentNumberPassport || "")) {
        toast.error("Passaporte inválido. Deve ter entre 6 e 9 caracteres alfanuméricos.");
      } else {
        toast.error("Por favor, preencha todos os campos corretamente!");
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const roomId = parseInt(formData.roomId);
      const numberOfGuests = parseInt(formData.numberOfGuests);
      
      // Manter datas como strings (YYYY-MM-DD)
      const checkInDate = formData.checkInDate;
      const checkOutDate = formData.checkOutDate;
      
      console.log('Price Calculation:', priceCalculation);
      console.log('Total Price:', priceCalculation.total);
      
      // Garantir que finalTotal sempre é um número válido
      let finalTotal = priceCalculation.total;
      if (!Number.isFinite(finalTotal) || finalTotal <= 0) {
        finalTotal = priceCalculation.subtotal - priceCalculation.discount + CLEANING_FEE;
      }
      
      // Validação final do total
      if (!Number.isFinite(finalTotal) || finalTotal <= 0) {
        throw new Error(`Erro no calculo de preco. Total: ${finalTotal}, Subtotal: ${priceCalculation.subtotal}, Discount: ${priceCalculation.discount}`);
      }
      
      console.log('Final Total Calculation:', {
        priceCalculation,
        finalTotal,
        isFinite: Number.isFinite(finalTotal)
      });
      
      const result = await createBooking.mutateAsync({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        cpf: formData.cpf.trim(),
        nationality: formData.nationality.trim(),
        roomId,
        checkInDate,
        checkOutDate,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        numberOfGuests: numberOfGuests.toString(),
        dailyType: numberOfGuests === 1 ? "individual" : "couple",
        subtotal: priceCalculation.subtotal,
        discountPercentage: numberOfGuests === 1 ? DISCOUNT_PERCENTAGE : 0,
        discountAmount: priceCalculation.discount,
        cleaningFee: CLEANING_FEE,
        totalPrice: finalTotal,
        specialRequests: formData.specialRequests.trim(),
        documentType: formData.documentType as "rg" | "passport",
        documentNumber: formData.documentNumber.trim(),
      });

      toast.success("Reserva criada com sucesso!");
      setBookingSuccess({
        ...result,
        roomId,
        numberOfGuests: numberOfGuests.toString(),
      });

    } catch (error) {
      console.error("Erro ao criar reserva:", error);
      const errorMessage = (error as any)?.message || (error as any)?.data?.zodError?.fieldErrors || "Erro ao criar reserva. Tente novamente.";
      toast.error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };


  const generateMessage = () => {
    if (!bookingSuccess) return "";
    
    const room = rooms.find(r => r.id === bookingSuccess.roomId);
    const numberOfGuests = bookingSuccess.numberOfGuests;
    
    // Usar strings YYYY-MM-DD para evitar problemas de timezone
    const [checkInYear, checkInMonth, checkInDay] = formData.checkInDate.split('-').map(Number);
    const [checkOutYear, checkOutMonth, checkOutDay] = formData.checkOutDate.split('-').map(Number);
    const checkInDate = new Date(checkInYear, checkInMonth - 1, checkInDay);
    const checkOutDate = new Date(checkOutYear, checkOutMonth - 1, checkOutDay);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Garantir que bookingSuccess.id existe
    const bookingNumber = bookingSuccess?.id ?? bookingSuccess?.bookingId ?? '(não informado)';
    console.log('DEBUG: bookingSuccess =', bookingSuccess);
    console.log('DEBUG: bookingNumber =', bookingNumber);
    
    return `*Reserva Confirmada - Hostel Bryan Tatuapé*\n\n` +
      `*Número da Reserva: ${bookingNumber}*\n` +
      `*Código: ${bookingSuccess.confirmationCode}*\n\n` +
      `*Hóspede:* ${formData.firstName} ${formData.lastName}\n` +
      `*Email:* ${formData.email}\n` +
      `*Telefone:* ${formData.phone}\n` +
      `*CPF:* ${formData.cpf}\n` +
      `*Nacionalidade:* ${formData.nationality}\n\n` +
      `*Quarto:* ${room?.name}\n` +
      `*Período:* ${checkInDate.toLocaleDateString('pt-BR')} a ${checkOutDate.toLocaleDateString('pt-BR')} (${nights} dias)\n` +
      `*Check-in:* ${new Date(new Date(formData.checkInDate).getTime() + 86400000).toLocaleDateString('pt-BR')} às ${formData.checkInTime}\n` +
      `*Check-out:* ${new Date(new Date(formData.checkOutDate).getTime() + 86400000).toLocaleDateString('pt-BR')} às ${formData.checkOutTime}\n` +
      `*Hóspedes:* ${numberOfGuests} pessoa${numberOfGuests > 1 ? 's' : ''}\n\n` +
      `*Valores:*\n` +
      `Subtotal: R$ ${(priceCalculation.subtotal / 100).toFixed(2)}\n` +
      (priceCalculation.durationDiscountPercent > 0 ? `Desconto por Duração (${priceCalculation.durationDiscountPercent}%): -R$ ${(priceCalculation.durationDiscount / 100).toFixed(2)}\n` : '') +
      `${priceCalculation.discount > 0 ? `Desconto (12%): -R$ ${(priceCalculation.discount / 100).toFixed(2)}\n` : ''}` +
      `Limpeza: R$ ${(priceCalculation.cleaning / 100).toFixed(2)}\n` +
      `*Total: R$ ${(priceCalculation.total / 100).toFixed(2)}*\n\n` +
      `${formData.specialRequests ? `Observações: ${formData.specialRequests}\n\n` : ''}` +
      `Aguardo confirmação!`;
  };

  const handleSendWhatsApp = () => {
    if (!bookingSuccess) return;

    console.log('DEBUG: handleSendWhatsApp - bookingSuccess =', bookingSuccess);
    const message = generateMessage();
    console.log('DEBUG: handleSendWhatsApp - message =', message);
    const phoneNumber = '5511952197283';
    const encodedMessage = encodeURIComponent(message);
    console.log('DEBUG: handleSendWhatsApp - encodedMessage =', encodedMessage);
    
    // Usar wa.me que funciona melhor em mobile
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Abrir em nova aba
    window.open(whatsappUrl, '_blank');
    
    toast.success('Abrindo WhatsApp...');
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl">
          <Card className="p-8">
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Reserva Confirmada!</h1>
              <p className="text-lg text-muted-foreground mb-4">
                Código: <span className="font-bold text-accent">{bookingSuccess.confirmationCode}</span>
              </p>
            </div>

            <div className="bg-accent/5 p-4 rounded-lg mb-6">
              <div className="mb-4 space-y-2">
                <p className="text-foreground font-semibold">Detalhes da Reserva:</p>
                <p className="text-sm text-muted-foreground">Período: {new Date(bookingSuccess.checkInDate).toLocaleDateString('pt-BR')} a {new Date(bookingSuccess.checkOutDate).toLocaleDateString('pt-BR')}</p>
                <p className="text-sm text-muted-foreground">Dias: <span className="font-bold text-accent">{bookingSuccess.numberOfGuests === 1 ? Math.ceil((new Date(bookingSuccess.checkOutDate).getTime() - new Date(bookingSuccess.checkInDate).getTime()) / (1000 * 60 * 60 * 24)) : 'N/A'}</span></p>
              </div>
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

            <div className="mt-6 text-center">
              <Link href="/" className="text-accent hover:text-accent/80">
                Voltar para Home
              </Link>
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
                      <div className="flex flex-col">
                        <span>{room.name} - R$ {(room.pricePerNight / 100).toFixed(2)}/noite</span>
                        <span className="text-sm">Banheiro: {room.bathroomType === "private" ? "Privado" : "Compartilhado"}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {blockedDates.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-semibold">📅 Datas bloqueadas neste quarto:</p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    {blockedDates.map((blocked, idx) => {
                      // Usar normalizeDate para garantir consistência com UTC
                      const startDateObj = normalizeDate(blocked.startDate);
                      const endDateObj = normalizeDate(blocked.endDate);
                      // Usar toUTCString e extrair data para evitar shift de timezone
                      const startDate = new Date(startDateObj.getUTCFullYear(), startDateObj.getUTCMonth(), startDateObj.getUTCDate()).toLocaleDateString('pt-BR');
                      const endDate = new Date(endDateObj.getUTCFullYear(), endDateObj.getUTCMonth(), endDateObj.getUTCDate()).toLocaleDateString('pt-BR');
                      return (
                        <li key={idx}>• {startDate} até {endDate}</li>
                      );
                    })}
                  </ul>
                </div>
              )}
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
                  className={isDateBlocked(formData.checkInDate, formData.checkOutDate) ? "border-red-500 bg-red-50" : ""}
                />
                {isDateBlocked(formData.checkInDate, formData.checkOutDate) && (
                  <p className="text-red-600 text-sm mt-2">⚠️ Data bloqueada!</p>
                )}
              </div>
              <div>
                <Label htmlFor="checkOutDate">Check-out *</Label>
                <Input
                  type="date"
                  name="checkOutDate"
                  value={formData.checkOutDate}
                  onChange={handleInputChange}
                  required
                  className={isDateBlocked(formData.checkInDate, formData.checkOutDate) ? "border-red-500 bg-red-50" : ""}
                />
                {isDateBlocked(formData.checkInDate, formData.checkOutDate) && (
                  <p className="text-red-600 text-sm mt-2">⚠️ Data bloqueada!</p>
                )}
              </div>

              {/* Aviso de Horários */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-semibold">⏰ Horários de Check-in e Check-out</p>
                <p className="text-sm text-blue-700 mt-2">Check-in: 14h00 às 23h30 | Check-out: até 12h00</p>
              </div>

              {/* Check-in Time */}
              <div>
                <Label htmlFor="checkInTime">Horário de Check-in *</Label>
                <Select value={formData.checkInTime} onValueChange={(value) => handleSelectChange('checkInTime', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'].map(time => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Check-out Time */}
              <div>
                <Label htmlFor="checkOutTime">Horário de Check-out *</Label>
                <Select value={formData.checkOutTime} onValueChange={(value) => handleSelectChange('checkOutTime', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'].map(time => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {formData.cpf.trim() !== "" && !validateCPF(formData.cpf) && (
                  <p className="text-sm text-red-500 mt-1">CPF inválido. Verifique o número digitado.</p>
                )}
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

            {/* RG com UF */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentNumber">Número do RG</Label>
                <Input
                  name="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleInputChange}
                  placeholder="123456789"
                />
              </div>
              <div>
                <Label htmlFor="documentUF">UF</Label>
                <Select value={formData.documentUF} onValueChange={(value) => setFormData({ ...formData, documentUF: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AC">AC</SelectItem>
                    <SelectItem value="AL">AL</SelectItem>
                    <SelectItem value="AP">AP</SelectItem>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="BA">BA</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="DF">DF</SelectItem>
                    <SelectItem value="ES">ES</SelectItem>
                    <SelectItem value="GO">GO</SelectItem>
                    <SelectItem value="MA">MA</SelectItem>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="MS">MS</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="PA">PA</SelectItem>
                    <SelectItem value="PB">PB</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="PE">PE</SelectItem>
                    <SelectItem value="PI">PI</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="RN">RN</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                    <SelectItem value="RO">RO</SelectItem>
                    <SelectItem value="RR">RR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="SE">SE</SelectItem>
                    <SelectItem value="TO">TO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Passaporte */}
            <div>
              <Label htmlFor="documentNumberPassport">Número do Passaporte</Label>
              <Input
                id="documentNumberPassport"
                name="documentNumberPassport"
                value={formData.documentNumberPassport || ""}
                onChange={handleInputChange}
                placeholder="AB123456"
              />
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
              <div className="flex justify-between mb-2 font-semibold text-lg">
                <span>Quantidade de Dias: {priceCalculation.nights} noite{priceCalculation.nights !== 1 ? 's' : ''}</span>
                <span className="text-accent">({formData.checkInDate} a {formData.checkOutDate})</span>
              </div>
              <div className="flex justify-between mb-2 mt-4">
                <span>Subtotal ({priceCalculation.nights} noite{priceCalculation.nights !== 1 ? 's' : ''}):</span>
                <span>R$ {(priceCalculation.subtotal / 100).toFixed(2)}</span>
              </div>
              {priceCalculation.durationDiscountPercent > 0 && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>Desconto por Duração ({priceCalculation.durationDiscountPercent}%):</span>
                  <span>-R$ {(priceCalculation.durationDiscount / 100).toFixed(2)}</span>
                </div>
              )}
              {priceCalculation.discount > 0 && priceCalculation.durationDiscountPercent === 0 && (
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

            {/* Campos de Pagamento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentAtBooking">Pagamento no ato da reserva (R$)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={paymentAtBooking > 0 ? (paymentAtBooking / 100).toFixed(2) : ""}
                  onChange={(e) => {
                    let numericValue = e.target.value.replace(/[^0-9]/g, '');
                    if (!numericValue) {
                      setPaymentAtBooking(0);
                      return;
                    }
                    const centavos = parseInt(numericValue, 10);
                    setPaymentAtBooking(centavos);
                  }}
                  onFocus={(e) => {
                    if (paymentAtBooking > 0) {
                      e.target.select();
                    }
                  }}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Pagamento no check-in (R$)</Label>
                <Input
                  type="text"
                  value={((priceCalculation.total - paymentAtBooking) / 100).toFixed(2)}
                  disabled
                  className="mt-1 bg-muted"
                />
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
