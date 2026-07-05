import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { Card } from '@/components/ui/card';
import 'react-calendar/dist/Calendar.css';

interface ReservationCalendarPreviewProps {
  checkInDate: string;
  checkOutDate: string;
  roomId: number;
  blockedDates: Array<{
    id: number;
    startDate: Date | string;
    endDate: Date | string;
    roomId: number;
  }>;
}

export default function ReservationCalendarPreview({
  checkInDate,
  checkOutDate,
  roomId,
  blockedDates,
}: ReservationCalendarPreviewProps) {
  const [displayMonth, setDisplayMonth] = useState(new Date());

  // Normalizar data para comparação
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

  // Verificar se uma data está na reserva
  const isReservationDate = (date: Date): boolean => {
    if (!checkIn || !checkOut) return false;
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    return normalized >= checkIn && normalized < checkOut;
  };

  // Verificar se uma data está bloqueada (por outras reservas)
  const isBlockedDate = (date: Date): boolean => {
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    
    return blockedDates
      .filter(bd => bd.roomId === roomId)
      .some(blocked => {
        const blockedStart = normalizeDate(blocked.startDate);
        const blockedEnd = normalizeDate(blocked.endDate);
        return normalized >= blockedStart && normalized < blockedEnd;
      });
  };

  // Classe CSS para cada dia
  const getTileClassName = ({ date }: { date: Date }) => {
    const classes: string[] = [];

    if (isReservationDate(date)) {
      classes.push('bg-blue-500 text-white font-semibold');
    } else if (isBlockedDate(date)) {
      classes.push('bg-red-300 text-red-900');
    }

    return classes.join(' ');
  };

  // Tooltip para cada dia
  const getTileContent = ({ date }: { date: Date }) => {
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
          <h3 className="text-sm font-semibold mb-2">Preview do Calendário</h3>
          <p className="text-xs text-gray-600 mb-3">
            Visualize as datas que serão bloqueadas para este quarto
          </p>
        </div>

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
            prevLabel="←"
            nextLabel="→"
            tileClassName={getTileClassName}
            tileContent={getTileContent}
            className="w-full react-calendar"
          />
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Datas da reserva ({checkInDate} até {checkOutDate})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-300 rounded"></div>
            <span>Datas bloqueadas por outras reservas</span>
          </div>
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
