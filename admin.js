// C.S. Dental Care - Admin Portal Controller
// Password: "c.s dental care"

const ADMIN_PASSWORD = 'c.s dental care';
const AUTH_STORAGE_KEY = 'cs_dental_admin_auth';
const APPOINTMENTS_STORAGE_KEY = 'cs_dental_appointments';

// Application State
let currentTypeFilter = 'all';
let currentStatusFilter = 'all';
let currentDateFilter = 'all';
let currentSearchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initLiveClock();
  initFilters();
  initOfflineForm();
  initEditForm();
  
  // Set default date picker for offline appointments to today
  const offlineDateInput = document.getElementById('offline-date-input');
  if (offlineDateInput) {
    offlineDateInput.value = new Date().toISOString().split('T')[0];
  }

  // Cross-tab synchronization
  window.addEventListener('storage', (e) => {
    if (e.key === APPOINTMENTS_STORAGE_KEY) {
      renderDashboard();
    }
  });

  window.addEventListener('cs_appointment_added', () => {
    renderDashboard();
    showToast('New online booking received!', 'info');
  });
});

// ==========================================
// 1. AUTHENTICATION (PASSWORD PROTECTION)
// ==========================================
function initAuth() {
  const authScreen = document.getElementById('auth-screen');
  const dashboard = document.getElementById('admin-dashboard');
  const loginForm = document.getElementById('admin-login-form');
  const passwordInput = document.getElementById('admin-password-input');
  const togglePassBtn = document.getElementById('toggle-password-btn');
  const eyeIcon = document.getElementById('password-eye-icon');
  const errorMsg = document.getElementById('password-error-msg');
  const logoutBtn = document.getElementById('admin-logout-btn');

  // Check existing session
  const isAuthenticated = sessionStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated';
  if (isAuthenticated) {
    authScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    renderDashboard();
  } else {
    authScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
    if (passwordInput) passwordInput.focus();
  }

  // Toggle password visibility
  if (togglePassBtn && passwordInput && eyeIcon) {
    togglePassBtn.addEventListener('click', () => {
      const isPass = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPass ? 'text' : 'password');
      eyeIcon.textContent = isPass ? 'visibility_off' : 'visibility';
    });
  }

  // Handle Login Submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const entered = (passwordInput.value || '').trim();

      // Check password (case-insensitive & trimmed)
      if (entered.toLowerCase() === ADMIN_PASSWORD.toLowerCase()) {
        sessionStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
        errorMsg.classList.add('hidden');
        passwordInput.classList.remove('border-rose-500');

        // Smooth transition
        authScreen.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => {
          authScreen.classList.add('hidden');
          authScreen.classList.remove('opacity-0', 'transition-opacity', 'duration-300');
          dashboard.classList.remove('hidden');
          renderDashboard();
          showToast('Welcome to C.S. Dental Care Admin Portal', 'success');
        }, 300);
      } else {
        errorMsg.classList.remove('hidden');
        passwordInput.classList.add('border-rose-500', 'animate-shake');
        setTimeout(() => {
          passwordInput.classList.remove('animate-shake');
        }, 400);
        passwordInput.select();
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to log out of the admin portal?')) {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        dashboard.classList.add('hidden');
        authScreen.classList.remove('hidden');
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.focus();
        }
        showToast('Logged out successfully', 'info');
      }
    });
  }
}

// ==========================================
// 2. LIVE CLOCK & DATE
// ==========================================
function initLiveClock() {
  const clockEl = document.getElementById('live-clock');
  const dateEl = document.getElementById('live-date');
  const printTimeEl = document.getElementById('print-generated-time');

  function update() {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    if (printTimeEl) {
      printTimeEl.textContent = now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  }

  update();
  setInterval(update, 1000);
}

// ==========================================
// 3. STORAGE & APPOINTMENT DATA HELPERS
// ==========================================
function formatBookingDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Recently';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function getStoredAppointments() {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading appointments from storage:', e);
  }
  return initDefaultAppointments();
}

function saveAppointments(list) {
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving appointments to storage:', e);
  }
}

