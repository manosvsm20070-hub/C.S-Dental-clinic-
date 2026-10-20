// C.S. Dental Care - Interactive Website Controller

document.addEventListener('DOMContentLoaded', () => {
  initClinicStatus();
  initBookingForm();
  initTreatmentModal();
  initReviewFilters();
  initReviewModal();
  initMobileMenu();
  initFaqAccordion();
});

// 1. Dynamic Clinic Status (IST: UTC + 5:30)
function initClinicStatus() {
  const statusBadge = document.getElementById('clinic-live-status');
  const statusText = document.getElementById('clinic-live-text');
  const statusDot = document.getElementById('clinic-live-dot');
  if (!statusBadge || !statusText) return;

  function updateStatus() {
    // Current time in IST
    const now = new Date();
    const utcOffset = now.getTimezoneOffset() * 60000;
    const istOffset = 5.5 * 3600000;
    const istDate = new Date(now.getTime() + utcOffset + istOffset);

    const day = istDate.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    const currentMin = hours * 60 + minutes;

    let isOpen = false;
    let message = '';

    if (day === 0) { // Sunday: 10:00 AM to 2:00 PM (600 to 840)
      if (currentMin >= 600 && currentMin < 840) {
        isOpen = true;
        message = 'Open Today until 2:00 PM (Sunday)';
      } else if (currentMin < 600) {
        message = 'Opens Today at 10:00 AM (Sunday)';
      } else {
        message = 'Closed for the day • Opens Mon 9:30 AM';
      }
    } else { // Monday - Saturday: 9:30 AM - 1:30 PM (570 - 810) & 4:30 PM - 8:30 PM (990 - 1230)
      if (currentMin >= 570 && currentMin < 810) {
        isOpen = true;
        message = 'Open Now until 1:30 PM (Morning Slot)';
      } else if (currentMin >= 810 && currentMin < 990) {
        message = 'Midday Break • Opens at 4:30 PM (Evening Slot)';
      } else if (currentMin >= 990 && currentMin < 1230) {
        isOpen = true;
        message = 'Open Now until 8:30 PM (Evening Slot)';
      } else if (currentMin < 570) {
        message = 'Opens Today at 9:30 AM';
      } else {
        message = day === 6 ? 'Closed • Opens Sun 10:00 AM' : 'Closed for the day • Opens tomorrow 9:30 AM';
      }
    }

    statusText.textContent = message;
    if (isOpen) {
      statusDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
      statusBadge.classList.remove('bg-amber-100', 'text-amber-900', 'border-amber-300');
      statusBadge.classList.add('bg-emerald-50', 'text-emerald-800', 'border-emerald-200');
    } else {
      statusDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500';
      statusBadge.classList.remove('bg-emerald-50', 'text-emerald-800', 'border-emerald-200');
      statusBadge.classList.add('bg-amber-50', 'text-amber-900', 'border-amber-200');
    }
  }

  updateStatus();
  setInterval(updateStatus, 60000);
}

// 2. Appointment Booking System with Storage & WhatsApp integration
const APPOINTMENTS_STORAGE_KEY = 'cs_dental_appointments';

function formatBookingDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
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
  } catch (e) {
    console.error('Failed to save default appointments', e);
  }
  return defaults;
}

function saveOnlineAppointment(data) {
  try {
    const list = getStoredAppointments();
    list.unshift(data);
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('cs_appointment_added', { detail: data }));
  } catch (e) {
    console.error('Failed to save online appointment', e);
  }
}

