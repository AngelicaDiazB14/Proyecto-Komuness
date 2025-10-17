// src/components/Calendar.js
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';
import { IoMdArrowRoundBack } from "react-icons/io";
import '../CSS/calendar.css';

moment.locale('es');

// Base de API robusta (evita /api/api)
const RAW = process.env.REACT_APP_BACKEND_URL || window.location.origin;
const BASE = (RAW || '').replace(/\/+$/, '');
const API = BASE.endsWith('/api') ? BASE : `${BASE}/api`;

const localizer = momentLocalizer(moment);

export const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month');

  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const navigate = useNavigate();

  useEffect(() => { fetchEvents(currentDate); }, [currentDate]);

  const fetchEvents = async (date) => {
    try {
      setLoading(true);
      const dateMoment = moment(date);
      const startOfMonth = dateMoment.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = dateMoment.endOf('month').format('YYYY-MM-DD');

      const response = await fetch(
        `${API}/publicaciones/eventos/calendario?startDate=${startOfMonth}&endDate=${endOfMonth}`
      );
      if (!response.ok) throw new Error('Error al cargar eventos');

      const eventos = await response.json();
      const calendarEvents = eventos.map(evento => {
        const [year, month, day] = evento.fechaEvento.split('-');
        const [hours, minutes] = evento.horaEvento.split(':');
        const startDateTime = new Date(year, month - 1, day, hours, minutes);
        return { id: evento._id, title: evento.titulo, start: startDateTime, end: startDateTime, allDay: false, resource: evento };
      });
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => { navigate(`/publicaciones/${event.id}`); };
  const handleNavigate = (newDate) => { setCurrentDate(newDate); };

  const getTodayDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mx-2 md:mx-4 my-4 relative">
      <div className="absolute top-4 left-4 z-20">
        <button type="button" onClick={() => navigate(-1)} className="p-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors shadow-md">
          <IoMdArrowRoundBack color="black" size={25} />
        </button>
      </div>

      <div className="text-center mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Calendario de Eventos</h2>
        <p className="text-lg md:text-xl text-gray-600 mt-2">
          {moment(currentDate).format('MMMM YYYY').replace(/^\w/, c => c.toUpperCase())}
        </p>
      </div>

      <div className="h-[400px] md:h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          onNavigate={handleNavigate}
          onView={setView}
          view={view}
          date={currentDate}
          today={getTodayDate()}
          views={['month', 'agenda']}
          style={{ height: '100%' }}
          messages={{
            next: "Siguiente", previous: "Anterior", today: "Hoy",
            month: "Mes", week: "Semana", day: "Día", agenda: "Agenda",
            date: "Fecha", time: "Hora", event: "Evento",
            noEventsInRange: "No hay eventos en este rango de fechas",
            showMore: total => `+ Ver más (${total})`
          }}
        />
      </div>
    </div>
  );
};

export default CalendarView;