function initDefaultAppointments() {
  const now = new Date();
  const formatIsoWithMinutesAgo = (minsAgo) => {
    const t = new Date(now.getTime() - minsAgo * 60000);
    return {
      iso: t.toISOString(),
      formatted: formatBookingDateTime(t)
    };
  };

  const t1 = formatIsoWithMinutesAgo(35);
  const t2 = formatIsoWithMinutesAgo(90);
  const t3 = formatIsoWithMinutesAgo(150);
  const t4 = formatIsoWithMinutesAgo(280);

  const defaults = [
    {
      id: 'CSD-839210',
      type: 'online',
      patientName: 'Priya Mohan',
      patientPhone: '9840123456',
      treatment: 'Single-Visit Root Canal Treatment (RCT)',
      preferredDate: 'Today',
      timeSlot: 'Morning (9:30 AM - 1:30 PM)',
      notes: 'Severe sharp pain in lower right molar when chewing.',
      bookingCreatedAt: t1.iso,
      bookingCreatedAtFormatted: t1.formatted,
      status: 'pending',
      doctor: 'Dr. Ashtalakshmi',
      fee: 'Consultation ₹300'
    },
    {
      id: 'CSD-WLK-4019',
      type: 'offline',
      patientName: 'Karthik Subramanian',
      patientPhone: '9884567890',
      treatment: 'Teeth Whitening & Scaling',
      preferredDate: 'Today',
      timeSlot: '11:30 AM',
      notes: 'Walk-in for regular tartar cleaning and stain removal.',
      bookingCreatedAt: t2.iso,
      bookingCreatedAtFormatted: t2.formatted,
      status: 'confirmed',
      doctor: 'Dr. Ashtalakshmi',
      fee: '₹800 (Paid via GPay)'
    },
    {
      id: 'CSD-519283',
      type: 'online',
      patientName: 'Ananya Sridhar',
      patientPhone: '9444123890',
      treatment: 'Clear Aligners & Braces',
      preferredDate: 'Tomorrow',
      timeSlot: 'Evening (4:30 PM - 8:30 PM)',
      notes: 'Interested in invisible teeth aligners consultation.',
      bookingCreatedAt: t3.iso,
      bookingCreatedAtFormatted: t3.formatted,
      status: 'confirmed',
      doctor: 'Dr. Ashtalakshmi',
      fee: 'Consultation ₹300'
    },
    {
      id: 'CSD-WLK-7182',
      type: 'offline',
      patientName: 'Meenakshi Sundaram',
      patientPhone: '9789012345',
      treatment: 'Wisdom Tooth Pain / Extraction',
      preferredDate: 'Today',
      timeSlot: '05:00 PM',
      notes: 'Walked in with relative; swollen lower gum around wisdom tooth.',
      bookingCreatedAt: t4.iso,
      bookingCreatedAtFormatted: t4.formatted,
      status: 'confirmed',
      doctor: 'Dr. Ashtalakshmi',
      fee: '₹500 (OPG + Consultation - Cash)'
    }
  ];

  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(defaults));
  } catch (e) {}
  return defaults;
}

// Relative time helper
function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// ==========================================
// 4. DASHBOARD RENDERING & FILTERING
// ==========================================
function renderDashboard() {
  const allAppointments = getStoredAppointments();

  // Update Top Stats
  updateStatistics(allAppointments);

  // Filter List
  const filtered = allAppointments.filter(item => {
    // 1. Channel Filter (all, online, offline)
    if (currentTypeFilter !== 'all' && item.type !== currentTypeFilter) {
      return false;
    }

    // 2. Status Filter
    if (currentStatusFilter !== 'all' && item.status !== currentStatusFilter) {
      return false;
    }

    // 3. Date Filter
    if (currentDateFilter !== 'all') {
      const prefDate = (item.preferredDate || '').toLowerCase();
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

      if (currentDateFilter === 'today') {
        const isToday = prefDate.includes('today') || prefDate === todayStr;
        if (!isToday) return false;
      } else if (currentDateFilter === 'tomorrow') {
        const isTomorrow = prefDate.includes('tomorrow') || prefDate === tomorrowStr;
        if (!isTomorrow) return false;
      } else if (currentDateFilter === 'upcoming') {
        if (item.status === 'completed' || item.status === 'cancelled') return false;
      }
    }

    // 4. Search Filter
    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase();
      const searchBlob = `${item.id} ${item.patientName} ${item.patientPhone} ${item.treatment} ${item.notes || ''} ${item.doctor || ''}`.toLowerCase();
      if (!searchBlob.includes(q)) return false;
    }

    return true;
  });

  // Render Table
  renderTable(filtered);
}

