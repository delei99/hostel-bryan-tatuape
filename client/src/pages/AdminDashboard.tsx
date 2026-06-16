import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, Users, DollarSign, CheckCircle, Clock, X, Eye, Trash2, MessageCircle, Printer, FileText } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { useState, useMemo, useCallback } from "react";
import jsPDF from "jspdf";

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
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveAsNewModal, setShowSaveAsNewModal] = useState(false);
  const [useCurrentGuestData, setUseCurrentGuestData] = useState(true);
  const [showHomeImagesModal, setShowHomeImagesModal] = useState(false);
  const [homeImageFile, setHomeImageFile] = useState<File | null>(null);
  const [homeImagePreview, setHomeImagePreview] = useState<string | null>(null);
  const [homeImagePosition, setHomeImagePosition] = useState<"left" | "right" | "top" | "bottom">("left");
  const [homeImageTitle, setHomeImageTitle] = useState("");
  const [homeImageDescription, setHomeImageDescription] = useState("");
  const [isUploadingHomeImage, setIsUploadingHomeImage] = useState(false);
  const [newGuestData, setNewGuestData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cpf: "",
    nationality: "",
  });

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

  // Buscar lista de quartos
  const { data: rooms = [] } = trpc.rooms.list.useQuery();

  // Mutation para deletar reserva
  const deleteBookingMutation = trpc.bookings.delete.useMutation({
    onSuccess: () => {
      toast.success("Reserva deletada com sucesso!");
      setShowDeleteConfirm(false);
      setDeletingBookingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao deletar reserva: " + error.message);
    },
  });

  const handleDeleteBooking = (bookingId: number) => {
    setDeletingBookingId(bookingId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deletingBookingId) {
      deleteBookingMutation.mutate({ id: deletingBookingId });
    }
  };

  // Mutation para atualizar status
  const updateStatusMutation = trpc.bookings.updateStatus.useMutation({
    onSuccess: (result) => {
      toast.success("Status atualizado com sucesso!");
      if (result) {
        setSelectedBooking({ ...selectedBooking, booking: result.booking });
      }
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
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

  const createNewBooking = trpc.bookings.create.useMutation({
    onSuccess: () => {
      toast.success("Nova reserva criada com sucesso!");
      setShowSaveAsNewModal(false);
      setEditingBooking(null);
      setNewGuestData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        cpf: "",
        nationality: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar nova reserva");
    },
  });

  // Mutation para upload de imagens da home
  const utils = trpc.useUtils();
  const uploadHomeImageMutation = trpc.homeImages.create.useMutation({
    onSuccess: () => {
      toast.success('Imagem enviada com sucesso!');
      setHomeImageFile(null);
      setHomeImagePreview(null);
      setHomeImageTitle('');
      setHomeImageDescription('');
      setShowHomeImagesModal(false);
      utils.homeImages.list.invalidate();
    },
    onError: (error) => {
      toast.error('Erro ao enviar imagem: ' + error.message);
    },
  });

  const handleHomeImageUpload = useCallback(async () => {
    if (!homeImageFile) return;
    setIsUploadingHomeImage(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(homeImageFile);
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          await uploadHomeImageMutation.mutateAsync({
            imageUrl: base64Data,
            position: homeImagePosition,
            title: homeImageTitle || undefined,
            description: homeImageDescription || undefined,
          });
        } catch (error) {
          console.error('Erro ao enviar imagem:', error);
          toast.error('Erro ao enviar imagem');
        } finally {
          setIsUploadingHomeImage(false);
        }
      };
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toast.error('Erro ao processar imagem');
      setIsUploadingHomeImage(false);
    }
  }, [homeImageFile, homeImagePosition, homeImageTitle, homeImageDescription, uploadHomeImageMutation]);

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
  const handleSaveAsNewBooking = async () => {
    const guestData = useCurrentGuestData ? editingBooking.guest : newGuestData;
    
    if (!guestData.firstName || !guestData.lastName || !guestData.email || !guestData.phone) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }


    if (!editFormData.checkInDate || !editFormData.checkOutDate) {
      toast.error("Por favor, selecione as datas de check-in e check-out");
      return;
    }
    setIsEditingSubmitting(true);

    try {
      const [inYear, inMonth, inDay] = editFormData.checkInDate.split("-").map(Number);
      const [outYear, outMonth, outDay] = editFormData.checkOutDate.split("-").map(Number);
      const checkIn = new Date(inYear, inMonth - 1, inDay);
      const checkOut = new Date(outYear, outMonth - 1, outDay);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      const PRICE_PER_NIGHT = 8000;
      const CLEANING_FEE = 700;
      const subtotal = nights * PRICE_PER_NIGHT;
      const totalPrice = subtotal + CLEANING_FEE;

      await createNewBooking.mutateAsync({
        firstName: guestData.firstName,
        lastName: guestData.lastName,
        email: guestData.email,
        phone: guestData.phone,
        cpf: guestData.cpf,
        nationality: guestData.nationality,
        roomId: editFormData.roomId,
        checkInDate: editFormData.checkInDate,
        checkOutDate: editFormData.checkOutDate,
        checkInTime: editFormData.checkInTime || "14:00",
        checkOutTime: editFormData.checkOutTime || "12:00",
        numberOfGuests: editFormData.numberOfGuests?.toString() || "1",
        dailyType: "individual",
        subtotal: subtotal,
        discountPercentage: 0,
        discountAmount: 0,
        cleaningFee: CLEANING_FEE,
        totalPrice: totalPrice,
        specialRequests: editFormData.specialRequests || "",
      });
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar nova reserva");
    } finally {
      setIsEditingSubmitting(false);
    }
  };

    const generateReceiptPDF = (booking: any) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Fundo verde
      doc.setFillColor(34, 139, 34);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Texto branco
      doc.setTextColor(255, 255, 255);
      
      let yPosition = 15;

      // Título
      doc.setFontSize(16);
      doc.setFont(undefined as any, 'bold');
      doc.text("Reserva Confirmada - Hostel Bryan Tatuapé", 15, yPosition);
      yPosition += 12;

      // Número e Código
      doc.setFontSize(11);
      doc.setFont(undefined as any, 'normal');
      doc.text(`Número da Reserva: ${booking.booking.id}`, 15, yPosition);
      yPosition += 6;
      doc.text(`Código: ${booking.booking.confirmationCode}`, 15, yPosition);
      yPosition += 10;

      // Hóspede
      doc.setFontSize(10);
      doc.text(`Hóspede: ${booking.guest.firstName} ${booking.guest.lastName}`, 15, yPosition);
      yPosition += 5;
      doc.text(`Email: ${booking.guest.email}`, 15, yPosition);
      yPosition += 5;
      doc.text(`Telefone: ${booking.guest.phone}`, 15, yPosition);
      yPosition += 5;
      doc.text(`CPF: ${booking.guest.cpf || "N/A"}`, 15, yPosition);
      yPosition += 5;
      doc.text(`Nacionalidade: ${booking.guest.nationality || "N/A"}`, 15, yPosition);
      yPosition += 10;

      // Quarto e Período
      const checkInDate = new Date(booking.booking.checkInDate);
      const checkOutDate = new Date(booking.booking.checkOutDate);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      
      doc.text(`Quarto: ${booking.booking.room?.number || "N/A"}`, 15, yPosition);
      yPosition += 5;
      doc.text(`Período: ${checkInDate.toLocaleDateString('pt-BR')} a ${checkOutDate.toLocaleDateString('pt-BR')} (${nights} ${nights === 1 ? 'dia' : 'dias'})`, 15, yPosition);
      yPosition += 5;
      doc.text(`Check-in: ${checkInDate.toLocaleDateString('pt-BR')} às ${booking.booking.checkInTime}`, 15, yPosition);
      yPosition += 5;
      doc.text(`Check-out: ${checkOutDate.toLocaleDateString('pt-BR')} às ${booking.booking.checkOutTime}`, 15, yPosition);
      yPosition += 5;
      doc.text(`Hóspedes: ${booking.booking.numberOfGuests} ${booking.booking.numberOfGuests === 1 ? 'pessoa' : 'pessoas'}`, 15, yPosition);
      yPosition += 10;

      // Valores
      const subtotal = booking.booking.subtotal / 100;
      const discount = booking.booking.discountAmount / 100;
      const cleaningFee = booking.booking.cleaningFee / 100;
      const total = booking.booking.totalPrice / 100;
      
      doc.text("Valores:", 15, yPosition);
      yPosition += 5;
      doc.text(`Subtotal: R$ ${subtotal.toFixed(2)}`, 15, yPosition);
      yPosition += 5;
      
      if (discount > 0) {
        doc.text(`Desconto (${booking.booking.discountPercentage}%): -R$ ${discount.toFixed(2)}`, 15, yPosition);
        yPosition += 5;
      }
      
      doc.text(`Limpeza: R$ ${cleaningFee.toFixed(2)}`, 15, yPosition);
      yPosition += 5;
      doc.setFont(undefined as any, 'bold');
      doc.text(`Total: R$ ${total.toFixed(2)}`, 15, yPosition);
      yPosition += 10;

      // Observações
      if (booking.booking.specialRequests) {
        doc.setFont(undefined as any, 'normal');
        doc.text("Observações:", 15, yPosition);
        yPosition += 5;
        const splitText = doc.splitTextToSize(booking.booking.specialRequests, pageWidth - 30);
        doc.text(splitText, 15, yPosition);
      }

      return doc;
    } catch (error) {
      toast.error("Erro ao gerar PDF");
      return null;
    }
  };

  const handleSendWhatsApp = (booking: any) => {
    try {
      const checkInDate = new Date(booking.booking.checkInDate);
      const checkOutDate = new Date(booking.booking.checkOutDate);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      const subtotal = booking.booking.subtotal / 100;
      const discount = booking.booking.discountAmount / 100;
      const cleaningFee = booking.booking.cleaningFee / 100;
      const total = booking.booking.totalPrice / 100;
      
      let message = `*Reserva Confirmada - Hostel Bryan Tatuapé*\n\n`;
      message += `*Número da Reserva:* ${booking.booking.id}\n`;
      message += `*Código:* ${booking.booking.confirmationCode}\n\n`;
      message += `*Hóspede:* ${booking.guest.firstName} ${booking.guest.lastName}\n`;
      message += `*Email:* ${booking.guest.email}\n`;
      message += `*Telefone:* ${booking.guest.phone}\n`;
      message += `*CPF:* ${booking.guest.cpf || "N/A"}\n`;
      message += `*Nacionalidade:* ${booking.guest.nationality || "N/A"}\n\n`;
      message += `*Quarto:* ${booking.booking.room?.number || "N/A"}\n`;
      message += `*Período:* ${checkInDate.toLocaleDateString('pt-BR')} a ${checkOutDate.toLocaleDateString('pt-BR')} (${nights} ${nights === 1 ? 'dia' : 'dias'})\n`;
      message += `*Check-in:* ${checkInDate.toLocaleDateString('pt-BR')} às ${booking.booking.checkInTime}\n`;
      message += `*Check-out:* ${checkOutDate.toLocaleDateString('pt-BR')} às ${booking.booking.checkOutTime}\n`;
      message += `*Hóspedes:* ${booking.booking.numberOfGuests} ${booking.booking.numberOfGuests === 1 ? 'pessoa' : 'pessoas'}\n\n`;
      message += `*Valores:*\n`;
      message += `Subtotal: R$ ${subtotal.toFixed(2)}\n`;
      if (discount > 0) {
        message += `Desconto (${booking.booking.discountPercentage}%): -R$ ${discount.toFixed(2)}\n`;
      }
      message += `Limpeza: R$ ${cleaningFee.toFixed(2)}\n`;
      message += `*Total: R$ ${total.toFixed(2)}*\n\n`;
      if (booking.booking.specialRequests) {
        message += `*Observações:* ${booking.booking.specialRequests}\n\n`;
      }
      message += `Aguardo confirmação!`;
      
      const encodedMessage = encodeURIComponent(message);
      const phoneNumber = booking.guest.phone.replace(/[^0-9]/g, '');
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, "_blank");
    } catch (error) {
      toast.error("Erro ao abrir WhatsApp");
    }
  };

  const handlePrintReceipt = (booking: any) => {
    try {
      const doc = generateReceiptPDF(booking);
      if (doc) {
        doc.autoPrint();
        window.open(doc.output("bloburi"));
      }
    } catch (error) {
      toast.error("Erro ao imprimir");
    }
  };

  const handleDownloadPDF = (booking: any) => {
    try {
      const doc = generateReceiptPDF(booking);
      if (doc) {
        doc.save(`comprovante-${booking.booking.confirmationCode}.pdf`);
        toast.success("PDF baixado com sucesso");
      }
    } catch (error) {
      toast.error("Erro ao baixar PDF");
    }
  };

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
          <div className="flex flex-wrap gap-3">
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
            <Link href="/admin/bloqueios-excecoes">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Desbloquear Datas
              </Button>
            </Link>
            <Button 
              onClick={() => setShowHomeImagesModal(!showHomeImagesModal)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Imagens da Home
            </Button>
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendWhatsApp(item)}
                            className="flex items-center gap-1 text-green-600 hover:text-green-700"
                            title="Enviar via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintReceipt(item)}
                            className="flex items-center gap-1"
                            title="Imprimir recibo"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadPDF(item)}
                            className="flex items-center gap-1"
                            title="Baixar PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteBooking(item.booking.id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Deletar
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
                        <Select value={selectedBooking.booking.status} onValueChange={(newStatus) => {
                          updateStatusMutation.mutate({
                            id: selectedBooking.booking.id,
                            status: newStatus as "pending" | "confirmed" | "cancelled",
                          });
                        }}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="confirmed">Confirmada</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
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
                    <h4 className="font-semibold text-foreground mb-3">Informações do Quarto</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Quarto</Label>
                        <p className="text-foreground font-semibold">{selectedBooking.room.name}</p>
                      </div>
                      <div>
                        <Label>Tipo</Label>
                        <p className="text-foreground capitalize">{selectedBooking.room.type === 'private' ? 'Privado' : selectedBooking.room.type === 'shared' ? 'Compartilhado' : 'Dormitório'}</p>
                      </div>
                      <div>
                        <Label>Capacidade</Label>
                        <p className="text-foreground">{selectedBooking.room.capacity} {selectedBooking.room.capacity === 1 ? 'pessoa' : 'pessoas'}</p>
                      </div>
                      <div>
                        <Label>Preço por Noite</Label>
                        <p className="text-foreground">R$ {(selectedBooking.room.pricePerNight / 100).toFixed(2)}</p>
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
                        <Select value={editFormData?.roomId?.toString() || '0'} onValueChange={(value) => updateEditFormData('roomId', parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um quarto" />
                          </SelectTrigger>
                          <SelectContent>
                            {rooms.map((room: any) => (
                              <SelectItem key={room.id} value={room.id.toString()}>
                                {room.name} - {room.type}
                              </SelectItem>
                            ))}
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
                    type="button"
                    variant="outline"
                    onClick={() => setShowSaveAsNewModal(true)}
                    disabled={isEditingSubmitting || updateBooking.isPending}
                  >
                    Salvar como nova
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

        {/* Modal de Confirmação de Deleção */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">Confirmar Deleção</h2>
                <p className="text-foreground/70 mb-6">
                  Tem certeza que deseja deletar esta reserva? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-4">
                  <Button
                    onClick={confirmDelete}
                    variant="destructive"
                    disabled={deleteBookingMutation.isPending}
                    className="flex-1"
                  >
                    {deleteBookingMutation.isPending ? "Deletando..." : "Deletar"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletingBookingId(null);
                    }}
                    variant="outline"
                    disabled={deleteBookingMutation.isPending}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
        {/* Modal para salvar como nova reserva */}
        {showSaveAsNewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-2xl font-bold mb-4">Salvar como Nova Reserva</h2>
              <div className="mb-4 p-3 bg-accent/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    id="useCurrentGuest"
                    name="guestOption"
                    checked={useCurrentGuestData}
                    onChange={() => setUseCurrentGuestData(true)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="useCurrentGuest" className="cursor-pointer mb-0">Usar dados do hóspede atual</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="useNewGuest"
                    name="guestOption"
                    checked={!useCurrentGuestData}
                    onChange={() => setUseCurrentGuestData(false)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="useNewGuest" className="cursor-pointer mb-0">Inserir dados de novo hóspede</Label>
                </div>
              </div>
              {useCurrentGuestData ? (
                <div className="space-y-4 mb-6 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-3">Dados do hóspede atual serão usados</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Nome</Label>
                      <p className="text-sm font-medium">{editingBooking?.guest?.firstName}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Sobrenome</Label>
                      <p className="text-sm font-medium">{editingBooking?.guest?.lastName}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <p className="text-sm font-medium">{editingBooking?.guest?.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Telefone</Label>
                    <p className="text-sm font-medium">{editingBooking?.guest?.phone}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">CPF</Label>
                      <p className="text-sm font-medium">{editingBooking?.guest?.cpf || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Nacionalidade</Label>
                      <p className="text-sm font-medium">{editingBooking?.guest?.nationality || "N/A"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newFirstName">Nome *</Label>
                      <Input
                        id="newFirstName"
                        value={newGuestData.firstName}
                        onChange={(e) => setNewGuestData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Nome"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newLastName">Sobrenome *</Label>
                      <Input
                        id="newLastName"
                        value={newGuestData.lastName}
                        onChange={(e) => setNewGuestData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Sobrenome"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newEmail">Email *</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newGuestData.email}
                      onChange={(e) => setNewGuestData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPhone">Telefone *</Label>
                    <Input
                      id="newPhone"
                      value={newGuestData.phone}
                      onChange={(e) => setNewGuestData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newCpf">CPF</Label>
                      <Input
                        id="newCpf"
                        value={newGuestData.cpf}
                        onChange={(e) => setNewGuestData(prev => ({ ...prev, cpf: e.target.value }))}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newNationality">Nacionalidade</Label>
                      <Input
                        id="newNationality"
                        value={newGuestData.nationality}
                        onChange={(e) => setNewGuestData(prev => ({ ...prev, nationality: e.target.value }))}
                        placeholder="Brasileira"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveAsNewModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveAsNewBooking}
                  disabled={isEditingSubmitting}
                  className="flex-1"
                >
                  {isEditingSubmitting ? "Criando..." : "Criar Nova Reserva"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Modal de Imagens da Home */}
        {showHomeImagesModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md max-h-96 overflow-y-auto">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Gerenciar Imagens da Home</h3>
                  <button onClick={() => setShowHomeImagesModal(false)} className="text-foreground/50 hover:text-foreground">✕</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="home-image-file">Selecionar Imagem</Label>
                    <Input
                      id="home-image-file"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setHomeImageFile(file);
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setHomeImagePreview(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  {homeImagePreview && (
                    <img src={homeImagePreview} alt="Preview" className="w-full h-32 object-cover rounded" />
                  )}
                  <div>
                    <Label htmlFor="home-image-position">Posição</Label>
                    <Select value={homeImagePosition} onValueChange={(value) => setHomeImagePosition(value as "left" | "right" | "top" | "bottom")}>
                      <SelectTrigger id="home-image-position">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Esquerda</SelectItem>
                        <SelectItem value="right">Direita</SelectItem>
                        <SelectItem value="top">Topo</SelectItem>
                        <SelectItem value="bottom">Rodapé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="home-image-title">Título</Label>
                    <Input
                      id="home-image-title"
                      type="text"
                      placeholder="Ex: Conforto e Elegância"
                      value={homeImageTitle}
                      onChange={(e) => setHomeImageTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="home-image-description">Descrição</Label>
                    <Input
                      id="home-image-description"
                      type="text"
                      placeholder="Ex: Quartos espaçosos com vista para a cidade"
                      value={homeImageDescription}
                      onChange={(e) => setHomeImageDescription(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    disabled={!homeImageFile || isUploadingHomeImage}
                    onClick={handleHomeImageUpload}
                  >
                    {isUploadingHomeImage ? 'Enviando...' : 'Fazer Upload'}
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
