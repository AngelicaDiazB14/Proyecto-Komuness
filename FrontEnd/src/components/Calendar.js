import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';
import '../CSS/calendar.css';

// Configurar moment en español
moment.locale('es');
const API = process.env.REACT_APP_BACKEND_URL || 'http://159.54.148.238/api';

const localizer = momentLocalizer(moment);

export const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month');
  
  // Fecha actual correcta
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents(currentDate);
  }, [currentDate]);

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
        const fechaEvento = new Date(year, month - 1, day);
        
        return {
          id: evento._id,
          title: evento.titulo,
          start: fechaEvento,
          end: fechaEvento,
          allDay: true,
          resource: evento
        };
      });
      
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    navigate(`/publicaciones/${event.id}`);
  };

  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  // Fecha actual SIN zona horaria
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
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mx-2 md:mx-4 my-4">
      {/* TÍTULO PRINCIPAL CENTRADO */}
      <div className="text-center mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          Calendario de Eventos
        </h2>
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
            next: "Siguiente",
            previous: "Anterior", 
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "No hay eventos en este rango de fechas",
            showMore: total => `+ Ver más (${total})`
          }}
        />
      </div>
    </div>
  );
};

export default CalendarView;