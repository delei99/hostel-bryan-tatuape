import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  // Buscar todas as reservas
  const { data: bookings, isLoading, refetch } = trpc.bookings.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Atualizar status da reserva
  const updateStatus = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      refetch();
      setSelectedBooking(null);
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  // Verificar se é admin
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Acesso Negado</h2>
          <p className="text-foreground/70">Apenas administradores podem acessar este painel.</p>
        </Card>
      </div>
    );
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
                <p className="text-3xl font-bold text-accent">R$ {(stats.revenue / 100).toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-accent opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/70 text-sm mb-2">Taxa de Ocupação</p>
                <p className="text-3xl font-bold text-secondary">{stats.occupancy}%</p>
              </div>
              <Users className="w-10 h-10 text-secondary opacity-20" />
            </div>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">Filtros</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-foreground/70 mb-2 block">Buscar</label>
                <Input
                  placeholder="Nome, email ou código de confirmação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-foreground/70 mb-2 block">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="checked_in">Check-in</option>
                  <option value="checked_out">Check-out</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de Reservas */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <p className="text-foreground/70">Carregando reservas...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-foreground/70">Nenhuma reserva encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent/10 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Hóspede</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Quarto</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Datas</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Valor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((item: any, index: number) => {
                    const booking = item.booking;
                    const guest = item.guest;
                    const room = item.room;

                    const checkIn = new Date(booking.checkInDate).toLocaleDateString('pt-BR');
                    const checkOut = new Date(booking.checkOutDate).toLocaleDateString('pt-BR');

                    return (
                      <tr key={index} className="border-b border-border hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-foreground">{guest.firstName} {guest.lastName}</p>
                            <p className="text-sm text-foreground/70">{guest.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-foreground">{room.name}</td>
                        <td className="px-6 py-4 text-foreground text-sm">
                          {checkIn} até {checkOut}
                        </td>
                        <td className="px-6 py-4 text-foreground font-semibold">
                          R$ {(booking.totalPrice / 100).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBooking(booking)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Detalhes
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Modal de Detalhes */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-foreground">Detalhes da Reserva</h3>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="text-foreground/70 hover:text-foreground"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-foreground/70 mb-1">Código de Confirmação</p>
                      <p className="font-mono font-bold text-accent">{selectedBooking.confirmationCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground/70 mb-1">Status</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedBooking.status)}`}>
                        {getStatusLabel(selectedBooking.status)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold text-foreground mb-3">Informações do Hóspede</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-foreground/70">Nome</p>
                        <p className="text-foreground">{selectedBooking.guestId}</p>
                      </div>
                      <div>
                        <p className="text-foreground/70">Email</p>
                        <p className="text-foreground">{selectedBooking.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold text-foreground mb-3">Detalhes da Hospedagem</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-foreground/70">Check-in</p>
                        <p className="text-foreground">{new Date(selectedBooking.checkInDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-foreground/70">Check-out</p>
                        <p className="text-foreground">{new Date(selectedBooking.checkOutDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-foreground/70">Hóspedes</p>
                        <p className="text-foreground">{selectedBooking.numberOfGuests}</p>
                      </div>
                      <div>
                        <p className="text-foreground/70">Valor Total</p>
                        <p className="text-foreground font-bold">R$ {(selectedBooking.totalPrice / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {selectedBooking.specialRequests && (
                    <div className="border-t border-border pt-4">
                      <h4 className="font-semibold text-foreground mb-2">Pedidos Especiais</h4>
                      <p className="text-foreground text-sm">{selectedBooking.specialRequests}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-6 flex gap-3">
                  {selectedBooking.status === "pending" && (
                    <Button
                      onClick={() => {
                        updateStatus.mutate({
                          bookingId: selectedBooking.id,
                          status: "confirmed",
                        });
                      }}
                      disabled={updateStatus.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Confirmar Reserva
                    </Button>
                  )}
                  {selectedBooking.status === "confirmed" && (
                    <Button
                      onClick={() => {
                        updateStatus.mutate({
                          bookingId: selectedBooking.id,
                          status: "checked_in",
                        });
                      }}
                      disabled={updateStatus.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Check-in
                    </Button>
                  )}
                  {selectedBooking.status === "checked_in" && (
                    <Button
                      onClick={() => {
                        updateStatus.mutate({
                          bookingId: selectedBooking.id,
                          status: "checked_out",
                        });
                      }}
                      disabled={updateStatus.isPending}
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      Check-out
                    </Button>
                  )}
                  {selectedBooking.status !== "cancelled" && selectedBooking.status !== "checked_out" && (
                    <Button
                      onClick={() => {
                        updateStatus.mutate({
                          bookingId: selectedBooking.id,
                          status: "cancelled",
                        });
                      }}
                      disabled={updateStatus.isPending}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      Cancelar
                    </Button>
                  )}
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
      </div>
    </DashboardLayout>
  );
}
