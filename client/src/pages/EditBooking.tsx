import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useRealtimeBlockedDates } from "@/hooks/useRealtimeBlockedDates";

export default function EditBooking() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const bookingId = urlParams.get('id');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Buscar dados da reserva
  const { data: booking, isLoading: isLoadingBooking } = trpc.bookings.getById.useQuery(
    { id: parseInt(bookingId || '0') },
    { enabled: !!bookingId }
  );

  // Buscar quartos
  const { data: rooms = [] } = trpc.rooms.list.useQuery();

  // Estado do formulário
  const [formData, setFormData] = useState({
    roomId: "1",
    checkInDate: "",
    checkOutDate: "",
    numberOfGuests: "1",
    specialRequests: "",
  });

  // Atualizar formData quando booking for carregado
  useEffect(() => {
    if (booking && booking.booking) {
      setFormData({
        roomId: booking.booking.roomId?.toString() || "1",
        checkInDate: booking.booking.checkInDate?.toString().split('T')[0] || "",
        checkOutDate: booking.booking.checkOutDate?.toString().split('T')[0] || "",
        numberOfGuests: booking.booking.numberOfGuests?.toString() || "1",
        specialRequests: "",
      });
    }
  }, [booking]);

  // Buscar datas bloqueadas para o quarto selecionado
  const { data: blockedDates = [] } = trpc.blockedDates.list.useQuery(
    { roomId: parseInt(formData.roomId) },
    { enabled: !!formData.roomId }
  );

  // Sincronizar bloqueios em tempo real entre abas
  useRealtimeBlockedDates(parseInt(formData.roomId), !!formData.roomId);

  // Normalizar data para comparação (usar UTC para evitar shift de timezone)
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
        console.error('[EditBooking] Invalid date format:', dateStr);
        return new Date();
      }
      return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }
    // Se for Date object (vindo do backend como ISO string), usar UTC getters
    const d = new Date(dateStr);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  };

  // Verificar se data está bloqueada
  const isDateBlocked = (checkInStr: string, checkOutStr: string) => {
    const checkIn = normalizeDate(checkInStr);
    const checkOut = normalizeDate(checkOutStr);
    
    for (const blocked of blockedDates) {
      const blockedStart = normalizeDate(blocked.startDate);
      const blockedEnd = normalizeDate(blocked.endDate);
      
      if (checkIn < blockedEnd && checkOut > blockedStart) {
        return true;
      }
    }

    return false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateBooking = trpc.bookings.update.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingId) {
      toast.error("ID da reserva não encontrado");
      return;
    }

    if (isDateBlocked(formData.checkInDate, formData.checkOutDate)) {
      toast.error("As datas selecionadas estão bloqueadas!");
      return;
    }

    setIsSubmitting(true);

    try {
      const utils = trpc.useUtils();
      
      await updateBooking.mutateAsync({
        id: parseInt(bookingId),
        roomId: parseInt(formData.roomId),
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        numberOfGuests: formData.numberOfGuests,
        specialRequests: formData.specialRequests,
      });

      // Invalidar cache para sincronizar automaticamente no painel administrativo
      await utils.bookings.list.invalidate();
      // Invalidar bloqueios para o quarto original E o novo quarto (se mudou)
      if (booking?.booking?.roomId) {
        await utils.blockedDates.list.invalidate({ roomId: booking.booking.roomId });
        if (formData.roomId !== booking.booking.roomId.toString()) {
          await utils.blockedDates.list.invalidate({ roomId: parseInt(formData.roomId) });
        }
      }

      toast.success("Reserva atualizada com sucesso!");
      setUpdateSuccess(true);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar reserva");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoadingBooking) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl">
          <Card className="p-8">
            <p className="text-center text-muted-foreground">Carregando reserva...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl">
          <Card className="p-8">
            <p className="text-center text-red-600">Reserva não encontrada</p>
          </Card>
        </div>
      </div>
    );
  }

  if (updateSuccess) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl">
          <Card className="p-8">
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Reserva Atualizada!</h1>
              <p className="text-lg text-muted-foreground mb-4">
                Sua reserva foi atualizada com sucesso.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline">Voltar ao Início</Button>
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
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </Link>

        <Card className="p-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">Editar Reserva</h1>

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
                      {room.name} - R$ {(room.pricePerNight / 100).toFixed(2)}/noite - Banheiro: {room.bathroomType === "private" ? "Privado" : "Compartilhado"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {blockedDates.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-semibold">📅 Datas bloqueadas neste quarto:</p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    {blockedDates.map((blocked, idx) => {
                      const startDateObj = normalizeDate(blocked.startDate);
                      const endDateObj = normalizeDate(blocked.endDate);
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
                      {num} pessoa{num > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="specialRequests">Observações</Label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                placeholder="Alguma solicitação especial?"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                rows={4}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-4 justify-end">
              <Link href="/">
                <Button variant="outline">Cancelar</Button>
              </Link>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Atualizando..." : "Atualizar Reserva"}
              </Button>
            </div>
          </form>


        </Card>
      </div>
    </div>
  );
}
