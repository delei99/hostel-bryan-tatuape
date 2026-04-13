import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Lock, Unlock, Plus } from "lucide-react";
import { Link } from "wouter";

export default function BlockedDates() {
  const [roomId, setRoomId] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar quartos
  const { data: rooms = [] } = trpc.rooms.list.useQuery();
  
  // Buscar datas bloqueadas
  const { data: blockedDates = [], refetch } = trpc.blockedDates.list.useQuery(
    { roomId: parseInt(roomId) },
    { enabled: !!roomId }
  );

  const createBlockedDate = trpc.blockedDates.create.useMutation();
  const deleteBlockedDate = trpc.blockedDates.delete.useMutation();

  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate || !password) {
      toast.error("Preencha todos os campos!");
      return;
    }

    try {
      setIsSubmitting(true);
      await createBlockedDate.mutateAsync({
        roomId: parseInt(roomId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        password,
      });

      toast.success("Data bloqueada com sucesso!");
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
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao desbloquear data");
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl">
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
                <Label htmlFor="roomId">Quarto</Label>
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(room => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha"
                  required
                />
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
            <h2 className="text-2xl font-bold text-foreground mb-6">Datas Bloqueadas</h2>

            {blockedDates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma data bloqueada para este quarto
              </p>
            ) : (
              <div className="space-y-3">
                {blockedDates.map((blocked) => (
                  <div
                    key={blocked.id}
                    className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div>
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
