// Make all necessary functions globally accessible at the start of the file
window.logout = function() {
  localStorage.removeItem('currentUser');
  location.reload();
}

window.isCurrentUserAdmin = function() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  return currentUser?.isAdmin === true;
}

window.showMyAppointments = function() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;

  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  overlay.style.display = 'flex';

  const popup = document.createElement('div');
  popup.className = 'popup';
  
  popup.innerHTML = `
    <div class="popup-header">
      <h3 class="popup-title">Meus Agendamentos</h3>
      <button class="popup-close">×</button>
    </div>
    <div class="appointments-container">
      ${generateAppointmentsList()}
    </div>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // Close button functionality
  const closeBtn = popup.querySelector('.popup-close');
  closeBtn.onclick = () => overlay.remove();

  // Close when clicking outside
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}

window.cancelAppointment = function(dateTimeKey) {
  const confirmed = confirm('Tem certeza que deseja cancelar este agendamento?');
  if (confirmed) {
    const bookedAppointments = JSON.parse(localStorage.getItem('bookedAppointments')) || {};
    delete bookedAppointments[dateTimeKey];
    localStorage.setItem('bookedAppointments', JSON.stringify(bookedAppointments));
    // Refresh the appointments popup
    const appointmentsContainer = document.querySelector('.appointments-container');
    if (appointmentsContainer) {
      appointmentsContainer.innerHTML = generateAppointmentsList();
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser?.isAdmin) {
    const navLinks = document.querySelector('.nav-links');
    const adminLink = document.createElement('a');
    adminLink.href = 'admin.html';
    adminLink.innerHTML = '<i class="fas fa-user-shield"></i> Painel Admin';
    adminLink.style.color = '#4f46e5';
    adminLink.style.fontWeight = '500';
    navLinks.insertBefore(adminLink, navLinks.firstChild);
  }
  
  // Define calendar globally within the scope
  let calendar;

  // Check if user is logged in and update navigation
  function updateNavigation() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const loginBtn = document.querySelector('.login-btn');
    
    if (currentUser && loginBtn) {
      // Create dropdown container
      const dropdownContainer = document.createElement('div');
      dropdownContainer.style.position = 'relative';
      dropdownContainer.style.display = 'inline-block';
      
      // Replace login button with username button
      const userBtn = document.createElement('button');
      userBtn.className = 'login-btn';
      userBtn.innerHTML = `
        ${currentUser.username} 
        <i class="fas fa-chevron-down" style="margin-left: 5px; font-size: 0.8em;"></i>
      `;
      
      // Create dropdown menu
      const dropdownMenu = document.createElement('div');
      dropdownMenu.className = 'dropdown-menu';
      dropdownMenu.innerHTML = `
        <button onclick="showMyAppointments()" class="dropdown-item">
          <i class="fas fa-calendar-check"></i> Meus Agendamentos
        </button>
        <button onclick="logout()" class="dropdown-item">
          <i class="fas fa-sign-out-alt"></i> Sair
        </button>
      `;
      
      // Add elements to the DOM
      dropdownContainer.appendChild(userBtn);
      dropdownContainer.appendChild(dropdownMenu);
      loginBtn.parentNode.replaceChild(dropdownContainer, loginBtn);
      
      // Toggle dropdown on click
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        dropdownMenu.classList.remove('show');
      });
    }
  }
  
  // Call updateNavigation when the page loads
  updateNavigation();

  // Store selected service info globally
  let selectedService = null;
  let selectedDuration = null;

  // Handle service selection with description field
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach(card => {
    card.addEventListener('click', function() {
      // Reset all cards
      serviceCards.forEach(c => {
        c.style.borderColor = 'transparent';
        const existingDescription = c.querySelector('.description-field');
        if (existingDescription) {
          existingDescription.remove();
        }
      });

      // Get service type from the span text
      const serviceSpan = card.querySelector('span');
      selectedService = serviceSpan ? serviceSpan.textContent : null;
      card.style.borderColor = 'var(--primary-color)';

      // Create description field
      const descriptionField = document.createElement('div');
      descriptionField.className = 'description-field';
      descriptionField.style.display = 'block';
      descriptionField.innerHTML = `
        <label>Descreva o serviço desejado (opcional):</label>
        <textarea placeholder="Descreva os detalhes do serviço..."></textarea>
      `;
      
      card.appendChild(descriptionField);
      
      // Prevent event bubbling for description field
      descriptionField.addEventListener('click', e => e.stopPropagation());
      const textarea = descriptionField.querySelector('textarea');
      textarea.addEventListener('click', e => e.stopPropagation());

      // Set duration based on service type
      selectedDuration = getServiceDuration(selectedService);
      
      if (calendar && calendar.selectedDates[0]) {
        showTimePopup(calendar.selectedDates[0]);
      }
    });
  });

  function getServiceDuration(service) {
    const durations = {
      'Corte de Cabelo': 60,
      'Pintura de Cabelo': 120,
      'Manicure': 60,
      'Pedicure': 90,
      'Design de Sobrancelha': 45
    };
    return durations[service] || 60; // Default to 60 minutes if service not found
  }

  function getServiceDescription() {
    const descriptionField = document.querySelector('.description-field textarea');
    const description = descriptionField ? descriptionField.value.trim() : '';
    return description ? `${selectedService} - ${description}` : selectedService;
  }

  // Check if calendar element exists before initializing
  const calendarElement = document.querySelector("#calendar");
  if (calendarElement) {
    // Initialize calendar with improved settings
    calendar = flatpickr("#calendar", {
      inline: true,
      minDate: "today",
      maxDate: new Date().fp_incr(365 * 5), 
      dateFormat: "Y-m-d",
      locale: {
        firstDayOfWeek: 0,
        weekdays: {
          shorthand: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
          longhand: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
        },
        months: {
          shorthand: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
          longhand: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
        }
      },
      disable: [
        function(date) {
          return date.getDay() === 0 || date.getDay() === 6;
        }
      ],
      onChange: function(selectedDates) {
        if (selectedService) {
          showTimePopup(selectedDates[0]);
        } else {
          alert('Por favor, selecione um serviço primeiro');
        }
      }
    });
  }

  function showTimePopup(date) {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
      const loginAlert = document.createElement('div');
      loginAlert.className = 'popup-overlay';
      loginAlert.style.display = 'flex';
      
      const alertBox = document.createElement('div');
      alertBox.className = 'popup';
      alertBox.innerHTML = `
        <div class="popup-header">
          <h3 class="popup-title">Login Necessário</h3>
          <button class="popup-close">×</button>
        </div>
        <p style="margin-bottom: 1.5rem;">Para agendar um horário, é necessário fazer login primeiro.</p>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button class="cta-btn" onclick="window.location.href='login.html'">Fazer Login</button>
        </div>
      `;
      
      loginAlert.appendChild(alertBox);
      document.body.appendChild(loginAlert);
      
      const closeBtn = alertBox.querySelector('.popup-close');
      closeBtn.onclick = () => loginAlert.remove();
      
      loginAlert.onclick = (e) => {
        if (e.target === loginAlert) loginAlert.remove();
      };
      
      return;
    }

    if (!selectedService) {
      alert('Por favor, selecione um serviço primeiro');
      return;
    }

    if (!selectedDuration) {
      alert('Por favor, selecione a duração do serviço');
      return;
    }

    const formattedDate = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const popup = document.createElement('div');
    popup.className = 'popup';
    const header = document.createElement('div');
    header.className = 'popup-header';
    const title = document.createElement('h3');
    title.className = 'popup-title';
    title.textContent = `Horários disponíveis para ${formattedDate}`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'popup-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => popup.remove();
    const slotsContainer = document.createElement('div');
    slotsContainer.className = 'slots-container';
    header.appendChild(title);
    header.appendChild(closeBtn);
    popup.appendChild(header);
    popup.appendChild(slotsContainer);

    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.style.display = 'flex';
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    const duration = selectedDuration;
  
    // Create time slots from 8:00 to 16:00
    for (let hour = 8; hour < 16; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slot = document.createElement('div');
        slot.className = 'time-slot';
      
        if (isTimeSlotAvailable(date, timeString, duration)) {
          slot.textContent = timeString;
          slot.addEventListener('click', () => {
            document.querySelectorAll('.time-slot').forEach(s => 
              s.classList.remove('selected'));
            slot.classList.add('selected');
            
            setTimeout(() => {
              const serviceDescription = getServiceDescription();
              bookTimeSlot(date, timeString, selectedService, serviceDescription, duration);
              overlay.remove();
              
              // Show confirmation
              showBookingConfirmation(date, timeString, duration);
            }, 500);
          });
        } else {
          slot.textContent = `${timeString} - Indisponível`;
          slot.classList.add('booked');
        }

        slotsContainer.appendChild(slot);
      }
    }

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    };
  }

  function isTimeSlotAvailable(date, time, duration) {
    // Ensure we have valid inputs
    if (!date || !time || !duration) {
      console.error('Invalid parameters:', { date, time, duration });
      return false;
    }

    try {
      const startTime = new Date(date);
      if (isNaN(startTime.getTime())) {
        console.error('Invalid date:', date);
        return false;
      }

      const [hours, minutes] = time.split(':').map(Number);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime.getTime() + duration * 60000);
      
      // Check all existing appointments for conflicts
      const bookedAppointments = JSON.parse(localStorage.getItem('bookedAppointments')) || {};
      
      for (const key in bookedAppointments) {
        const appointment = bookedAppointments[key];
        if (!appointment.appointmentDate || !appointment.appointmentTime || !appointment.duration) {
          console.error('Invalid appointment data:', appointment);
          continue;
        }

        const appointmentDate = new Date(appointment.appointmentDate);
        if (isNaN(appointmentDate.getTime())) {
          console.error('Invalid appointment date:', appointment.appointmentDate);
          continue;
        }

        const [appHours, appMinutes] = appointment.appointmentTime.split(':').map(Number);
        const appointmentStart = new Date(appointmentDate.setHours(appHours, appMinutes, 0, 0));
        const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);
        
        // Check if there's any overlap
        if (!(endTime <= appointmentStart || startTime >= appointmentEnd)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      return false;
    }
  }

  function bookTimeSlot(date, time, service, serviceDescription, duration) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const dateStr = date.toISOString().split('T')[0];
    const dateTimeKey = `${dateStr}-${time}`;

    const bookedAppointments = JSON.parse(localStorage.getItem('bookedAppointments')) || {};
    
    // Get the description from the textarea
    const descriptionElement = document.querySelector('.description-field textarea');
    const description = descriptionElement ? descriptionElement.value.trim() : '';
    
    // Create the appointment with the proper description
    bookedAppointments[dateTimeKey] = {
      service: description ? `${service} - ${description}` : service,
      booked: true,
      timestamp: new Date().toISOString(),
      user: currentUser.email,
      bookedBy: currentUser.isAdmin ? 'admin' : 'user',
      appointmentDate: date.toISOString(),
      appointmentTime: time,
      duration: duration,
      description: description // Store the description separately as well
    };

    localStorage.setItem('bookedAppointments', JSON.stringify(bookedAppointments));
  }

  function showBookingConfirmation(date, time, duration) {
    const confirmOverlay = document.createElement('div');
    confirmOverlay.className = 'popup-overlay';
    confirmOverlay.style.display = 'flex';
    
    const confirmPopup = document.createElement('div');
    confirmPopup.className = 'popup';
    confirmPopup.innerHTML = `
      <div class="popup-header">
        <h3 class="popup-title">Agendamento Confirmado</h3>
        <button class="popup-close">×</button>
      </div>
      <p style="margin-bottom: 1.5rem;">
        Seu agendamento foi confirmado para ${date.toLocaleDateString('pt-BR')}
        <br>Horário: ${time}
        <br>Duração: ${duration} minutos
      </p>
      <div style="display: flex; gap: 1rem; justify-content: flex-end;">
        <button class="cta-btn" onclick="showMyAppointments()">Ver Meus Agendamentos</button>
      </div>
    `;
    
    confirmOverlay.appendChild(confirmPopup);
    document.body.appendChild(confirmOverlay);
    
    const closeBtn = confirmPopup.querySelector('.popup-close');
    closeBtn.onclick = () => confirmOverlay.remove();
    
    confirmOverlay.onclick = (e) => {
      if (e.target === confirmOverlay) confirmOverlay.remove();
    };
  }

  window.generateAppointmentsList = function() {
    const bookedAppointments = JSON.parse(localStorage.getItem('bookedAppointments')) || {};
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    const appointments = Object.entries(bookedAppointments)
      .filter(([_, details]) => details.user === currentUser.email)
      .map(([key, details]) => {
        const appointmentDate = new Date(details.appointmentDate);
        return `
          <div class="appointment-item">
            <div class="appointment-info">
              <strong>${details.service}</strong>
              <span>${appointmentDate.toLocaleDateString('pt-BR')} às ${details.appointmentTime}</span>
            </div>
            <button class="cancel-btn" onclick="cancelAppointment('${key}')">
              Cancelar
            </button>
          </div>
        `;
      });

    return appointments.length ? 
      appointments.join('') : 
      '<p class="no-appointments">Você não tem agendamentos.</p>';
  }

  // Add delete event function with admin check
  window.deleteEvent = function(eventKey) {
    if (!checkAdminPermission()) return;
    
    const confirmed = confirm('Tem certeza que deseja excluir este evento?');
    if (confirmed) {
      const events = JSON.parse(localStorage.getItem('events')) || [];
      const updatedEvents = events.filter(event => `${event.date}-${event.time}` !== eventKey);
      localStorage.setItem('events', JSON.stringify(updatedEvents));
      location.reload();
    }
  };

  // Add edit event function
  window.editEvent = function(eventKey) {
    if (!checkAdminPermission()) return;

    const events = JSON.parse(localStorage.getItem('events')) || [];
    const event = events.find(e => `${e.date}-${e.time}` === eventKey);
    
    if (!event) return;

    const editOverlay = document.createElement('div');
    editOverlay.className = 'popup-overlay';
    editOverlay.style.display = 'flex';

    const editPopup = document.createElement('div');
    editPopup.className = 'popup';
    editPopup.innerHTML = `
      <div class="popup-header">
        <h3 class="popup-title">Editar Evento</h3>
        <button class="popup-close">×</button>
      </div>
      <div class="edit-form">
        <div class="form-group">
          <label>Título</label>
          <input type="text" class="edit-title" value="${event.title}">
        </div>
        <div class="form-group">
          <label>Data</label>
          <input type="date" class="edit-date" value="${event.date}">
        </div>
        <div class="form-group">
          <label>Horário</label>
          <div class="edit-time-slots"></div>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select class="edit-status">
            <option value="disponivel" ${event.status === 'disponivel' ? 'selected' : ''}>Disponível</option>
            <option value="encerrado" ${event.status === 'encerrado' ? 'selected' : ''}>Encerrado</option>
            <option value="cancelado" ${event.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
          </select>
        </div>
        <button class="save-edit-btn">Salvar Alterações</button>
      </div>
    `;

    editOverlay.appendChild(editPopup);
    document.body.appendChild(editOverlay);

    const timeSlotsDiv = editPopup.querySelector('.edit-time-slots');
    for (let hour = 8; hour < 16; hour++) {
      const timeSlot = document.createElement('div');
      timeSlot.className = 'event-time-slot';
      const timeString = `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;
      timeSlot.textContent = timeString;
      
      if (event.time === timeString) {
        timeSlot.classList.add('selected');
      }
      
      timeSlot.addEventListener('click', () => {
        document.querySelectorAll('.event-time-slot').forEach(slot => 
          slot.classList.remove('selected'));
        timeSlot.classList.add('selected');
      });
      
      timeSlotsDiv.appendChild(timeSlot);
    }

    const saveBtn = editPopup.querySelector('.save-edit-btn');
    saveBtn.addEventListener('click', () => {
      const newTitle = editPopup.querySelector('.edit-title').value;
      const newDate = editPopup.querySelector('.edit-date').value;
      const newTime = editPopup.querySelector('.event-time-slot.selected').textContent;
      const newStatus = editPopup.querySelector('.edit-status').value;

      const eventIndex = events.findIndex(e => `${e.date}-${e.time}` === eventKey);
      if (eventIndex !== -1) {
        events[eventIndex] = {
          ...events[eventIndex],
          title: newTitle,
          date: newDate,
          time: newTime,
          status: newStatus
        };
        localStorage.setItem('events', JSON.stringify(events));
        location.reload();
      }
    });

    const closeBtn = editPopup.querySelector('.popup-close');
    closeBtn.onclick = () => editOverlay.remove();
    editOverlay.onclick = (e) => {
      if (e.target === editOverlay) editOverlay.remove();
    };
  };

  function createEventCard(event) {
    const eventCard = document.createElement('div');
    eventCard.className = `event-card status-${event.status}`;
    eventCard.dataset.eventId = `${event.date}-${event.time}`;

    let eventDate = new Date(event.date + 'T00:00:00');
    
    const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });

    eventCard.innerHTML = `
      <i class="fas fa-calendar-star"></i>
      <h4>${event.title}</h4>
      <p>Data: ${dateFormatter.format(eventDate)}</p>
      <p>Horário: ${event.time}</p>
      <p class="event-status-display">Status: ${event.status || 'Disponível'}</p>
      ${isCurrentUserAdmin() ? `
        <div class="admin-controls">
          <button class="edit-event-btn" onclick="editEvent('${event.date}-${event.time}')">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="delete-event-btn" onclick="deleteEvent('${event.date}-${event.time}')">
            <i class="fas fa-trash"></i> Excluir
          </button>
        </div>
      ` : ''}
    `;

    return eventCard;
  }

  function createEditableEventBanner() {
    const eventContainer = document.querySelector('.events-container');
    if (!eventContainer) return;
      
    if (isCurrentUserAdmin()) {
      const newEventCard = document.createElement('div');
      newEventCard.className = 'event-card editable-event';
        
      const today = new Date().toISOString().split('T')[0];
        
      newEventCard.innerHTML = `
        <i class="fas fa-calendar-star"></i>
        <h4 class="event-title" contenteditable="true">Novo Evento</h4>
        <input type="date" class="event-date" value="${today}" min="${today}">
        <div class="time-slots-container" style="display: none;">
          <h5>Horários Disponíveis</h5>
          <div class="event-time-slots"></div>
        </div>
        <select class="event-status">
          <option value="disponivel">Disponível</option>
          <option value="encerrado">Encerrado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <button class="confirm-event-btn">Confirmar Evento</button>
      `;
        
      eventContainer.appendChild(newEventCard);

      const eventDateInput = newEventCard.querySelector('.event-date');
      const timeSlotsContainer = newEventCard.querySelector('.time-slots-container');
      const timeSlotsDiv = newEventCard.querySelector('.event-time-slots');
      const confirmBtn = newEventCard.querySelector('.confirm-event-btn');

      if (eventDateInput) {
        eventDateInput.addEventListener('change', function() {
          if (timeSlotsContainer) {
            timeSlotsContainer.style.display = 'block';
              
            if (timeSlotsDiv) {
              timeSlotsDiv.innerHTML = '';
              for (let hour = 8; hour < 16; hour++) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'event-time-slot';
                const timeString = `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;
                timeSlot.textContent = timeString;
                
                timeSlot.addEventListener('click', () => {
                  document.querySelectorAll('.event-time-slot').forEach(slot => 
                    slot.classList.remove('selected'));
                  timeSlot.classList.add('selected');
                });
                
                timeSlotsDiv.appendChild(timeSlot);
              }
            }
          }
        });
      }

      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          const titleElement = newEventCard.querySelector('.event-title');
          const dateElement = newEventCard.querySelector('.event-date');
          const selectedTimeSlot = newEventCard.querySelector('.event-time-slot.selected');
          const statusElement = newEventCard.querySelector('.event-status');

          if (!dateElement || !dateElement.value) {
            alert('Por favor, selecione uma data');
            return;
          }
            
          if (!selectedTimeSlot) {
            alert('Por favor, selecione um horário');
            return;
          }

          const title = titleElement ? titleElement.textContent : 'Novo Evento';
          const date = dateElement.value;
          const time = selectedTimeSlot.textContent;
          const status = statusElement ? statusElement.value : 'disponivel';
            
          const events = JSON.parse(localStorage.getItem('events')) || [];
          const newEvent = { 
            title,
            date,
            time,
            status
          };
          events.push(newEvent);
          localStorage.setItem('events', JSON.stringify(events));
            
          location.reload();
        });
      }
    }

    const events = JSON.parse(localStorage.getItem('events')) || [];
      
    if (events.length === 0) {
      const noEventsMessage = document.createElement('div');
      noEventsMessage.className = 'no-events-message';
      noEventsMessage.innerHTML = `
        <p>Não há eventos no momento.</p>
      `;
      eventContainer.appendChild(noEventsMessage);
      return;
    }

    events.forEach(event => {
      const eventCard = createEventCard(event);
      eventContainer.appendChild(eventCard);
    });
  }

  try {
    createEditableEventBanner();
  } catch (error) {
    console.error('Error creating editable event banner:', error);
  }

  // Cookie consent functionality with error handling
  function createCookieConsent() {
    try {
      if (document.querySelector('.cookie-consent')) return;
      
      const cookieConsent = document.createElement('div');
      cookieConsent.className = 'cookie-consent';
      
      cookieConsent.innerHTML = `
        <div class="cookie-text">
          <p>Utilizamos cookies para melhorar sua experiência em nosso site. Ao continuar navegando, você concorda com a nossa 
            <a href="https://exemplo.com/privacidade" style="color: var(--primary-color)">Política de Privacidade</a>.
          </p>
        </div>
        <div class="cookie-buttons">
          <button class="cta-btn reject-cookies">Rejeitar</button>
          <button class="cta-btn accept-cookies">Aceitar</button>
        </div>
      `;
      
      document.body.appendChild(cookieConsent);
      
      if (!localStorage.getItem('cookieConsent')) {
        setTimeout(() => {
          cookieConsent.classList.add('show');
        }, 1000);
      }
      
      const acceptButton = cookieConsent.querySelector('.accept-cookies');
      const rejectButton = cookieConsent.querySelector('.reject-cookies');
      
      if (acceptButton) {
        acceptButton.addEventListener('click', () => {
          localStorage.setItem('cookieConsent', 'accepted');
          cookieConsent.classList.remove('show');
          setTimeout(() => {
            cookieConsent.remove();
          }, 300);
        });
      }
      
      if (rejectButton) {
        rejectButton.addEventListener('click', () => {
          localStorage.setItem('cookieConsent', 'rejected');
          cookieConsent.classList.remove('show');
          setTimeout(() => {
            cookieConsent.remove();
          }, 300);
        });
      }
    } catch (error) {
      console.error('Error creating cookie consent:', error);
    }
  }
  
  try {
    createCookieConsent();
  } catch (error) {
    console.error('Error initializing cookie consent:', error);
  }

  // Animações suaves ao scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Botão CTA
  const ctaButton = document.querySelector('.cta-btn');
  if (ctaButton) {
    ctaButton.addEventListener('click', () => {
      document.querySelector('.booking-section').scrollIntoView({
        behavior: 'smooth'
      });
    });
  }

  function checkAdminPermission() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser?.isAdmin) {
      alert('Acesso negado. Apenas administradores podem realizar esta ação.');
      return false;
    }
    return true;
  }
});