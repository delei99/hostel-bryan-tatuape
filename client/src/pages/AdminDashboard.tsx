import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, Users, DollarSign, CheckCircle, Clock, X, Eye } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

/**
 * Painel administrativo para gerenciar reservas
 * Apenas administradores podem acessar
 */
export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [editPassword, setEditPassword] = useState("");
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);

  const updateEditFormData = (field: string, value: any) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOpenEditModal = (booking: any) => {
    setEditingBooking(booking);
    setEditFormData({ ...booking });
    setEditPassword("");
  };

  // Buscar todas as reservas (sem input, pois procedure não aceita)
  const { data: bookings, isLoading, error, refetch } = trpc.bookings.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Mutation para editar reserva
  const generateEditedBookingMessage = (booking: any, guest: any, room: any) => {
    return `*Reserva Editada - Hostel Bryan Tatuape*\n\n` +
      `*Codigo: ${booking.confirmationCode}*\n\n` +
      `*Hospede:* ${guest.firstName} ${guest.lastName}\n` +
      `*Email:* ${guest.email}\n` +
      `*Telefone:* ${guest.phone}\n\n` +
      `*Quarto:* ${room.name}\n` +
      `*Check-in:* ${new Date(booking.checkInDate).toLocaleDateString('pt-BR')} as ${booking.checkInTime}\n` +
      `*Check-out:* ${new Date(booking.checkOutDate).toLocaleDateString('pt-BR')} as ${booking.checkOutTime}\n` +
      `*Hospedes:* ${booking.numberOfGuests} pessoa${booking.numberOfGuests > 1 ? 's' : ''}\n\n` +
      `*Valores:*\n` +
      `Subtotal: R$ ${(booking.subtotal / 100).toFixed(2)}\n` +
      (booking.discountPercentage > 0 ? `Desconto (${booking.discountPercentage}%): -R$ ${(booking.discountAmount / 100).toFixed(2)}\n` : '') +
      `Limpeza: R$ ${(booking.cleaningFee / 100).toFixed(2)}\n` +
      `*Total: R$ ${(booking.totalPrice / 100).toFixed(2)}*\n\n` +
      `${booking.specialRequests ? `Observacoes: ${booking.specialRequests}\n\n` : ''}` +
      `*Editado em:* ${booking.editedAt ? new Date(booking.editedAt).toLocaleString('pt-BR') : 'Agora'}\n` +
      `*Editado por:* ${booking.editedBy}\n\n` +
      `Obrigado!`;
  };

  const updateBooking = trpc.bookings.update.useMutation({
    onSuccess: async (result) => {
      toast.success("Reserva atualizada com sucesso!");
      
      if (result && result.booking && result.guest && result.room) {
        const message = generateEditedBookingMessage(result.booking, result.guest, result.room);
        const phoneNumber = result.guest.phone ? result.guest.phone.replace(/\D/g, '') : '';
        
        if (phoneNumber && phoneNumber.length >= 11) {
          const encodedMessage = encodeURIComponent(message);
          const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
          
          setTimeout(() => {
            window.open(whatsappUrl, '_blank');
          }, 500);
          
          toast.success('Notificacao WhatsApp enviada!');
        } else {
          toast.warning('Telefone do hospede nao disponivel para WhatsApp');
        }
      }
      
      setEditingBooking(null);
      setEditPassword("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar reserva");
    },
  });

  // Nota: Atualização de status de reserva em desenvolvimento
  const handleUpdateStatus = () => {
    toast.info("Atualização de status em desenvolvimento");
  };

  const updateStatus = {
    mutate: handleUpdateStatus,
    isPending: false,
  }

  // Filtrar e buscar reservas
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    return bookings.filter((item: any) => {
      const booking = item.booking;
      const guest = item.guest;

      // Filtro de status
      if (statusFilter !== "all" && booking.status !== statusFilter) {
        return false;
      }

      // Busca por nome, email ou código de confirmação
      const searchLower = searchTerm.toLowerCase();
      return (
        guest.firstName.toLowerCase().includes(searchLower) ||
        guest.lastName.toLowerCase().includes(searchLower) ||
        guest.email.toLowerCase().includes(searchLower) ||
        booking.confirmationCode?.toLowerCase().includes(searchLower)
      );
    });
  }, [bookings, searchTerm, statusFilter]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!bookings) return { total: 0, confirmed: 0, revenue: 0, occupancy: 0 };

    const total = bookings.length;
    const confirmed = bookings.filter((b: any) => b.booking.status === "confirmed").length;
    const revenue = bookings.reduce((sum: number, b: any) => sum + b.booking.totalPrice, 0);

    return {
      total,
      confirmed,
      revenue,
      occupancy: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    };
  }, [bookings]);

  // Cores de status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "checked_in":
        return "bg-blue-100 text-blue-800";
      case "checked_out":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  // Labels de status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "confirmed":
        return "Confirmada";
      case "checked_in":
        return "Check-in";
      case "checked_out":
        return "Check-out";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  // Renderizar conteúdo baseado no estado de autenticação
  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Não Autenticado</h2>
          <p className="text-red-600 mb-4">Você precisa estar autenticado para acessar este painel.</p>
        </Card>
      </DashboardLayout>
    );
  }

  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h2>
          <p className="text-red-600 mb-4">Apenas administradores podem acessar este painel.</p>
          <p className="text-red-600 text-sm">Entre em contato com o proprietário do hostel para obter acesso.</p>
        </Card>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao Carregar Reservas</h2>
          <p className="text-red-600 mb-4">{error.message || 'Erro desconhecido'}</p>
          <Button onClick={() => refetch()} className="bg-red-600 hover:bg-red-700">
            Tentar Novamente
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Painel Administrativo</h1>
            <p className="text-foreground/70">Gerencie todas as reservas do Hostel Bryan Tatuapé</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/quartos">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Editar Quartos
              </Button>
            </Link>
            <Link href="/admin/fotos">
              <Button className="bg-accent hover:bg-opacity-90">
                Gerenciar Fotos
              </Button>
            </Link>
            <Link href="/admin/bloqueios">
              <Button className="bg-red-600 hover:bg-red-700">
                Bloquear Datas
              </Button>
            </Link>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/70 text-sm mb-2">Total de Reservas</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Calendar className="w-10 h-10 text-accent opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/70 text-sm mb-2">Confirmadas</p>
                <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/70 text-sm mb-2">Receita Total</p>
                <p className="text-3xl font-bold text-foreground">R$ {(stats.revenue / 100).toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-accent opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/70 text-sm mb-2">Taxa de Ocupação</p>
                <p className="text-3xl font-bold text-foreground">{stats.occupancy}%</p>
              </div>
              <Users className="w-10 h-10 text-accent opacity-20" />
            </div>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar Reserva</Label>
              <Input
                id="search"
                placeholder="Nome, email ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Filtrar por Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="checked_in">Check-in</SelectItem>
                  <SelectItem value="checked_out">Check-out</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Tabela de Reservas */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Reservas</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 animate-spin mx-auto text-accent mb-2" />
              <p className="text-foreground/70">Carregando reservas...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-foreground/70">Nenhuma reserva encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Hóspede</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Código</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Período</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((item: any) => (
                    <tr key={item.booking.id} className="border-b border-border hover:bg-accent/5">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground">{item.guest.firstName} {item.guest.lastName}</p>
                          <p className="text-sm text-foreground/70">{item.guest.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-sm text-foreground">{item.booking.confirmationCode}</td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {new Date(item.booking.checkInDate).toLocaleDateString('pt-BR')} - {new Date(item.booking.checkOutDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.booking.status)}`}>
                          {getStatusLabel(item.booking.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">R$ {(item.booking.totalPrice / 100).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBooking(item)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditModal(item)}
                            className="flex items-center gap-1"
                          >
                            <Clock className="w-4 h-4" />
                            Editar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Modal de Detalhes */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Detalhes da Reserva</h2>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="text-foreground/70 hover:text-foreground"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Informações da Reserva</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Código de Confirmação</Label>
                        <p className="font-mono text-foreground">{selectedBooking.booking.confirmationCode}</p>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <p className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(selectedBooking.booking.status)}`}>
                          {getStatusLabel(selectedBooking.booking.status)}
                        </p>
                      </div>
                      <div>
                        <Label>Check-in</Label>
                        <p className="text-foreground">{new Date(selectedBooking.booking.checkInDate).toLocaleDateString('pt-BR')} às {selectedBooking.booking.checkInTime}</p>
                      </div>
                      <div>
                        <Label>Check-out</Label>
                        <p className="text-foreground">{new Date(selectedBooking.booking.checkOutDate).toLocaleDateString('pt-BR')} às {selectedBooking.booking.checkOutTime}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold text-foreground mb-3">Informações do Hóspede</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nome</Label>
                        <p className="text-foreground">{selectedBooking.guest.firstName} {selectedBooking.guest.lastName}</p>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <p className="text-foreground">{selectedBooking.guest.email}</p>
                      </div>
                      <div>
                        <Label>Telefone</Label>
                        <p className="text-foreground">{selectedBooking.guest.phone || 'Não informado'}</p>
                      </div>
                      <div>
                        <Label>Hóspedes</Label>
                        <p className="text-foreground">{selectedBooking.booking.numberOfGuests}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold text-foreground mb-3">Valores</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Subtotal:</span>
                        <span className="text-foreground">R$ {(selectedBooking.booking.subtotal / 100).toFixed(2)}</span>
                      </div>
                      {selectedBooking.booking.discountPercentage > 0 && (
                        <div className="flex justify-between">
                          <span className="text-foreground/70">Desconto ({selectedBooking.booking.discountPercentage}%):</span>
                          <span className="text-foreground">-R$ {(selectedBooking.booking.discountAmount / 100).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Taxa de Limpeza:</span>
                        <span className="text-foreground">R$ {(selectedBooking.booking.cleaningFee / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-border pt-2">
                        <span className="text-foreground">Total:</span>
                        <span className="text-foreground">R$ {(selectedBooking.booking.totalPrice / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedBooking.booking.specialRequests && (
                    <div className="border-t border-border pt-4">
                      <h4 className="font-semibold text-foreground mb-3">Observações</h4>
                      <p className="text-foreground">{selectedBooking.booking.specialRequests}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-6 flex gap-3">
                  <Button
                    onClick={() => {
                      handleOpenEditModal(selectedBooking);
                      setSelectedBooking(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Editar Reserva
                  </Button>
                  <Button
                    onClick={() => setSelectedBooking(null)}
                    variant="outline"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Modal de Edição */}
        {editingBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Editar Reserva</h2>
                  <button
                    onClick={() => setEditingBooking(null)}
                    className="text-foreground/70 hover:text-foreground"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Informações da Reserva</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Check-in</Label>
                        <Input 
                          type="date" 
                          value={editFormData?.checkInDate?.split('T')[0] || ''}
                          onChange={(e) => updateEditFormData('checkInDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Check-out</Label>
                        <Input 
                          type="date" 
                          value={editFormData?.checkOutDate?.split('T')[0] || ''}
                          onChange={(e) => updateEditFormData('checkOutDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Horário Check-in</Label>
                        <Input 
                          type="time" 
                          value={editFormData?.checkInTime || ''}
                          onChange={(e) => updateEditFormData('checkInTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Horário Check-out</Label>
                        <Input 
                          type="time" 
                          value={editFormData?.checkOutTime || ''}
                          onChange={(e) => updateEditFormData('checkOutTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Quarto</Label>
                        <Select value={editFormData?.roomId?.toString() || ''} onValueChange={(value) => updateEditFormData('roomId', parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um quarto" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Aqui você adicionaria os quartos disponíveis */}
                            <SelectItem value={editFormData?.roomId?.toString() || ''}>Quarto {editFormData?.roomId}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Número de Hóspedes</Label>
                        <Input 
                          type="number" 
                          value={editFormData?.numberOfGuests || ''}
                          onChange={(e) => updateEditFormData('numberOfGuests', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold text-foreground mb-3">Observações</h4>
                    <Input 
                      placeholder="Observações especiais" 
                      value={editFormData?.specialRequests || ''}
                      onChange={(e) => updateEditFormData('specialRequests', e.target.value)}
                    />
                  </div>

                  <div className="border-t border-border pt-4">
                    <Label>Senha para Confirmar</Label>
                    <Input 
                      type="password" 
                      placeholder="Digite a senha" 
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-6 flex gap-3">
                  <Button
                    onClick={() => {
                      if (!editPassword) {
                        toast.error("Digite a senha para confirmar!");
                        return;
                      }
                      if (!editFormData.checkInTime) {
                        toast.error("Selecione o horário de check-in!");
                        return;
                      }
                      if (!editFormData.checkOutTime) {
                        toast.error("Selecione o horário de check-out!");
                        return;
                      }
                      updateBooking.mutate({
                        id: editingBooking.booking.id,
                        checkInDate: editFormData.checkInDate,
                        checkOutDate: editFormData.checkOutDate,
                        roomId: editFormData.roomId,
                        numberOfGuests: editFormData.numberOfGuests,
                        specialRequests: editFormData.specialRequests,
                      });
                    }}
                    disabled={isEditingSubmitting || updateBooking.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    {isEditingSubmitting || updateBooking.isPending ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Alterações"
                    )}
                  </Button>
                  <Button
                    onClick={() => setEditingBooking(null)}
                    variant="outline"
                    disabled={isEditingSubmitting || updateBooking.isPending}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