function initBookingForm() {
  const forms = [
    document.getElementById('booking-form'),
    document.getElementById('modal-booking-form')
  ].filter(Boolean);

  // Initialize storage defaults if empty
  getStoredAppointments();

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = form.querySelector('[name="patient_name"]');
      const phoneInput = form.querySelector('[name="patient_phone"]');
      const treatmentSelect = form.querySelector('[name="treatment"]');
      const dateSelect = form.querySelector('[name="preferred_date"]');
      const timeSelect = form.querySelector('[name="time_slot"]');
      const notesInput = form.querySelector('[name="notes"]');

      const name = nameInput ? nameInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const treatment = treatmentSelect ? treatmentSelect.value : 'Consultation';
      const date = dateSelect ? dateSelect.value : 'Today';
      const slot = timeSelect ? timeSelect.value : 'Morning';
      const notes = notesInput ? notesInput.value.trim() : '';

      if (!name || !phone) {
        alert('Please fill in your name and phone number.');
        return;
      }

      const refId = 'CSD-' + Math.floor(100000 + Math.random() * 900000);
      const now = new Date();
      
      // Save appointment record to storage with booking date and time
      const newOnlineBooking = {
        id: refId,
        type: 'online',
        patientName: name,
        patientPhone: phone,
        treatment: treatment,
        preferredDate: date,
        timeSlot: slot,
        notes: notes || 'No additional notes provided.',
        bookingCreatedAt: now.toISOString(),
        bookingCreatedAtFormatted: formatBookingDateTime(now),
        status: 'pending',
        doctor: 'Dr. Ashtalakshmi',
        fee: 'Consultation ₹300'
      };

      saveOnlineAppointment(newOnlineBooking);

      // WhatsApp message URL
      const waText = encodeURIComponent(
        `Hello C.S. Dental Care, I would like to book an appointment:\n` +
        `• Booking Ref: ${refId}\n` +
        `• Name: ${name}\n` +
        `• Phone: ${phone}\n` +
        `• Treatment: ${treatment}\n` +
        `• Preferred Slot: ${date} (${slot})\n` +
        `• Booked Online: ${newOnlineBooking.bookingCreatedAtFormatted}\n` +
        (notes ? `• Symptoms/Notes: ${notes}\n` : '') +
        `Please confirm my appointment. Thank you!`
      );
      const waUrl = `https://wa.me/918778558529?text=${waText}`;

      // Update success state
      const successBox = form.closest('section, .modal-content')?.querySelector('.booking-success-box') || 
                         document.getElementById('booking-success');

      if (successBox) {
        const refEl = successBox.querySelector('.booking-ref-number');
        const waLink = successBox.querySelector('.booking-wa-link');
        if (refEl) refEl.textContent = refId;
        if (waLink) waLink.href = waUrl;
        
        form.classList.add('hidden');
        successBox.classList.remove('hidden');
      } else {
        window.open(waUrl, '_blank');
      }

      form.reset();
    });
  });
}

function resetBookingView() {
  document.querySelectorAll('.booking-success-box').forEach(box => box.classList.add('hidden'));
  document.querySelectorAll('#booking-form, #modal-booking-form').forEach(form => form.classList.remove('hidden'));
}

