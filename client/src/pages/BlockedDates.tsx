import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Lock, Unlock, Eye, EyeOff, Trash2 } from "lucide-react";
import { Link } from "wouter";
import BlockedDatesCalendar from "@/components/BlockedDatesCalendar";

export default function BlockedDates() {
  const utils = trpc.useUtils();
  const [roomIds, setRoomIds] = useState<string[]>(["1"]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBlockedIds, setSelectedBlockedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [unblockPassword, setUnblockPassword] = useState("");
  const [unblockShowPassword, setUnblockShowPassword] = useState(false);
  const [selectedUnblockId, setSelectedUnblockId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editObservation, setEditObservation] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);
  const [observations, setObservations] = useState<Record<number, { text: string; editedAt: string }>>({});
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editRoomId, setEditRoomId] = useState<string>("");
  const [editMode, setEditMode] = useState<'observation' | 'dates'>('observation');
  const [unblockExceptionModalOpen, setUnblockExceptionModalOpen] = useState(false);
  const [exceptionBlockedDateId, setExceptionBlockedDateId] = useState<number | null>(null);
  const [exceptionStartDate, setExceptionStartDate] = useState("");
  const [exceptionEndDate, setExceptionEndDate] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");
  const [isCreatingException, setIsCreatingException] = useState(false);
  const [unblockMultipleModalOpen, setUnblockMultipleModalOpen] = useState(false);
  const [unblockMultiplePassword, setUnblockMultiplePassword] = useState("");

  // Carregar observações do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('blockedDateObservations');
    if (saved) {
      try {
        setObservations(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao carregar observações:', e);
      }
    }
  }, []);

  // Salvar observações no localStorage
  const saveObservation = (id: number, text: string) => {
    const updated = {
      ...observations,
      [id]: {
        text,
        editedAt: new Date().toLocaleString('pt-BR'),
      },
    };
    setObservations(updated);
    localStorage.setItem('blockedDateObservations', JSON.stringify(updated));
  };

  // Buscar quartos
  const { data: rooms = [] } = trpc.rooms.list.useQuery();
  
  // Buscar datas bloqueadas
  const { data: blockedDates = [], refetch } = trpc.blockedDates.list.useQuery(
    { roomId: roomIds.length > 0 ? parseInt(roomIds[0]) : 1 },
    { enabled: roomIds.length > 0 }
  );

  const createBlockedDate = trpc.blockedDates.create.useMutation();
  const deleteBlockedDate = trpc.blockedDates.delete.useMutation();
  const updateBlockedDate = trpc.blockedDates.update.useMutation();
  const createException = trpc.blockingExceptions.create.useMutation();

  // Buscar exceções para o quarto selecionado
  const { data: exceptions = [] } = trpc.blockingExceptions.getByRoom.useQuery(
    { roomId: roomIds.length > 0 ? parseInt(roomIds[0]) : 1 },
    { enabled: roomIds.length > 0 }
  );

  // Sincronizar selectAll quando selectedBlockedIds ou blockedDates muda
  useEffect(() => {
    if (blockedDates.length > 0) {
      const allSelected = selectedBlockedIds.length === blockedDates.length && 
                         blockedDates.every(b => selectedBlockedIds.includes(b.id));
      setSelectAll(allSelected);
    } else {
      setSelectAll(false);
    }
  }, [selectedBlockedIds, blockedDates]);

  // Limpar selecao quando trocar de quarto
  useEffect(() => {
    setSelectedBlockedIds([]);
    setSelectAll(false);
  }, [roomIds]);

  const handleBlockDate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!startDate || !endDate || !reason || !password || roomIds.length === 0) {
      toast.error("Preencha todos os campos!");
      return;
    }

    // Converter strings de data para datas locais (nao UTC)
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay, startHour, startMinute, 0, 0);
    const end = new Date(endYear, endMonth - 1, endDay, endHour, endMinute, 59, 999);
    
    if (start > end) {
      toast.error("Data/hora inicial deve ser anterior a data/hora final!");
      return;
    }

    try {
      setIsSubmitting(true);
      for (const rid of roomIds) {
        await createBlockedDate.mutateAsync({
          roomId: parseInt(rid),
          startDate: start,
          endDate: end,
          reason,
        });
      }

      toast.success(`Data bloqueada em ${roomIds.length} quarto(s)!`);
      setStartDate("");
      setEndDate("");
      setReason("");
      setPassword("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao bloquear data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditObservation = (blockedDateId: number) => {
    const blocked = blockedDates.find(b => b.id === blockedDateId);
    if (!blocked) return;
    
    // Converter data para formato local (não UTC)
    const formatDateLocal = (dateStr: string | Date) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setEditingId(blockedDateId);
    setEditObservation(observations[blockedDateId]?.text || "");
    setEditStartDate(formatDateLocal(blocked.startDate));
    setEditEndDate(formatDateLocal(blocked.endDate));
    setEditReason(blocked.reason || "");
    setEditRoomId(blocked.roomId.toString());
    setEditPassword("");
    setEditShowPassword(false);
    setEditMode('observation');
    setEditModalOpen(true);
  };

  const handleConfirmEditObservation = async () => {
    if (!editingId || !editPassword) {
      toast.error("Digite a senha para editar!");
      return;
    }

    const correctPassword = "Capacho@69";
    if (editPassword !== correctPassword) {
      toast.error("Senha incorreta!");
      return;
    }

    try {
      setIsEditingSubmitting(true);
      
      if (editMode === 'observation') {
        saveObservation(editingId, editObservation);
        toast.success("Observação atualizada com sucesso!");
      } else if (editMode === 'dates') {
        const [startYear, startMonth, startDay] = editStartDate.split('-').map(Number);
        const [endYear, endMonth, endDay] = editEndDate.split('-').map(Number);
        const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
        const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
        
        if (start > end) {
          toast.error("Data inicial deve ser anterior a data final!");
          setIsEditingSubmitting(false);
          return;
        }
        
        await updateBlockedDate.mutateAsync({
          id: editingId,
          startDate: start,
          endDate: end,
          reason: editReason,
          roomId: parseInt(editRoomId),
          password: editPassword,
        });
        
        toast.success("Datas bloqueadas atualizadas com sucesso!");
        refetch();
      }
      
      setEditModalOpen(false);
      setEditPassword("");
      setEditObservation("");
      setEditingId(null);
      setEditStartDate("");
      setEditEndDate("");
      setEditReason("");
      setEditRoomId("");
    } catch (error: any) {
      console.error("Erro ao editar:", error);
      const errorMessage = error?.message || "Erro ao editar";
      toast.error(errorMessage);
    } finally {
      setIsEditingSubmitting(false);
    }
  };

  const handleUnblockDate = (blockedDateId: number) => {
    setSelectedUnblockId(blockedDateId);
    setUnblockPassword("");
    setUnblockShowPassword(false);
    setUnblockModalOpen(true);
  };

  const handleOpenExceptionModal = (blockedDateId: number) => {
    setExceptionBlockedDateId(blockedDateId);
    setExceptionStartDate("");
    setExceptionEndDate("");
    setExceptionReason("");
    setUnblockExceptionModalOpen(true);
  };

  const handleCreateException = async () => {
    if (!exceptionBlockedDateId || !exceptionStartDate) {
      toast.error("Preencha os campos obrigatórios!");
      return;
    }

    try {
      setIsCreatingException(true);
      const startDate = new Date(exceptionStartDate);
      const endDate = exceptionEndDate ? new Date(exceptionEndDate) : startDate;

      if (endDate < startDate) {
        toast.error("A data final deve ser maior ou igual à data inicial!");
        return;
      }

      const currentDate = new Date(startDate);
      let count = 0;
      while (currentDate <= endDate) {
        await createException.mutateAsync({
          blockedDateId: exceptionBlockedDateId,
          exceptionDate: new Date(currentDate),
          reason: exceptionReason || undefined,
        });
        currentDate.setDate(currentDate.getDate() + 1);
        count++;
      }

      toast.success(`${count} exceção(ões) criada(s) com sucesso!`);
      setUnblockExceptionModalOpen(false);
      setExceptionBlockedDateId(null);
      setExceptionStartDate("");
      setExceptionEndDate("");
      setExceptionReason("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar exceção");
    } finally {
      setIsCreatingException(false);
    }
  };
  const handleConfirmUnblock = async () => {
    if (!selectedUnblockId || !unblockPassword) {
      toast.error("Digite a senha para desbloquear!");
      return;
    }

    try {
      await deleteBlockedDate.mutateAsync({
        id: selectedUnblockId,
        password: unblockPassword,
      });

      toast.success("Data desbloqueada com sucesso!");
      setSelectedBlockedIds(selectedBlockedIds.filter(id => id !== selectedUnblockId));
      setUnblockModalOpen(false);
      setUnblockPassword("");
      setSelectedUnblockId(null);
      refetch();
    } catch (error: any) {
      console.error("Erro ao desbloquear:", error);
      const errorMessage = error?.data?.zodError?.fieldErrors?.password?.[0] || error?.message || "Erro ao desbloquear data";
      toast.error(errorMessage);
    }
  };

  const handleUnblockMultiple = async () => {
    if (selectedBlockedIds.length === 0) {
      toast.error("Selecione pelo menos uma data para desbloquear!");
      return;
    }

    if (!password) {
      toast.error("Digite a senha primeiro!");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Filtrar apenas IDs válidos que existem na lista atual
      const validIds = selectedBlockedIds.filter(id => 
        blockedDates.some(b => b.id === id)
      );

      if (validIds.length === 0) {
        toast.error("Nenhuma data válida selecionada");
        setIsSubmitting(false);
        return;
      }

      // Executar deletions sequencialmente para evitar travamento
      let successful = 0;
      let failed = 0;
      let lastError: any = null;

      for (const id of validIds) {
        try {
          await deleteBlockedDate.mutateAsync({
            id: id,
            password: password,
          });
          successful++;
        } catch (error: any) {
          failed++;
          lastError = error;
          console.error(`Erro ao desbloquear ID ${id}:`, error);
        }
      }

      // Atualizar UI apenas uma vez no final
      if (successful > 0) {
        toast.success(`${successful} data(s) desbloqueada(s)!`);
        setSelectedBlockedIds([]);
        setSelectAll(false);
        // Invalidar cache apenas uma vez no final
        utils.blockedDates.list.invalidate({ roomId: roomIds.length > 0 ? parseInt(roomIds[0]) : 1 });
      }

      if (failed > 0) {
        const errorMessage = lastError?.data?.zodError?.fieldErrors?.password?.[0] || 
                           lastError?.message || 
                           `${failed} data(s) falharam ao desbloquear`;
        if (successful === 0) {
          toast.error(errorMessage);
        } else {
          toast.warning(errorMessage);
        }
      }
    } catch (error: any) {
      console.error("Erro ao desbloquear múltiplas:", error);
      const errorMessage = error?.data?.zodError?.fieldErrors?.password?.[0] || error?.message || "Erro ao desbloquear datas";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBlockedDate = (id: number) => {
    setSelectedBlockedIds(prev =>
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    if (newSelectAll) {
      setSelectedBlockedIds(blockedDates.map(b => b.id));
    } else {
      setSelectedBlockedIds([]);
    }
    setSelectAll(newSelectAll);
  };

  const toggleRoom = (rid: string) => {
    setRoomIds(prev =>
      prev.includes(rid) ? prev.filter(r => r !== rid) : [...prev, rid]
    );
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-6xl">
        <Link href="/" className="flex items-center gap-2 text-accent hover:text-accent/80 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Calendário de bloqueios */}
          <div className="lg:col-span-1">
            <BlockedDatesCalendar
              blockedDates={blockedDates as any}
              exceptions={exceptions}
              roomId={roomIds.length > 0 ? parseInt(roomIds[0]) : 1}
              onBlockPeriod={async (startDate, endDate, reason) => {
                // Usar datas locais sem conversão UTC
                const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0);
                const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
                for (const rid of roomIds) {
                  await createBlockedDate.mutateAsync({
                    roomId: parseInt(rid),
                    startDate: start,
                    endDate: end,
                    reason: reason || "",
                  });
                }
                refetch();
              }}
            />
          </div>

          {/* Formulário de bloqueio */}
          <Card className="p-6 lg:col-span-1">
            <h1 className="text-2xl font-bold text-foreground mb-6">Bloquear Datas</h1>
            <form onSubmit={handleBlockDate} className="space-y-4">
              <div>
                <Label htmlFor="rooms">Quartos</Label>
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div key={room.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`room-${room.id}`}
                        checked={roomIds.includes(String(room.id))}
                        onCheckedChange={() => toggleRoom(String(room.id))}
                      />
                      <label htmlFor={`room-${room.id}`} className="text-sm cursor-pointer">
                        {room.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="startTime">Hora Inicial</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endTime">Hora Final</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="reason">Motivo do Bloqueio</Label>
                <Input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Manutenção, Evento privado, etc."
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Bloquear
              </Button>
            </form>
          </Card>

          {/* Lista de datas bloqueadas */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Datas Bloqueadas</h2>
              {selectedBlockedIds.length > 0 && (
                <Button
                  onClick={handleUnblockMultiple}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  Desbloquear {selectedBlockedIds.length}
                </Button>
              )}
            </div>

            {blockedDates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma data bloqueada para este quarto
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Selecionar Tudo ({blockedDates.length})
                  </label>
                </div>

                {blockedDates.map((blocked) => (
                  <div
                    key={blocked.id}
                    className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <Checkbox
                      id={`blocked-${blocked.id}`}
                      checked={selectedBlockedIds.includes(blocked.id)}
                      onCheckedChange={() => toggleBlockedDate(blocked.id)}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {new Date(blocked.startDate).toLocaleDateString('pt-BR')} até{" "}
                        {new Date(blocked.endDate).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Motivo: {blocked.reason}
                      </p>
                      {(blocked as any).createdAt && (
                        <p className="text-xs text-gray-500">
                          Criado: {new Date((blocked as any).createdAt).toLocaleString('pt-BR')}
                        </p>
                      )}
                      {observations[blocked.id] && (
                        <div className="text-xs text-gray-600 mt-2 bg-blue-50 p-2 rounded">
                          <p className="font-semibold">Observação:</p>
                          <p>{observations[blocked.id].text}</p>
                          <p className="text-gray-500 mt-1">Editada: {observations[blocked.id].editedAt}</p>
                        </div>
                      )}

                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => handleEditObservation(blocked.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleOpenExceptionModal(blocked.id)}
                        className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
                      >
                        <Unlock className="w-4 h-4" />
                        Desbloquear por Exceção
                      </Button>
                      <Button
                        onClick={() => handleUnblockDate(blocked.id)}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                      >
                        <Unlock className="w-4 h-4" />
                        Desbloquear
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal de Desbloqueio */}
      {unblockModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-4">Desbloquear Data</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="unblockPassword">Senha</Label>
                <div className="relative">
                  <Input
                    id="unblockPassword"
                    type={unblockShowPassword ? "text" : "password"}
                    value={unblockPassword}
                    onChange={(e) => setUnblockPassword(e.target.value)}
                    placeholder="Digite a senha"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setUnblockShowPassword(!unblockShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {unblockShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleConfirmUnblock}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Desbloquear
                </Button>
                <Button
                  onClick={() => {
                    setUnblockModalOpen(false);
                    setUnblockPassword("");
                    setSelectedUnblockId(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
        )}

      {/* Modal de Edição */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">Editar Data Bloqueada</h2>
            
            {/* Tabs para alternar entre edição de observação e datas */}
            <div className="flex gap-2 mb-6 border-b">
              <button
                onClick={() => setEditMode('observation')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  editMode === 'observation'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Observação
              </button>
              <button
                onClick={() => setEditMode('dates')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  editMode === 'dates'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Datas
              </button>
            </div>
            
            <div className="space-y-4">
              {editMode === 'observation' ? (
                <>
                  <div>
                    <Label htmlFor="editObservation">Observação</Label>
                    <textarea
                      id="editObservation"
                      value={editObservation}
                      onChange={(e) => setEditObservation(e.target.value)}
                      placeholder="Digite a observação"
                      className="w-full px-3 py-2 border rounded-md min-h-24 text-foreground"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editStartDate">Data Inicial</Label>
                      <Input
                        id="editStartDate"
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="text-foreground"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editEndDate">Data Final</Label>
                      <Input
                        id="editEndDate"
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="text-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="editReason">Motivo</Label>
                    <Input
                      id="editReason"
                      type="text"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      placeholder="Ex: Manutenção, Reforma, etc"
                      className="text-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editRoom">Quarto (Mudança de Quarto)</Label>
                    <Select value={editRoomId} onValueChange={setEditRoomId}>
                      <SelectTrigger id="editRoom" className="text-foreground">
                        <SelectValue placeholder="Selecione o quarto" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.name} ({room.type === 'private' ? 'Privado' : room.type === 'shared' ? 'Compartilhado' : 'Dormitório'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ao alterar o quarto, o bloqueio será movido automaticamente para o novo quarto selecionado.
                    </p>
                  </div>
                </>
              )}
              
              <div>
                <Label htmlFor="editPassword">Senha</Label>
                <div className="relative">
                  <Input
                    id="editPassword"
                    type={editShowPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Digite a senha"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setEditShowPassword(!editShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {editShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleConfirmEditObservation}
                  disabled={isEditingSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isEditingSubmitting ? "Salvando..." : "Editar"}
                </Button>
                <Button
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditPassword("");
                    setEditingId(null);
                    setEditMode('observation');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Desbloquear por Exceção */}
      {unblockExceptionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-4">Desbloquear Período por Exceção</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="exceptionStartDate">Data Inicial</Label>
                <Input
                  id="exceptionStartDate"
                  type="date"
                  value={exceptionStartDate}
                  onChange={(e) => setExceptionStartDate(e.target.value)}
                  className="text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="exceptionEndDate">Data Final (Opcional)</Label>
                <Input
                  id="exceptionEndDate"
                  type="date"
                  value={exceptionEndDate}
                  onChange={(e) => setExceptionEndDate(e.target.value)}
                  placeholder="Deixe em branco para uma única data"
                  className="text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="exceptionReason">Motivo do Desbloqueio (Opcional)</Label>
                <Input
                  id="exceptionReason"
                  type="text"
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  placeholder="Ex: Reserva cancelada, Erro de bloqueio"
                  className="text-foreground"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateException}
                  disabled={isCreatingException}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isCreatingException ? "Criando..." : "Desbloquear"}
                </Button>
                <Button
                  onClick={() => {
                    setUnblockExceptionModalOpen(false);
                    setExceptionBlockedDateId(null);
                    setExceptionStartDate("");
                    setExceptionEndDate("");
                    setExceptionReason("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
