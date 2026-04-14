'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Shield, Lock } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AccessControl() {
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // Buscar usuários
  const { data: users = [] } = trpc.auth.me.useQuery();

  const toggleUser = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-6xl">
        <Link href="/" className="flex items-center gap-2 text-accent hover:text-accent/80 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Painel de Controle de Acesso */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-6 h-6 text-accent" />
              <h1 className="text-2xl font-bold text-foreground">Controle de Acesso</h1>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Permissões de Bloqueio</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure quem pode bloquear e desbloquear datas no hostel.
                </p>

                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Senha de Acesso</h3>
                    </div>
                    <p className="text-sm text-blue-800">
                      Atualmente, qualquer usuário autenticado pode bloquear/desbloquear datas com a senha correta.
                    </p>
                    <p className="text-xs text-blue-700 mt-2">
                      Senha padrão: <code className="bg-blue-100 px-2 py-1 rounded">Capacho@69</code>
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h3 className="font-semibold text-amber-900 mb-2">Recomendações de Segurança</h3>
                    <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                      <li>Altere a senha padrão regularmente</li>
                      <li>Use uma senha forte e única</li>
                      <li>Compartilhe a senha apenas com administradores confiáveis</li>
                      <li>Monitore os logs de auditoria regularmente</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Informações de Segurança */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Informações de Segurança</h2>

            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Auditoria Ativa</h3>
                <p className="text-sm text-green-800">
                  Todas as ações de bloqueio/desbloqueio são registradas com:
                </p>
                <ul className="text-sm text-green-800 mt-2 space-y-1 list-disc list-inside">
                  <li>Data e hora exata</li>
                  <li>Usuário que realizou a ação</li>
                  <li>Endereço IP</li>
                  <li>Tipo de ação (bloqueio/desbloqueio)</li>
                  <li>Datas e motivo do bloqueio</li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-2">Próximas Funcionalidades</h3>
                <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                  <li>Controle de acesso por usuário</li>
                  <li>Gerenciamento de permissões</li>
                  <li>Alertas de atividade suspeita</li>
                  <li>Relatórios de conformidade</li>
                </ul>
              </div>

              <Button
                onClick={() => toast.info("Redirecionando para logs de auditoria...")}
                className="w-full bg-accent hover:bg-accent/90 text-white"
              >
                Ver Logs de Auditoria
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
