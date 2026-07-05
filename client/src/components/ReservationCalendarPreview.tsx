import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import { Card } from '@/components/ui/card';
import 'react-calendar/dist/Calendar.css';

interface ReservationCalendarPreviewProps {
  checkInDate: string;
  checkOutDate: string;
  roomId: number;
  currentBookingId?: number;
  blockedDates: Array<{
    id: number;
    startDate: Date | string;
    endDate: Date | string;
    roomId: number;
    bookingId?: number | null;
    reason?: string | null;
  }>;
  onConflictChange?: (hasConflict: boolean, conflictDates: string[]) => void;
}

export default function ReservationCalendarPreview({
  checkInDate,
  checkOutDate,
  roomId,
  currentBookingId,
  blockedDates,
  onConflictChange,
}: ReservationCalendarPreviewProps) {
  const [displayMonth, setDisplayMonth] = useState(new Date());

  // Normalizar data para comparacao
  const normalizeDate = (date: Date | string): Date => {
    if (typeof date === 'string') {
      let dateOnly = date;
      if (date.includes('T')) {
        dateOnly = date.split('T')[0];
      } else if (date.includes(' ')) {
        dateOnly = date.split(' ')[0];
      }
      const [year, month, day] = dateOnly.split('-').map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return new Date();
      }
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  };

  // Converter string de data para Date
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  const checkIn = parseDate(checkInDate);
  const checkOut = parseDate(checkOutDate);

  // Filtrar bloqueios relevantes (mesmo quarto, excluindo bloqueio da reserva atual)
  const relevantBlockedDates = useMemo(() => {
    return blockedDates.filter(bd => {
      if (bd.roomId !== roomId) return false;
      // Excluir bloqueio da propria reserva sendo editada
      if (currentBookingId && bd.bookingId === currentBookingId) return false;
      return true;
    });
  }, [blockedDates, roomId, currentBookingId]);

  // Detectar conflitos entre datas da reserva e bloqueios existentes
  const conflicts = useMemo(() => {
    if (!checkIn || !checkOut) return [];
    
    const conflictDates: string[] = [];
    const current = new Date(checkIn);
    
    while (current < checkOut) {
      const normalized = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, 0, 0);
      
      const isBlocked = relevantBlockedDates.some(blocked => {
        const blockedStart = normalizeDate(blocked.startDate);
        const blockedEnd = normalizeDate(blocked.endDate);
        return normalized >= blockedStart && normalized < blockedEnd;
      });
      
      if (isBlocked) {
        const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        conflictDates.push(dateStr);
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return conflictDates;
  }, [checkIn, checkOut, relevantBlockedDates]);

  // Notificar componente pai sobre conflitos
  React.useEffect(() => {
    if (onConflictChange) {
      onConflictChange(conflicts.length > 0, conflicts);
    }
  }, [conflicts, onConflictChange]);

  // Verificar se uma data esta na reserva
  const isReservationDate = (date: Date): boolean => {
    if (!checkIn || !checkOut) return false;
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    return normalized >= checkIn && normalized < checkOut;
  };

  // Verificar se uma data esta bloqueada (por outras reservas)
  const isBlockedDate = (date: Date): boolean => {
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    
    return relevantBlockedDates.some(blocked => {
      const blockedStart = normalizeDate(blocked.startDate);
      const blockedEnd = normalizeDate(blocked.endDate);
      return normalized >= blockedStart && normalized < blockedEnd;
    });
  };

  // Verificar se uma data tem conflito (reserva + bloqueio)
  const isConflictDate = (date: Date): boolean => {
    return isReservationDate(date) && isBlockedDate(date);
  };

  // Classe CSS para cada dia
  const getTileClassName = ({ date }: { date: Date }) => {
    const classes: string[] = [];

    if (isConflictDate(date)) {
      classes.push('bg-orange-500 text-white font-bold animate-pulse');
    } else if (isReservationDate(date)) {
      classes.push('bg-blue-500 text-white font-semibold');
    } else if (isBlockedDate(date)) {
      classes.push('bg-red-300 text-red-900');
    }

    return classes.join(' ');
  };

  // Tooltip para cada dia
  const getTileContent = ({ date }: { date: Date }) => {
    if (isConflictDate(date)) {
      return <span className="text-xs">CONFLITO</span>;
    }
    if (isReservationDate(date)) {
      return <span className="text-xs">Reserva</span>;
    }
    if (isBlockedDate(date)) {
      return <span className="text-xs">Bloqueado</span>;
    }
    return null;
  };

  return (
    <Card className="p-4 bg-white">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">Preview do Calendario</h3>
          <p className="text-xs text-gray-600 mb-3">
            Visualize as datas que serao bloqueadas para este quarto
          </p>
        </div>

        {/* Alerta de Conflito */}
        {conflicts.length > 0 && (
          <div className="p-3 bg-orange-50 border-2 border-orange-400 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-600 text-lg font-bold">⚠️</span>
              <h4 className="text-sm font-bold text-orange-800">CONFLITO DE DATAS DETECTADO!</h4>
            </div>
            <p className="text-xs text-orange-700 mb-2">
              As seguintes datas ja estao bloqueadas para este quarto:
            </p>
            <div className="flex flex-wrap gap-1">
              {conflicts.map(date => (
                <span key={date} className="px-2 py-0.5 bg-orange-200 text-orange-800 rounded text-xs font-mono">
                  {date.split('-').reverse().join('/')}
                </span>
              ))}
            </div>
            <p className="text-xs text-orange-700 mt-2 font-semibold">
              Resolva o conflito antes de salvar: altere as datas ou desbloqueie no calendario de bloqueios.
            </p>
          </div>
        )}

        <div className="border rounded-lg p-3 bg-gray-50">
          <Calendar
            value={displayMonth}
            onChange={(value) => {
              if (value instanceof Date) {
                setDisplayMonth(value);
              }
            }}
            view="month"
            navigationLabel={({ date }) =>
              date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            }
            prevLabel="<"
            nextLabel=">"
            tileClassName={getTileClassName}
            tileContent={getTileContent}
            className="w-full react-calendar"
          />
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Datas da reserva ({checkInDate} ate {checkOutDate})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-300 rounded"></div>
            <span>Datas bloqueadas por outras reservas</span>
          </div>
          {conflicts.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded animate-pulse"></div>
              <span className="font-bold text-orange-700">Datas em conflito ({conflicts.length} dia{conflicts.length > 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        .react-calendar__tile {
          padding: 0.5rem;
          font-size: 0.75rem;
          height: auto;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.25rem;
        }
        .react-calendar__tile--now {
          background: #e0e7ff;
        }
        .react-calendar__tile--active {
          background: none;
        }
      `}</style>
    </Card>
  );
}