// 3. Treatment Data & Modal System
const treatmentsData = {
  rct: {
    title: 'Single-Visit Root Canal Treatment (RCT)',
    icon: 'health_and_safety',
    color: 'primary',
    badge: '100% Pain-Free Technology',
    subtitle: 'Save your natural infected tooth in a single painless sitting',
    description: 'At C.S. Dental Care, we utilize advanced computerized rotary endodontics with apex locators and digital RVG imaging. What used to take 3 to 4 painful visits is completed safely in just 45–60 minutes under gentle computerized local anesthesia.',
    features: [
      'Single sitting completion for most cases',
      'Digital Apex Locator for 99.9% precision root cleaning',
      'Class-B sterilized single-use rotary files',
      'Immediate relief from severe throbbing tooth pain',
      'Followed by high-strength Zirconia or PFM crown'
    ],
    duration: '45 – 60 Minutes',
    anesthesia: 'Computerized / Topical Gentle Anesthesia',
    doctor: 'Dr. Ashtalakshmi & Endodontic Specialist'
  },
  whitening: {
    title: 'Advanced Teeth Whitening & Ultrasonic Scaling',
    icon: 'cleaning_services',
    color: 'secondary',
    badge: 'Instant 3-4 Shades Brighter',
    subtitle: 'Professional deep stain removal, tartar cleaning & enamel polishing',
    description: 'Remove stubborn yellow tea/coffee/tobacco stains, calculus, and bad breath. Our ultrasonic piezo-scaling gently dislodges tartar without eroding dental enamel, finished with gentle fluoride polishing paste.',
    features: [
      'Gentle ultrasonic scaling eliminates plaque & tartar',
      'Safe enamel-protective polishing',
      'Relieves bleeding gums and halitosis (bad breath)',
      'Cosmetic office whitening for instant photo-ready smiles'
    ],
    duration: '30 – 40 Minutes',
    anesthesia: 'Non-invasive / Zero injections needed',
    doctor: 'Preventive Dental Team'
  },
  implants: {
    title: 'Dental Implants & Zirconia Aesthetic Crowns',
    icon: 'auto_fix_high',
    color: 'tertiary',
    badge: 'Lifetime Durability & Natural Look',
    subtitle: 'Permanent replacement for missing teeth with bio-compatible titanium & zirconia',
    description: 'Eat, chew, and smile with 100% confidence. Dental implants look, feel, and function exactly like natural tooth roots. Topped with custom CAD/CAM milled zirconia crowns matched precisely to your natural tooth shade.',
    features: [
      'US-FDA approved titanium biocompatible implants',
      'Computer-guided digital surgical placement',
      'CAD/CAM Monolithic Zirconia with 10-15 year warranty',
      'Preserves facial bone structure and neighboring healthy teeth'
    ],
    duration: 'Multi-stage or Immediate Loading options',
    anesthesia: 'Complete Painless Local Anesthesia',
    doctor: 'Senior Implantologist'
  },
  aligners: {
    title: 'Invisible Clear Aligners & Orthodontic Braces',
    icon: 'sentiment_satisfied',
    color: 'primary',
    badge: 'Discreet Smile Transformation',
    subtitle: 'Straighten crooked, crowded, or spaced teeth without metal wires',
    description: 'Enjoy a perfect smile without anyone noticing. Custom clear aligner trays gently move teeth into harmony. We also offer ceramic aesthetic brackets and conventional braces for children and teens.',
    features: [
      'Virtually invisible, removable transparent aligners',
      'Eat whatever you want by easily removing trays',
      '3D Digital treatment planning previewing final smile',
      'Comfortable with zero wire pokes or ulcers'
    ],
    duration: '6 – 14 Months average',
    anesthesia: 'Zero Anesthesia Required',
    doctor: 'Orthodontic Specialist'
  },
  kids: {
    title: 'Pediatric (Kids) Dentistry & Preventive Care',
    icon: 'child_care',
    color: 'secondary',
    badge: 'Fear-Free & Child-Friendly Care',
    subtitle: 'Gentle, friendly dental visits that build lifelong positive oral health habits',
    description: 'Our clinic is designed to put little patients at ease. From preventive pit & fissure sealants and fluoride varnish to pain-free tooth cavity fillings and habit-breaking appliances, we treat every child with boundless patience.',
    features: [
      'Fun, welcoming, anxiety-free atmosphere',
      'Topical numbing gel before any procedure',
      'Preventive fluoride applications to stop cavities early',
      'Space maintainers and milk tooth restorations'
    ],
    duration: '20 – 30 Minutes',
    anesthesia: 'Gentle, painless approach',
    doctor: 'Pediatric Dental Team'
  },
  wisdom: {
    title: 'Wisdom Tooth Removal & Minor Oral Surgery',
    icon: 'healing',
    color: 'error',
    badge: 'Minimally Invasive & Fast Recovery',
    subtitle: 'Pain-free surgical extraction for impacted, tilted, or painful third molars',
    description: 'Impacting wisdom teeth can damage adjacent molars and cause unbearable jaw pain. Our oral surgery team performs precision atraumatic extractions with minimal tissue trauma for swift, swelling-free healing.',
    features: [
      'Low-radiation digital RVG pre-surgical assessment',
      'Atraumatic extraction preserving jaw bone and nerves',
      'Complete local anesthesia for zero procedure pain',
      'Comprehensive aftercare kit and fast 2-3 day recovery protocol'
    ],
    duration: '25 – 45 Minutes',
    anesthesia: 'Deep targeted local block',
    doctor: 'Oral & Maxillofacial Surgeon'
  }
};

function initTreatmentModal() {
  const modal = document.getElementById('treatment-modal');
  if (!modal) return;

  const closeBtn = document.getElementById('close-treatment-modal');
  const bookBtn = document.getElementById('modal-treatment-book-btn');

  document.querySelectorAll('[data-treatment-key]').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't open if clicked direct link
      if (e.target.closest('a[href^="tel:"]') || e.target.closest('a[href^="https://wa.me"]')) return;
      const key = card.getAttribute('data-treatment-key');
      const data = treatmentsData[key];
      if (!data) return;

      document.getElementById('modal-treatment-title').textContent = data.title;
      document.getElementById('modal-treatment-subtitle').textContent = data.subtitle;
      document.getElementById('modal-treatment-desc').textContent = data.description;
      document.getElementById('modal-treatment-badge').textContent = data.badge;
      document.getElementById('modal-treatment-duration').textContent = data.duration;
      document.getElementById('modal-treatment-anesthesia').textContent = data.anesthesia;
      document.getElementById('modal-treatment-doctor').textContent = data.doctor;

      const list = document.getElementById('modal-treatment-features');
      list.innerHTML = '';
      data.features.forEach(feat => {
        const li = document.createElement('li');
        li.className = 'flex items-start gap-2 text-sm text-slate-700';
        li.innerHTML = `<span class="material-symbols-outlined text-teal-600 text-[18px] shrink-0 mt-0.5">check_circle</span><span>${feat}</span>`;
        list.appendChild(li);
      });

      if (bookBtn) {
        bookBtn.onclick = () => {
          closeTreatmentModal();
          openBookingModal(data.title);
        };
      }

      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeTreatmentModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeTreatmentModal();
  });
}