function updateStatistics(list) {
  const total = list.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = list.filter(i => {
    const d = (i.preferredDate || '').toLowerCase();
    return d.includes('today') || d === todayStr;
  }).length;
  const onlineCount = list.filter(i => i.type === 'online').length;
  const offlineCount = list.filter(i => i.type === 'offline').length;
  const pendingCount = list.filter(i => i.status === 'pending').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-today').textContent = todayCount;
  document.getElementById('stat-online').textContent = onlineCount;
  document.getElementById('stat-offline').textContent = offlineCount;
  document.getElementById('stat-pending').textContent = pendingCount;

  // Type filter button counts
  document.getElementById('type-count-all').textContent = total;
  document.getElementById('type-count-online').textContent = onlineCount;
  document.getElementById('type-count-offline').textContent = offlineCount;
}

function renderTable(list) {
  const tbody = document.getElementById('appointments-table-body');
  const emptyState = document.getElementById('no-records-state');
  const resultsCount = document.getElementById('results-count');

  if (resultsCount) resultsCount.textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  tbody.innerHTML = list.map(item => {
    const isOnline = item.type === 'online';
    const cleanPhone = (item.patientPhone || '').replace(/\D/g, '');
    const ago = item.bookingCreatedAt ? timeAgo(item.bookingCreatedAt) : '';

    // WhatsApp quick reminder link
    const waReminder = encodeURIComponent(
      `Hello ${item.patientName}, greetings from C.S. Dental Care, Acharapakkam.\n` +
      `Your appointment is confirmed for:\n` +
      `• Ref ID: ${item.id}\n` +
      `• Treatment: ${item.treatment}\n` +
      `• Scheduled: ${item.preferredDate} (${item.timeSlot})\n` +
      `• Doctor: ${item.doctor || 'Dr. Ashtalakshmi'}\n\n` +
      `Clinic Location: Opposite Indian Overseas Bank, Lakshmi Complex, Acharapakkam.\n` +
      `Helpline: 8778558529. See you soon!`
    );
    const waUrl = `https://wa.me/91${cleanPhone}?text=${waReminder}`;

    // Status badge style
    let statusClass = 'bg-slate-100 text-slate-800 border-slate-200';
    if (item.status === 'confirmed') statusClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    else if (item.status === 'pending') statusClass = 'bg-amber-50 text-amber-900 border-amber-200';
    else if (item.status === 'completed') statusClass = 'bg-blue-50 text-blue-800 border-blue-200';
    else if (item.status === 'cancelled') statusClass = 'bg-rose-50 text-rose-800 border-rose-200';

    return `
      <tr class="hover:bg-slate-50/80 transition-colors group">
        
        <!-- 1. Patient & Contact -->
        <td class="py-4 px-4 sm:px-6 align-top">
          <div class="flex flex-col">
            <span class="font-heading font-bold text-slate-900 text-sm flex items-center gap-1.5">
              ${escapeHtml(item.patientName)}
            </span>
            <span class="font-mono text-xs font-bold text-slate-500 mt-0.5">
              Ref: ${escapeHtml(item.id)}
            </span>
            <div class="flex items-center gap-2 mt-2">
              <a href="tel:${cleanPhone}" class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors" title="Call patient">
                <span class="material-symbols-outlined text-[14px] text-teal-700">call</span>
                <span>${escapeHtml(item.patientPhone)}</span>
              </a>
              <a href="${waUrl}" target="_blank" rel="noopener" class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors" title="Message on WhatsApp">
                <span class="material-symbols-outlined text-[14px]">chat</span>
              </a>
            </div>
          </div>
        </td>

        <!-- 2. Booking Source & Timestamp -->
        <td class="py-4 px-4 align-top">
          <div class="flex flex-col gap-1.5">
            ${isOnline ? `
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-[11px] font-bold border border-sky-200 w-fit">
                <span class="material-symbols-outlined text-[13px] text-sky-600">language</span>
                <span>Online Web Booking</span>
              </span>
            ` : `
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 w-fit">
                <span class="material-symbols-outlined text-[13px] text-emerald-600">local_hospital</span>
                <span>Offline Walk-in</span>
              </span>
            `}
            
            <div class="flex flex-col mt-0.5">
              <div class="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <span class="material-symbols-outlined text-[15px] text-slate-400">schedule</span>
                <span>${escapeHtml(item.bookingCreatedAtFormatted || 'Recently')}</span>
              </div>
              ${ago ? `<span class="text-[10px] text-slate-400 ml-5 font-medium">${ago}</span>` : ''}
            </div>
          </div>
        </td>

        <!-- 3. Scheduled Slot -->
        <td class="py-4 px-4 align-top">
          <div class="flex flex-col">
            <span class="font-bold text-slate-800 text-xs flex items-center gap-1">
              <span class="material-symbols-outlined text-[15px] text-teal-600">event</span>
              ${escapeHtml(item.preferredDate)}
            </span>
            <span class="text-xs text-slate-600 mt-1 font-medium bg-slate-100 px-2 py-0.5 rounded w-fit">
              ${escapeHtml(item.timeSlot)}
            </span>
          </div>
        </td>

        <!-- 4. Treatment & Notes -->
        <td class="py-4 px-4 align-top max-w-xs">
          <div class="flex flex-col">
            <span class="font-semibold text-xs text-slate-900 leading-tight">
              ${escapeHtml(item.treatment)}
            </span>
            ${item.notes ? `
              <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed bg-slate-50 p-1.5 rounded border border-slate-100">
                "${escapeHtml(item.notes)}"
              </p>
            ` : '<span class="text-[11px] text-slate-400 mt-1 italic">No notes</span>'}
          </div>
        </td>

        <!-- 5. Doctor & Fee -->
        <td class="py-4 px-4 align-top">
          <div class="flex flex-col text-xs">
            <span class="font-semibold text-slate-800">${escapeHtml(item.doctor || 'Dr. Ashtalakshmi')}</span>
            <span class="text-slate-500 mt-0.5">${escapeHtml(item.fee || '₹300 Consultation')}</span>
          </div>
        </td>

        <!-- 6. Status Selector -->
        <td class="py-4 px-4 align-top">
          <select 
            onchange="updateAppointmentStatus('${item.id}', this.value)"
            class="h-8 px-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${statusClass}"
          >
            <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
            <option value="confirmed" ${item.status === 'confirmed' ? 'selected' : ''}>✓ Confirmed</option>
            <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>★ Completed</option>
            <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>✕ Cancelled</option>
          </select>
        </td>

        <!-- 7. Actions -->
        <td class="no-print py-4 px-4 align-top text-right">
          <div class="flex items-center justify-end gap-1.5">
            <!-- Edit Button -->
            <button 
              onclick="openEditModal('${item.id}')" 
              class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              title="Edit appointment details"
            >
              <span class="material-symbols-outlined text-[17px]">edit</span>
            </button>

            <!-- Delete Button -->
            <button 
              onclick="deleteAppointment('${item.id}')" 
              class="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors"
              title="Delete appointment"
            >
              <span class="material-symbols-outlined text-[17px]">delete</span>
            </button>
          </div>
        </td>

      </tr>
    `;
  }).join('');
}

