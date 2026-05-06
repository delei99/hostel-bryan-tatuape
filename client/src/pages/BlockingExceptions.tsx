import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Calendar } from "lucide-react";
import { Link } from "wouter";

export default function BlockingExceptions() {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("1");
  const [selectedBlockedDateId, setSelectedBlockedDateId] = useState<string>("");
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionEndDate, setExceptionEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Buscar quartos
  const { data: rooms = [] } = trpc.rooms.list.useQuery();

  // Buscar datas bloqueadas do quarto selecionado
  const { data: blockedDates = [] } = trpc.blockedDates.list.useQuery(
    { roomId: parseInt(selectedRoomId) },
    { enabled: !!selectedRoomId }
  );

  // Resetar seleção de bloqueio quando mudar de quarto
  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSelectedBlockedDateId("");
  };

  // Buscar exceções da data bloqueada selecionada
  const { data: exceptions = [], refetch: refetchExceptions } = trpc.blockingExceptions.getByBlockedDate.useQuery(
    { blockedDateId: parseInt(selectedBlockedDateId) },
    { enabled: !!selectedBlockedDateId }
  );

  const createException = trpc.blockingExceptions.create.useMutation();
  const deleteException = trpc.blockingExceptions.delete.useMutation();

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!exceptionDate) {
      toast.error("Preencha a data da exceção!");
      return;
    }
    
    if (!selectedBlockedDateId) {
      toast.error("Selecione um período bloqueado!");
      return;
    }

    const startDate = new Date(exceptionDate);
    const endDate = exceptionEndDate ? new Date(exceptionEndDate) : startDate;
    
    if (endDate < startDate) {
      toast.error("A data final deve ser maior ou igual à data inicial!");
      return;
    }

    try {
      setIsAdding(true);
      
      if (exceptionEndDate) {
        const currentDate = new Date(startDate);
        let count = 0;
        while (currentDate <= endDate) {
          await createException.mutateAsync({
            blockedDateId: parseInt(selectedBlockedDateId),
            exceptionDate: new Date(currentDate),
            reason: reason || undefined,
          });
          currentDate.setDate(currentDate.getDate() + 1);
          count++;
        }
        toast.success(`${count} exceção(ões) adicionada(s) com sucesso!`);
      } else {
        await createException.mutateAsync({
          blockedDateId: parseInt(selectedBlockedDateId),
          exceptionDate: startDate,
          reason: reason || undefined,
        });
        toast.success("Exceção adicionada com sucesso!");
      }
      
      setExceptionDate("");
      setExceptionEndDate("");
      setReason("");
      refetchExceptions();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar exceção");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteException = async (exceptionId: number) => {
    if (!confirm("Tem certeza que deseja deletar esta exceção?")) return;

    try {
      await deleteException.mutateAsync({ exceptionId });
      toast.success("Exceção deletada com sucesso!");
      refetchExceptions();
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar exceção");
    }
  };

  const selectedBlocking = blockedDates.find(bd => bd.id === parseInt(selectedBlockedDateId));

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl">
        <Link href="/admin/bloqueios" className="flex items-center gap-2 text-accent hover:text-accent/80 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Bloqueios
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-8">Gerenciar Exceções de Bloqueio</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulário */}
          <Card className="p-6 lg:col-span-1">
            <h2 className="text-xl font-bold text-foreground mb-6">Adicionar Exceção</h2>
            <form onSubmit={handleAddException} className="space-y-4">
              <div>
                <Label htmlFor="room">Quarto</Label>
                <Select value={selectedRoomId} onValueChange={handleRoomChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um quarto" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="blockedDate">Período Bloqueado</Label>
                <Select value={selectedBlockedDateId} onValueChange={setSelectedBlockedDateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um bloqueio" />
                  </SelectTrigger>
                  <SelectContent>
                    {blockedDates.map((bd) => (
                      <SelectItem key={bd.id} value={String(bd.id)}>
                        {new Date(bd.startDate).toLocaleDateString("pt-BR")} a{" "}
                        {new Date(bd.endDate).toLocaleDateString("pt-BR")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="exceptionDate">Data Inicial da Exceção</Label>
                <Input
                  type="date"
                  value={exceptionDate}
                  onChange={(e) => setExceptionDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="exceptionEndDate">Data Final da Exceção (Opcional)</Label>
                <Input
                  type="date"
                  value={exceptionEndDate}
                  onChange={(e) => setExceptionEndDate(e.target.value)}
                  placeholder="Deixe em branco para uma única data"
                />
              </div>

              <div>
                <Label htmlFor="reason">Motivo (Opcional)</Label>
                <Input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Limpeza especial"
                />
              </div>

              <Button
                type="submit"
                disabled={isAdding}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {isAdding ? "Adicionando..." : "Adicionar Exceção"}
              </Button>
            </form>
          </Card>

          {/* Lista de Exceções */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Exceções
              {selectedBlocking && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({new Date(selectedBlocking.startDate).toLocaleDateString("pt-BR")} a{" "}
                  {new Date(selectedBlocking.endDate).toLocaleDateString("pt-BR")})
                </span>
              )}
            </h2>

            {!selectedBlockedDateId ? (
              <p className="text-muted-foreground text-center py-8">
                Selecione um período bloqueado para ver suas exceções
              </p>
            ) : exceptions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma exceção adicionada para este bloqueio
              </p>
            ) : (
              <div className="space-y-3">
                {exceptions.map((exception) => (
                  <div
                    key={exception.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-foreground">
                          {new Date(String(exception.exceptionDate).split('T')[0] + 'T00:00:00').toLocaleDateString("pt-BR")}
                        </p>
                        {exception.reason && (
                          <p className="text-sm text-muted-foreground">{exception.reason}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteException(exception.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deletar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Informações */}
        <Card className="p-6 mt-6 bg-blue-50">
          <h3 className="text-lg font-bold text-foreground mb-2">ℹ️ Como Funciona</h3>
          <p className="text-sm text-foreground">
            Exceções permitem desbloquear datas específicas dentro de um período bloqueado. Por exemplo, se você bloqueou
            um período para manutenção mas quer permitir reservas em um dia específico, adicione uma exceção para esse dia.
          </p>
        </Card>
      </div>
    </div>
  );
}