function closeTreatmentModal() {
  const modal = document.getElementById('treatment-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

// 4. Quick Appointment Modal
function openBookingModal(preselectedTreatment = '') {
  const modal = document.getElementById('booking-modal');
  if (!modal) {
    const inlineForm = document.getElementById('quick-booking');
    if (inlineForm) {
      inlineForm.scrollIntoView({ behavior: 'smooth' });
      if (preselectedTreatment) {
        const select = inlineForm.querySelector('[name="treatment"]');
        if (select) select.value = preselectedTreatment;
      }
    }
    return;
  }

  resetBookingView();
  if (preselectedTreatment) {
    const select = modal.querySelector('[name="treatment"]');
    if (select) select.value = preselectedTreatment;
  }

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

// 5. Review Category Filters
function initReviewFilters() {
  const filterBtns = document.querySelectorAll('.review-filter-btn');
  const reviewCards = document.querySelectorAll('.review-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-teal-700', 'text-white', 'shadow-sm');
        b.classList.add('bg-slate-100', 'text-slate-700');
      });
      btn.classList.add('bg-teal-700', 'text-white', 'shadow-sm');
      btn.classList.remove('bg-slate-100', 'text-slate-700');

      const filter = btn.getAttribute('data-filter');
      reviewCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter || category.includes(filter)) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

// 6. Review Modal & Submission
function initReviewModal() {
  const modal = document.getElementById('review-modal');
  const openBtn = document.getElementById('write-review-btn');
  const closeBtn = document.getElementById('close-review-modal');
  const form = document.getElementById('patient-review-form');

  if (!modal) return;

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const reviewerName = form.querySelector('[name="reviewer_name"]').value.trim();
      const reviewerLoc = form.querySelector('[name="reviewer_location"]').value.trim() || 'Local Resident';
      const treatmentVal = form.querySelector('[name="treatment_taken"]').value;
      const reviewText = form.querySelector('[name="review_content"]').value.trim();

      const container = document.getElementById('reviews-container');
      if (container) {
        const initial = reviewerName.charAt(0).toUpperCase() || 'P';
        const newCard = document.createElement('div');
        newCard.className = 'review-card p-5 rounded-xl bg-white border border-teal-200 shadow-sm transition-all hover:shadow-md';
        newCard.setAttribute('data-category', 'all');
        newCard.innerHTML = `
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                ${initial}
              </div>
              <div>
                <p class="font-bold text-sm text-slate-900 flex items-center gap-1">
                  ${reviewerName} <span class="material-symbols-outlined text-teal-600 text-[15px]">verified</span>
                </p>
                <p class="text-xs text-slate-500">${reviewerLoc} • Just now</p>
              </div>
            </div>
            <div class="flex text-amber-400 text-xs">
              <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
              <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
              <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
              <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
              <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
            </div>
          </div>
          <span class="inline-block mb-2 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold">
            ${treatmentVal}
          </span>
          <p class="text-sm text-slate-600 leading-relaxed">
            "${reviewText}"
          </p>
        `;
        container.insertBefore(newCard, container.firstChild);
      }

      form.reset();
      modal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
      alert('Thank you for sharing your experience! Your review has been added.');
    });
  }
}

// 7. Mobile Navigation Drawer
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-toggle');
  const menuDrawer = document.getElementById('mobile-menu-drawer');
  const backdrop = document.getElementById('mobile-menu-backdrop');
  const closeBtn = document.getElementById('close-mobile-menu');

  if (!menuBtn || !menuDrawer) return;

  function toggleMenu(show) {
    if (show) {
      menuDrawer.classList.remove('-translate-x-full');
      backdrop.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    } else {
      menuDrawer.classList.add('-translate-x-full');
      backdrop.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }
  }

  menuBtn.addEventListener('click', () => toggleMenu(true));
  if (closeBtn) closeBtn.addEventListener('click', () => toggleMenu(false));
  if (backdrop) backdrop.addEventListener('click', () => toggleMenu(false));

  menuDrawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });
}

// 8. FAQ Accordion
function initFaqAccordion() {
  document.querySelectorAll('.faq-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const icon = btn.querySelector('.faq-icon');
      const isExpanded = !content.classList.contains('hidden');

      // Close all
      document.querySelectorAll('.faq-content').forEach(c => c.classList.add('hidden'));
      document.querySelectorAll('.faq-icon').forEach(i => i.textContent = 'add');

      if (!isExpanded) {
        content.classList.remove('hidden');
        if (icon) icon.textContent = 'remove';
      }
    });
  });
}

// Global helper for opening booking modal from buttons
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.closeTreatmentModal = closeTreatmentModal;
