'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, AlertTriangle, Shield, Clock, MapPin } from "lucide-react";
import { Link } from "wouter";

interface SecurityAlert {
  id: number;
  type: "suspicious_activity" | "failed_attempts" | "system_alert";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  ipAddress?: string;
  attemptCount?: number;
  createdAt: Date;
  resolved: boolean;
}

export default function SecurityAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [filter, setFilter] = useState<"all" | "unresolved" | "critical">("unresolved");

  // Simular alertas de segurança
  useEffect(() => {
    const mockAlerts: SecurityAlert[] = [
      {
        id: 1,
        type: "suspicious_activity",
        severity: "high",
        title: "🚨 Múltiplas Tentativas de Desbloqueio Falhadas",
        description: "3 tentativas de desbloqueio com senha incorreta detectadas em 5 minutos",
        ipAddress: "192.168.1.100",
        attemptCount: 3,
        createdAt: new Date(Date.now() - 10 * 60000),
        resolved: false,
      },
      {
        id: 2,
        type: "failed_attempts",
        severity: "medium",
        title: "Tentativa de Acesso Não Autorizado",
        description: "Senha incorreta utilizada para desbloquear data",
        ipAddress: "10.0.0.50",
        attemptCount: 1,
        createdAt: new Date(Date.now() - 30 * 60000),
        resolved: false,
      },
      {
        id: 3,
        type: "system_alert",
        severity: "low",
        title: "Limpeza de Logs Antiga Concluída",
        description: "Registros de tentativas falhadas com mais de 24 horas foram removidos",
        createdAt: new Date(Date.now() - 2 * 60 * 60000),
        resolved: true,
      },
    ];
    setAlerts(mockAlerts);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === "unresolved") return !alert.resolved;
    if (filter === "critical") return alert.severity === "critical" || alert.severity === "high";
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === "critical" || severity === "high") {
      return <AlertTriangle className="w-5 h-5" />;
    }
    return <Shield className="w-5 h-5" />;
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
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-foreground">Alertas de Segurança</h1>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {filteredAlerts.length} alerta{filteredAlerts.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              onClick={() => setFilter("all")}
              variant={filter === "all" ? "default" : "outline"}
              className="gap-2"
            >
              Todos ({alerts.length})
            </Button>
            <Button
              onClick={() => setFilter("unresolved")}
              variant={filter === "unresolved" ? "default" : "outline"}
              className="gap-2"
            >
              Não Resolvidos ({alerts.filter(a => !a.resolved).length})
            </Button>
            <Button
              onClick={() => setFilter("critical")}
              variant={filter === "critical" ? "default" : "outline"}
              className="gap-2 bg-red-600 hover:bg-red-700"
            >
              Críticos ({alerts.filter(a => a.severity === "critical" || a.severity === "high").length})
            </Button>
          </div>

          {/* Lista de alertas */}
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">Nenhum alerta de segurança</p>
              <p className="text-muted-foreground text-sm mt-2">Seu sistema está seguro!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)} ${
                    alert.resolved ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{alert.title}</h3>
                        <p className="text-sm mt-1">{alert.description}</p>
                        <div className="flex items-center gap-4 mt-3 flex-wrap text-xs">
                          {alert.ipAddress && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>IP: {alert.ipAddress}</span>
                            </div>
                          )}
                          {alert.attemptCount && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>{alert.attemptCount} tentativa{alert.attemptCount !== 1 ? "s" : ""}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {Math.floor((Date.now() - alert.createdAt.getTime()) / 60000)} min atrás
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {alert.resolved && (
                        <Badge className="bg-green-600 text-white">Resolvido</Badge>
                      )}
                      {!alert.resolved && (
                        <Badge className={`${
                          alert.severity === "critical" || alert.severity === "high"
                            ? "bg-red-600"
                            : "bg-yellow-600"
                        } text-white`}>
                          Ativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recomendações de Segurança */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Recomendações de Segurança</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Monitore regularmente os alertas de segurança</li>
              <li>Altere a senha de admin periodicamente</li>
              <li>Revise os logs de auditoria para atividades suspeitas</li>
              <li>Implemente autenticação de dois fatores quando disponível</li>
              <li>Mantenha registros de segurança por pelo menos 30 dias</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
