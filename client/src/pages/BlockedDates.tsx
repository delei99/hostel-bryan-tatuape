'use client';

import { useState } from "react";
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

export default function BlockedDates() {
  const [roomIds, setRoomIds] = useState<string[]>(["1"]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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

  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate || !password || roomIds.length === 0) {
      toast.error("Preencha todos os campos!");
      return;
    }

    try {
      setIsSubmitting(true);
      // Bloquear para todos os quartos selecionados
      for (const rid of roomIds) {
        await createBlockedDate.mutateAsync({
          roomId: parseInt(rid),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          password,
        });
      }

      toast.success(`Data bloqueada em ${roomIds.length} quarto(s)!`);
      setStartDate("");
      setEndDate("");
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
      for (const id of selectedBlockedIds) {
        await deleteBlockedDate.mutateAsync({
          blockedDateId: id,
          password: pwd,
        });
      }

      toast.success(`${selectedBlockedIds.length} data(s) desbloqueada(s)!`);
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
    if (selectAll) {
      setSelectedBlockedIds([]);
    } else {
      setSelectedBlockedIds(blockedDates.map(b => b.id));
    }
    setSelectAll(!selectAll);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de bloqueio */}
          <Card className="p-6 lg:col-span-1">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Bloquear Data
            </h2>

            <form onSubmit={handleBlockDate} className="space-y-4">
              <div>
                <Label>Quartos (Múltipla Seleção)</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {rooms.map(room => (
                    <div key={room.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`room-${room.id}`}
                        checked={roomIds.includes(room.id.toString())}
                        onCheckedChange={() => toggleRoom(room.id.toString())}
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
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                {isSubmitting ? "Bloqueando..." : "Bloquear Data"}
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