// ==========================================
// 5. STATUS UPDATE & DELETION
// ==========================================
function updateAppointmentStatus(id, newStatus) {
  const list = getStoredAppointments();
  const index = list.findIndex(i => i.id === id);
  if (index !== -1) {
    list[index].status = newStatus;
    saveAppointments(list);
    renderDashboard();
    showToast(`Status updated to ${newStatus.toUpperCase()}`, 'success');
  }
}

function deleteAppointment(id) {
  if (confirm(`Are you sure you want to delete appointment ${id}? This action cannot be undone.`)) {
    let list = getStoredAppointments();
    list = list.filter(i => i.id !== id);
    saveAppointments(list);
    renderDashboard();
    showToast(`Appointment ${id} removed`, 'info');
  }
}

// ==========================================
// 6. ADD OFFLINE / WALK-IN APPOINTMENT
// ==========================================
function initOfflineForm() {
  const form = document.getElementById('offline-appointment-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.patient_name.value.trim();
    const phone = form.patient_phone.value.trim();
    const treatment = form.treatment.value;
    const date = form.appointment_date.value;
    const slot = form.time_slot.value;
    const doctor = form.doctor.value;
    const fee = form.fee.value;
    const status = form.status.value || 'confirmed';
    const notes = form.notes.value.trim();

    if (!name || !phone) {
      alert('Please provide patient name and contact number.');
      return;
    }

    const refId = 'CSD-WLK-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();

    const newOfflineAppt = {
      id: refId,
      type: 'offline', // Walk-in offline appointment
      patientName: name,
      patientPhone: phone,
      treatment: treatment,
      preferredDate: date,
      timeSlot: slot,
      notes: notes || 'Walk-in offline appointment.',
      bookingCreatedAt: now.toISOString(),
      bookingCreatedAtFormatted: formatBookingDateTime(now),
      status: status,
      doctor: doctor,
      fee: fee
    };

    // Save
    const list = getStoredAppointments();
    list.unshift(newOfflineAppt);
    saveAppointments(list);

    // Reset & Close
    form.reset();
    const offlineDateInput = document.getElementById('offline-date-input');
    if (offlineDateInput) offlineDateInput.value = new Date().toISOString().split('T')[0];
    
    closeOfflineBookingModal();
    renderDashboard();
    showToast(`Walk-in patient ${name} registered (${refId})`, 'success');
  });
}

