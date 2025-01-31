document.addEventListener('DOMContentLoaded', function() {
  // Check if user is admin
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser?.isAdmin) {
    window.location.href = 'index.html';
    return;
  }

  // Add reload button functionality
  const reloadBtn = document.getElementById('reloadBtn');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', function() {
      // Add rotation animation to icon
      const icon = reloadBtn.querySelector('i');
      icon.style.transform = 'rotate(360deg)';
      
      // Reload the page
      window.location.reload();
    });
  }

  // Load appointments for a specific date
  function loadAppointmentsForDate(dateStr) {
    const bookedAppointments = JSON.parse(localStorage.getItem('bookedAppointments')) || {};
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const appointmentsGrid = document.querySelector('.appointments-grid');
    
    if (!appointmentsGrid) return;
    
    appointmentsGrid.innerHTML = '';

    // Create Date object and normalize to start of day
    const selectedDate = new Date(dateStr);
    selectedDate.setHours(0, 0, 0, 0);
    
    Object.entries(bookedAppointments).forEach(([key, appointment]) => {
      // Create Date object for appointment and normalize to start of day
      const appointmentDate = new Date(appointment.appointmentDate);
      appointmentDate.setHours(0, 0, 0, 0);
      
      if (appointmentDate.getTime() === selectedDate.getTime()) {
        const user = users.find(u => u.email === appointment.user);
        
        const card = document.createElement('div');
        card.className = 'appointment-card';
        
        const endTime = new Date(appointmentDate);
        const [hours, minutes] = appointment.appointmentTime.split(':').map(Number);
        endTime.setHours(hours, minutes);
        endTime.setMinutes(endTime.getMinutes() + appointment.duration);
        
        // Include description in the card if it exists
        const description = appointment.description ? 
          `<div class="appointment-description">${appointment.description}</div>` : '';
        
        card.innerHTML = `
          <div class="appointment-header">
            <span class="appointment-time">${appointment.appointmentTime} - ${endTime.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          <div class="appointment-service">${appointment.service}</div>
          <div class="appointment-user">
            <i class="fas fa-user"></i> ${user ? user.username : 'Usuário não encontrado'}
          </div>
          ${description}
          <div class="appointment-duration">
            <i class="fas fa-clock"></i> Duração: ${appointment.duration} minutos
          </div>
          <div class="appointment-actions">
            <button class="action-btn edit-btn" onclick="editAppointment('${key}')">
              <i class="fas fa-edit"></i> Editar
            </button>
            <button class="action-btn reschedule-btn" onclick="rescheduleAppointment('${key}')">
              <i class="fas fa-calendar-alt"></i> Remarcar
            </button>
            <button class="action-btn cancel-btn" onclick="cancelAppointment('${key}')">
              <i class="fas fa-times"></i> Cancelar
            </button>
          </div>
        `;

        // Add click event to show detailed view
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.appointment-actions')) {
            showAppointmentDetails(appointment, user);
          }
        });

        appointmentsGrid.appendChild(card);
      }
    });

    if (appointmentsGrid.children.length === 0) {
      appointmentsGrid.innerHTML = `
        <div class="no-appointments">
          <i class="fas fa-calendar-xmark"></i>
          <p>Nenhum agendamento para esta data</p>
        </div>
      `;
    }
  }

  // Update the initial load with date filter
  const dateFilter = document.getElementById('dateFilter');
  if (dateFilter) {
    const today = new Date();
    dateFilter.value = today.toISOString().split('T')[0];
    loadAppointmentsForDate(today.toISOString());
  
    // Add event listener for date filter
    dateFilter.addEventListener('change', (e) => {
      const selectedDate = new Date(e.target.value);
      // Adjust for timezone offset
      selectedDate.setMinutes(selectedDate.getMinutes() + selectedDate.getTimezoneOffset());
      loadAppointmentsForDate(selectedDate.toISOString());
    });
  }

  window.editAppointment = function(key) {
    const appointments = JSON.parse(localStorage.getItem('bookedAppointments')) || {};
    const appointment = appointments[key];
    
    if (!appointment) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Editar Agendamento</h2>
        <form id="editForm" class="edit-form">
          <div class="form-group">
            <label>Serviço:</label>
            <select name="service" required>
              <option value="corte_masculino" ${appointment.service.includes('Masculino') ? 'selected' : ''}>Corte Masculino</option>
              <option value="corte_feminino" ${appointment.service.includes('Feminino') ? 'selected' : ''}>Corte Feminino</option>
              <option value="pintura" ${appointment.service.includes('Pintura') ? 'selected' : ''}>Pintura</option>
              <option value="manicure" ${appointment.service.includes('Manicure') ? 'selected' : ''}>Manicure</option>
              <option value="pedicure" ${appointment.service.includes('Pedicure') ? 'selected' : ''}>Pedicure</option>
              <option value="sobrancelha" ${appointment.service.includes('Sobrancelha') ? 'selected' : ''}>Design de Sobrancelha</option>
            </select>
          </div>
          <div class="form-group">
            <label>Descrição:</label>
            <textarea name="description">${appointment.description || ''}</textarea>
          </div>
          <button type="submit" class="save-btn">Salvar Alterações</button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => {
      modal.remove();
    };

    const form = modal.querySelector('form');
    form.onsubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      
      appointments[key] = {
        ...appointment,
        service: getServiceDisplayName(formData.get('service')),
        description: formData.get('description')
      };

      localStorage.setItem('bookedAppointments', JSON.stringify(appointments));
      loadAppointmentsForDate(new Date(appointment.appointmentDate).toISOString());
      modal.remove();
    };
  };

  window.rescheduleAppointment = function(key) {
    const appointments = JSON.parse(localStorage.getItem('bookedAppointments')) || {};
    const appointment = appointments[key];
    
    if (!appointment) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Remarcar Agendamento</h2>
        <form id="rescheduleForm" class="reschedule-form">
          <div class="form-group">
            <label>Nova Data:</label>
            <input type="date" name="date" required min="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label>Novo Horário:</label>
            <select name="time" required>
              <option value="">Selecione um horário</option>
              ${generateTimeOptions()}
            </select>
          </div>
          <button type="submit" class="save-btn">Confirmar Remarcação</button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Set initial date value to current appointment date
    const dateInput = modal.querySelector('input[name="date"]');
    dateInput.value = appointment.appointmentDate.split('T')[0];

    // Set initial time value to current appointment time
    const timeSelect = modal.querySelector('select[name="time"]');
    timeSelect.value = appointment.appointmentTime;

    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => {
      modal.remove();
    };

    const form = modal.querySelector('form');
    form.onsubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      
      const newDate = formData.get('date');
      const newTime = formData.get('time');

      // Check if the new slot is available
      if (!isTimeSlotAvailable(new Date(newDate), newTime, appointment.duration, key)) {
        alert('Este horário já está ocupado. Por favor, escolha outro horário.');
        return;
      }

      const newKey = `${newDate}-${newTime}`;

      // Create updated appointment with preserved duration and other details
      const updatedAppointment = {
        ...appointment,
        appointmentDate: newDate,
        appointmentTime: newTime
      };

      // Remove old appointment and add the new one
      delete appointments[key];
      appointments[newKey] = updatedAppointment;

      // Save to localStorage
      localStorage.setItem('bookedAppointments', JSON.stringify(appointments));

      // Refresh the display with the new date
      const dateFilter = document.getElementById('dateFilter');
      if (dateFilter) {
        dateFilter.value = newDate;
        loadAppointmentsForDate(new Date(newDate).toISOString());
      }
      
      alert('Agendamento remarcado com sucesso!');
      modal.remove();
    };
  };

  function isTimeSlotAvailable(date, time, duration, excludeKey) {
    // Ensure we have valid inputs
    if (!date || !time || !duration) {
      console.error('Invalid parameters:', { date, time, duration });
      return false;
    }

    try {
      const startTime = new Date(date);
      const [hours, minutes] = time.split(':').map(Number);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime.getTime() + duration * 60000);
      
      // Check all existing appointments for conflicts
      const bookedAppointments = JSON.parse(localStorage.getItem('bookedAppointments')) || {};
      
      for (const key in bookedAppointments) {
        // Skip the current appointment being rescheduled
        if (key === excludeKey) continue;

        const appointment = bookedAppointments[key];
        if (!appointment.appointmentDate || !appointment.appointmentTime || !appointment.duration) {
          continue;
        }

        const appointmentDate = new Date(appointment.appointmentDate);
        const [appHours, appMinutes] = appointment.appointmentTime.split(':').map(Number);
        appointmentDate.setHours(appHours, appMinutes, 0, 0);
        
        const appointmentEnd = new Date(appointmentDate.getTime() + appointment.duration * 60000);
        
        // Check if there's any overlap
        if (!(endTime <= appointmentDate || startTime >= appointmentEnd)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      return false;
    }
  }

  window.cancelAppointment = function(key) {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      const appointments = JSON.parse(localStorage.getItem('bookedAppointments')) || {};
      delete appointments[key];
      localStorage.setItem('bookedAppointments', JSON.stringify(appointments));
      loadAppointmentsForDate(new Date().toISOString());
    }
  };

  function generateTimeOptions() {
    let options = '';
    for (let hour = 8; hour < 18; hour++) {
      for (let minute of ['00', '30']) {
        const time = `${hour.toString().padStart(2, '0')}:${minute}`;
        options += `<option value="${time}">${time}</option>`;
      }
    }
    return options;
  }

  function getServiceDisplayName(serviceValue) {
    const serviceNames = {
      corte_masculino: 'Corte Masculino',
      corte_feminino: 'Corte Feminino',
      pintura: 'Pintura',
      manicure: 'Manicure',
      pedicure: 'Pedicure',
      sobrancelha: 'Design de Sobrancelha'
    };
    return serviceNames[serviceValue] || serviceValue;
  }

  function showAppointmentDetails(appointment, user) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    const appointmentDate = new Date(appointment.appointmentDate);
    const endTime = new Date(appointmentDate.getTime() + appointment.duration * 60000);
    
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Detalhes do Agendamento</h2>
        <div class="appointment-details">
          <div class="details-row">
            <span class="details-label">Cliente:</span>
            <span class="details-value">${user ? user.username : 'Usuário não encontrado'}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Email:</span>
            <span class="details-value">${user ? user.email : 'N/A'}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Telefone:</span>
            <span class="details-value">${user ? user.phone : 'N/A'}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Serviço:</span>
            <span class="details-value">${appointment.service}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Data:</span>
            <span class="details-value">${appointmentDate.toLocaleDateString('pt-BR')}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Horário:</span>
            <span class="details-value">
              ${appointment.appointmentTime}
            </span>
          </div>
          <div class="details-row">
            <span class="details-label">Duração:</span>
            <span class="details-value">${appointment.duration} minutos</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => {
      modal.remove();
    };

    window.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    };
  }
});