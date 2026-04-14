'use client';

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
  const [roomIds, setRoomIds] = useState<string[]>(["1"]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBlockedIds, setSelectedBlockedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Buscar quartos
  const { data: rooms = [] } = trpc.rooms.list.useQuery();
  
  // Buscar datas bloqueadas
  const { data: blockedDates = [], refetch } = trpc.blockedDates.list.useQuery(
    { roomId: roomIds.length > 0 ? parseInt(roomIds[0]) : 1 },
    { enabled: roomIds.length > 0 }
  );

  const createBlockedDate = trpc.blockedDates.create.useMutation();
  const deleteBlockedDate = trpc.blockedDates.delete.useMutation();

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

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      toast.error("Data inicial deve ser anterior a data final!");
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
          password,
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

  const handleUnblockDate = async (blockedDateId: number) => {
    const pwd = prompt("Digite a senha para desbloquear:");
    if (!pwd) return;

    try {
      await deleteBlockedDate.mutateAsync({
        blockedDateId,
        password: pwd,
      });

      toast.success("Data desbloqueada com sucesso!");
      setSelectedBlockedIds(selectedBlockedIds.filter(id => id !== blockedDateId));
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao desbloquear data");
    }
  };

  const handleUnblockMultiple = async () => {
    if (selectedBlockedIds.length === 0) {
      toast.error("Selecione pelo menos uma data para desbloquear!");
      return;
    }

    const pwd = prompt("Digite a senha para desbloquear:");
    if (!pwd) return;

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

      // Usar Promise.all em vez de loop sequencial
      await Promise.all(
        validIds.map(id =>
          deleteBlockedDate.mutateAsync({
            blockedDateId: id,
            password: pwd,
          })
        )
      );

      toast.success(`${validIds.length} data(s) desbloqueada(s)!`);
      setSelectedBlockedIds([]);
      setSelectAll(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao desbloquear datas");
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
              blockedDates={blockedDates}
              roomId={roomIds.length > 0 ? parseInt(roomIds[0]) : 1}
              onBlockPeriod={async (startDate, endDate, reason) => {
                // Usar datas locais sem conversão UTC
                const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0);
                const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1, 0, 0, 0, 0);
                for (const rid of roomIds) {
                  await createBlockedDate.mutateAsync({
                    roomId: parseInt(rid),
                    startDate: start,
                    endDate: end,
                    reason,
                    password,
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
                    </div>
                    <Button
                      onClick={() => handleUnblockDate(blocked.id)}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    >
                      <Unlock className="w-4 h-4" />
                      Desbloquear
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