function openOfflineBookingModal() {
  const modal = document.getElementById('offline-booking-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    const nameField = modal.querySelector('[name="patient_name"]');
    if (nameField) nameField.focus();
  }
}

function closeOfflineBookingModal() {
  const modal = document.getElementById('offline-booking-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

// ==========================================
// 7. EDIT APPOINTMENT MODAL
// ==========================================
function initEditForm() {
  const form = document.getElementById('edit-appointment-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-appointment-id').value;
    const list = getStoredAppointments();
    const index = list.findIndex(i => i.id === id);

    if (index !== -1) {
      list[index].patientName = document.getElementById('edit-patient-name').value.trim();
      list[index].patientPhone = document.getElementById('edit-patient-phone').value.trim();
      list[index].preferredDate = document.getElementById('edit-preferred-date').value.trim();
      list[index].timeSlot = document.getElementById('edit-time-slot').value.trim();
      list[index].treatment = document.getElementById('edit-treatment').value.trim();
      list[index].status = document.getElementById('edit-status').value;
      list[index].doctor = document.getElementById('edit-doctor').value.trim();
      list[index].fee = document.getElementById('edit-fee').value.trim();
      list[index].notes = document.getElementById('edit-notes').value.trim();

      saveAppointments(list);
      closeEditModal();
      renderDashboard();
      showToast(`Appointment ${id} updated successfully`, 'success');
    }
  });
}

function openEditModal(id) {
  const list = getStoredAppointments();
  const item = list.find(i => i.id === id);
  if (!item) return;

  document.getElementById('edit-appointment-id').value = item.id;
  document.getElementById('edit-modal-ref').textContent = item.id;
  document.getElementById('edit-patient-name').value = item.patientName || '';
  document.getElementById('edit-patient-phone').value = item.patientPhone || '';
  document.getElementById('edit-preferred-date').value = item.preferredDate || '';
  document.getElementById('edit-time-slot').value = item.timeSlot || '';
  document.getElementById('edit-treatment').value = item.treatment || '';
  document.getElementById('edit-status').value = item.status || 'pending';
  document.getElementById('edit-doctor').value = item.doctor || 'Dr. Ashtalakshmi';
  document.getElementById('edit-fee').value = item.fee || '₹300 Consultation';
  document.getElementById('edit-notes').value = item.notes || '';

  const modal = document.getElementById('edit-appointment-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

function closeEditModal() {
  const modal = document.getElementById('edit-appointment-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

// ==========================================
// 8. FILTERS & SEARCH LISTENERS
// ==========================================
function initFilters() {
  // Channel Type Filter Buttons
  const typeBtns = document.querySelectorAll('.type-filter-btn');
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => {
        b.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
        b.classList.add('text-slate-600');
      });
      btn.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
      btn.classList.remove('text-slate-600');

      currentTypeFilter = btn.getAttribute('data-type-filter');
      renderDashboard();
    });
  });

  // Status Filter Buttons
  const statusBtns = document.querySelectorAll('.status-filter-btn');
  statusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      statusBtns.forEach(b => {
        b.classList.remove('bg-slate-800', 'text-white');
        b.classList.add('bg-slate-100');
      });
      btn.classList.add('bg-slate-800', 'text-white');
      btn.classList.remove('bg-slate-100');

      currentStatusFilter = btn.getAttribute('data-status-filter');
      renderDashboard();
    });
  });

  // Date Filter Dropdown
  const dateSelect = document.getElementById('date-filter-select');
  if (dateSelect) {
    dateSelect.addEventListener('change', (e) => {
      currentDateFilter = e.target.value;
      renderDashboard();
    });
  }

  // Search Input
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim();
      if (clearBtn) {
        if (currentSearchQuery) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
      }
      renderDashboard();
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentSearchQuery = '';
      clearBtn.classList.add('hidden');
      renderDashboard();
      searchInput.focus();
    });
  }
}

