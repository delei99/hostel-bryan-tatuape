import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface BlockedDate {
  id: number;
  startDate: Date | string;
  endDate: Date | string;
  roomId: number;
  reason: string;
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

  // Normalizar data para comparação
  const normalizeDate = (date: Date | string): Date => {
    if (typeof date === 'string') {
      const [year, month, day] = date.split('-').map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  };

  // Verificar se uma data está bloqueada
  const isDateBlocked = (date: Date): boolean => {
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    
    return blockedDates.some(blocked => {
      const blockedStart = normalizeDate(blocked.startDate);
      const blockedEnd = normalizeDate(blocked.endDate);
      
      // Comparar apenas as datas (sem horas)
      // Uma data está bloqueada se estiver entre startDate e endDate (inclusive)
      return normalizedDate >= blockedStart && normalizedDate <= blockedEnd;
    });
  };

  // Obter classe CSS para a data
  const getTileClassName = (date: Date) => {
    if (isDateBlocked(date)) {
      return 'bg-red-500 text-white rounded-md';
    }
    return '';
  };

  // Lidar com seleção de intervalo
  const handleDateChange = (value: Date | [Date, Date]) => {
    if (Array.isArray(value)) {
      setSelectedRange([value[0], value[1]]);
    } else {
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
      </div>
    </Card>
  );
}
