import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface BlockedDate {
  id: number;
  startDate: Date | string;
  endDate: Date | string;
  roomId: number;
  reason: string;
  createdAt?: Date | string;
  observation?: string;
}

interface BlockedDatesCalendarProps {
  blockedDates: BlockedDate[];
  roomId: number;
  onBlockPeriod: (startDate: Date, endDate: Date, reason: string) => Promise<void>;
}

export default function BlockedDatesCalendar({
  blockedDates,
  roomId,
  onBlockPeriod,
}: BlockedDatesCalendarProps) {
  const [selectedRange, setSelectedRange] = useState<[Date, Date] | null>(null);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Normalizar data para comparação (usar UTC para evitar shift de timezone)
  const normalizeDate = (date: Date | string): Date => {
    if (typeof date === 'string') {
      // Se for ISO string (ex: "2026-05-01T00:00:00.000Z"), extrair apenas a data
      if (date.includes('T')) {
        const dateOnly = date.split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      }
      // Se for YYYY-MM-DD, usar UTC
      const [year, month, day] = date.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }
    // Se for Date object, usar UTC getters
    const d = new Date(date);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  };

  // Verificar se uma data está bloqueada
  const isDateBlocked = (date: Date): boolean => {
    // Usar UTC para evitar shift de timezone
    const normalizedDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
    
    return blockedDates.some(blocked => {
      const blockedStart = normalizeDate(blocked.startDate);
      const blockedEnd = normalizeDate(blocked.endDate);
      
      // Uma data está bloqueada se estiver entre startDate e endDate (exclusive)
      // Check-out nao bloqueia (hospede sai naquele dia)
      return normalizedDate >= blockedStart && normalizedDate < blockedEnd;
    });
  };

  // Obter classe CSS para a data
  const getTileClassName = (date: Date) => {
    if (isDateBlocked(date)) {
      return 'bg-red-500 text-white rounded-md relative';
    }
    return '';
  };

  // Renderizar conteúdo do tile com ícone
  const getTileContent = (date: Date) => {
    if (isDateBlocked(date)) {
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xl">🔒</span>
        </div>
      );
    }
    return null;
  };

  // Lidar com seleção de intervalo
  const handleDateChange = (value: any) => {
    if (Array.isArray(value)) {
      setSelectedRange([value[0], value[1]]);
    } else if (value) {
      setSelectedRange([value, value]);
    }
  };

  // Bloquear período selecionado
  const handleBlockPeriod = async () => {
    if (!selectedRange || !reason.trim()) {
      toast.error('Selecione um período e adicione um motivo');
      return;
    }

    const [startDate, endDate] = selectedRange;
    if (startDate > endDate) {
      toast.error('Data inicial deve ser anterior à data final');
      return;
    }

    try {
      setIsLoading(true);
      await onBlockPeriod(startDate, endDate, reason);
      toast.success('Período bloqueado com sucesso!');
      setSelectedRange(null);
      setReason('');
    } catch (error) {
      toast.error('Erro ao bloquear período');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Calendário de Bloqueios</h3>
        
        <div className="flex justify-center">
          <Calendar
            selectRange
            value={selectedRange}
            onChange={handleDateChange}
            tileClassName={({ date }) => getTileClassName(date)}
            tileContent={({ date }) => getTileContent(date)}
            minDate={new Date()}
          />
        </div>

        {selectedRange && (
          <div className="space-y-3 border-t pt-4">
            <div>
              <p className="text-sm font-medium">
                Período selecionado: {selectedRange[0].toLocaleDateString('pt-BR')} até{' '}
                {selectedRange[1].toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Motivo do bloqueio</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Manutenção, Evento privado"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleBlockPeriod}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Bloqueando...' : 'Bloquear Período'}
              </Button>
              <Button
                onClick={() => {
                  setSelectedRange(null);
                  setReason('');
                }}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>Datas em <span className="inline-block w-3 h-3 bg-red-500 rounded"></span> estão bloqueadas</p>
        </div>

        {blockedDates.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <h4 className="font-medium text-sm">Datas Bloqueadas</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {blockedDates.map((blocked) => {
                const startDate = normalizeDate(blocked.startDate);
                const endDate = normalizeDate(blocked.endDate);
                const createdAt = blocked.createdAt ? new Date(blocked.createdAt) : null;
                
                return (
                  <div key={blocked.id} className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
                    <p className="font-medium">{startDate.toLocaleDateString('pt-BR')} até {endDate.toLocaleDateString('pt-BR')}</p>
                    <p className="text-gray-600">Motivo: {blocked.reason}</p>
                    {createdAt && (
                      <p className="text-gray-500">Criado: {createdAt.toLocaleString('pt-BR')}</p>
                    )}
                    {blocked.observation && (
                      <p className="text-gray-600 mt-1">Obs: {blocked.observation}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