function resetAllFilters() {
  currentTypeFilter = 'all';
  currentStatusFilter = 'all';
  currentDateFilter = 'all';
  currentSearchQuery = '';

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  const dateSelect = document.getElementById('date-filter-select');
  if (dateSelect) dateSelect.value = 'all';

  // Reset filter buttons style
  document.querySelectorAll('.type-filter-btn').forEach(btn => {
    if (btn.getAttribute('data-type-filter') === 'all') {
      btn.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
      btn.classList.remove('text-slate-600');
    } else {
      btn.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
      btn.classList.add('text-slate-600');
    }
  });

  document.querySelectorAll('.status-filter-btn').forEach(btn => {
    if (btn.getAttribute('data-status-filter') === 'all') {
      btn.classList.add('bg-slate-800', 'text-white');
      btn.classList.remove('bg-slate-100');
    } else {
      btn.classList.remove('bg-slate-800', 'text-white');
      btn.classList.add('bg-slate-100');
    }
  });

  renderDashboard();
}

// ==========================================
// 9. EXPORT CSV SPREADSHEET
// ==========================================
function exportAppointmentsToCSV() {
  const list = getStoredAppointments();
  if (list.length === 0) {
    alert('No appointments available to export.');
    return;
  }

  const headers = [
    'Reference ID',
    'Booking Channel',
    'Patient Name',
    'Phone Number',
    'Treatment / Concern',
    'Scheduled Date',
    'Time Slot',
    'Booking Date & Time',
    'Doctor Assigned',
    'Fee / Payment',
    'Status',
    'Clinical Notes'
  ];

  const rows = list.map(item => [
    `"${item.id || ''}"`,
    `"${item.type === 'online' ? 'Online Web Booking' : 'Offline Walk-in'}"`,
    `"${(item.patientName || '').replace(/"/g, '""')}"`,
    `"${item.patientPhone || ''}"`,
    `"${(item.treatment || '').replace(/"/g, '""')}"`,
    `"${item.preferredDate || ''}"`,
    `"${item.timeSlot || ''}"`,
    `"${item.bookingCreatedAtFormatted || ''}"`,
    `"${item.doctor || ''}"`,
    `"${item.fee || ''}"`,
    `"${item.status || ''}"`,
    `"${(item.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `CS_Dental_Care_Appointments_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Appointments exported to CSV successfully', 'success');
}

// ==========================================
// 10. TOAST NOTIFICATIONS HELPER
// ==========================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `p-4 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-semibold animate-fade-in transition-all transform pointer-events-auto ${
    type === 'success' 
      ? 'bg-emerald-900 text-white border-emerald-700' 
      : type === 'error'
      ? 'bg-rose-900 text-white border-rose-700'
      : 'bg-slate-900 text-white border-slate-700'
  }`;

  const iconName = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px] shrink-0">${iconName}</span>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helper to escape HTML characters
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Global exposure for inline events
window.openOfflineBookingModal = openOfflineBookingModal;
window.closeOfflineBookingModal = closeOfflineBookingModal;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.updateAppointmentStatus = updateAppointmentStatus;
window.deleteAppointment = deleteAppointment;
window.resetAllFilters = resetAllFilters;
window.exportAppointmentsToCSV = exportAppointmentsToCSV;
