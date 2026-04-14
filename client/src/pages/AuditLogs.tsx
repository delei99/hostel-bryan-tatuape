'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "wouter";

export default function AuditLogs() {
  const [roomId, setRoomId] = useState<string>("");
  const [action, setAction] = useState<"block" | "unblock" | "">("");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Buscar quartos
  const { data: rooms = [] } = trpc.rooms.list.useQuery();

  // Buscar logs de auditoria
  const { data: logs = [], isLoading } = trpc.auditLogs.list.useQuery(
    {
      roomId: roomId && roomId !== "0" ? parseInt(roomId) : undefined,
      action: action ? action : undefined,
      limit,
      offset,
    },
    { enabled: true }
  );

  const handleExport = () => {
    const csv = [
      ["Data/Hora", "Ação", "Quarto", "Motivo", "Usuário", "IP", "User Agent"],
      ...logs.map(log => [
        new Date(log.createdAt).toLocaleString('pt-BR'),
        log.action === "block" ? "Bloqueado" : "Desbloqueado",
        log.roomId,
        log.reason || "-",
        log.userId,
        log.ipAddress || "-",
        log.userAgent?.substring(0, 50) || "-",
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-6xl">
        <Link href="/" className="flex items-center gap-2 text-accent hover:text-accent/80 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">Logs de Auditoria</h1>
            <Button
              onClick={handleExport}
              disabled={logs.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>

          {/* Filtros */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Quarto</label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os quartos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todos os quartos</SelectItem>
                  {rooms.map(room => (
                    <SelectItem key={room.id} value={String(room.id)}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Ação</label>
              <Select value={action} onValueChange={(val) => setAction(val === "all" ? "" : (val as "block" | "unblock"))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="block">Bloqueado</SelectItem>
                  <SelectItem value="unblock">Desbloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Registros por página</label>
              <Select value={String(limit)} onValueChange={(val) => setLimit(parseInt(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela de logs */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum log encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Data/Hora</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Ação</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Quarto</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Período</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Motivo</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Usuário</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          log.action === "block" 
                            ? "bg-red-100 text-red-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {log.action === "block" ? "Bloqueado" : "Desbloqueado"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">{log.roomId}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {log.startDate && log.endDate ? (
                          <>
                            {new Date(log.startDate).toLocaleDateString('pt-BR')} até{" "}
                            {new Date(log.endDate).toLocaleDateString('pt-BR')}
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{log.reason || "-"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{log.userId}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{log.ipAddress || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {logs.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Mostrando {offset + 1} a {Math.min(offset + limit, offset + logs.length)} registros
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  variant="outline"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => setOffset(offset + limit)}
                  disabled={logs.length < limit}
                  variant="outline"
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
