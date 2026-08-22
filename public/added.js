const form = document.querySelector('#booking-form');
const type = document.querySelector('#medical-type');
const councilLabel = document.querySelector('#council-label');
const councilSelect = document.querySelector('#council-select');
const clinicSelect = document.querySelector('#clinic-select');
const recordsWarning = document.querySelector('#records-warning');
const recordsWarningTitle = document.querySelector('#records-warning-title');
const recordsWarningAction = document.querySelector('#records-warning-action');
const recordsWarningBooking = document.querySelector('#records-warning-booking');
const gpTemplateLink = document.querySelector('#gp-template-link');
const calendarContainer = document.querySelector('#calendar-container');
const dateFieldset = document.querySelector('#date-fieldset');
const times = document.querySelector('#time-options');
const timeFieldset = document.querySelector('#time-fieldset');
const dateField = document.querySelector('#appointment-date');
const timeField = document.querySelector('#appointment-time');
const success = document.querySelector('#success');
const API_BASE_URL = location.hostname.endsWith('.web.app') || location.hostname.endsWith('.firebaseapp.com')
  ? 'https://oscesimstrial1.onrender.com'
  : '';
const apiUrl = path => `${API_BASE_URL}${path}`;

const menu = document.querySelector('.menu');
const nav = document.querySelector('nav');
menu.onclick = () => nav.classList.toggle('open');

document.querySelectorAll('[data-medical]').forEach(button => {
  button.onclick = () => {
    type.value = button.dataset.medical;
    updateMedicalTypeFields();
    document.querySelector('#book').scrollIntoView({ behavior: 'smooth' });
  };
});

// Council data
const councils = [
  { name: "London - Transport For London/TFL (FULL medical records required)", popular: true },
  { name: "Wolverhampton City Council (Medical records)", popular: true },
  { name: "Allerdale Council (Medical summary required)", popular: false },
  { name: "Amber Valley Council (Medical summary required)", popular: false },
  { name: "Ashfield District Council (Medical summary required)", popular: false },
  { name: "Ashford Council (Medical summary required)", popular: false },
  { name: "Aylesbury Vale Council (Medical summary required)", popular: false },
  { name: "Barnsley Metropolitan Borough Council (Medical summary required)", popular: false },
  { name: "Barrow-in-Furness (Full Medical Records)", popular: false },
  { name: "Basingstoke and Deane Council (Medical summary required)", popular: false },
  { name: "Bath and North East Somerset BANES (Medical summary required)", popular: false },
  { name: "Bedford (Medical summary required)", popular: false },
  { name: "Blaby Council (Medical summary required)", popular: false },
  { name: "Blackburn Council (Medical summary required)", popular: false },
  { name: "Blackpool Council (Medical summary required)", popular: false },
  { name: "Bolsover Council (Medical summary required)", popular: false },
  { name: "Boston Council (Medical summary required)", popular: false },
  { name: "Bournemouth Council (Medical summary required)", popular: false },
  { name: "Bradford Council (Medical summary required)", popular: false },
  { name: "Broxbourne Council (Medical summary required)", popular: false },
  { name: "Braintree Council (Medical summary required)", popular: false },
  { name: "Burnley Council (Medical summary required)", popular: false },
  { name: "Bury City Council (Medical summary required)", popular: false },
  { name: "Calerdale Council (Full Medical Records)", popular: false },
  { name: "Cambridge Council (Medical summary required)", popular: false },
  { name: "Canterbury Council (Medical summary required)", popular: false },
  { name: "Carlisle Council (Full Medical Records)", popular: false },
  { name: "Central Bedfordshire Council (Medical Records Required)", popular: false },
  { name: "Charnwood Borough Council (Medical summary required)", popular: false },
  { name: "Chemlsford Council (Medical summary required)", popular: false },
  { name: "Cheltenham Borough Council (Medical summary required)", popular: false },
  { name: "Cherwell Council (Medical summary required)", popular: false },
  { name: "Cheshire West & Chester (Medical summary required)", popular: false },
  { name: "City of Lincoln (Full Medical Records)", popular: false },
  { name: "City of Bristol (Medical summary required)", popular: false },
  { name: "Cotswold District Council (Medical summary required)", popular: false },
  { name: "County Durham Council (Medical summary required)", popular: false },
  { name: "Coventry Council (Medical summary required)", popular: false },
  { name: "Chesterfield Council (Medical summary required)", popular: false },
  { name: "Chorley Council (Full Medical Records)", popular: false },
  { name: "Copeland Council (Full Medical Records)", popular: false },
  { name: "Cumberland Council (Full Medical Records)", popular: false },
  { name: "Darlington Council (Medical summary required)", popular: false },
  { name: "Dartford Council (Medical summary required)", popular: false },
  { name: "Derbyshire Dales (Medical summary required)", popular: false },
  { name: "Doncaster Council (Medical summary required)", popular: false },
  { name: "Dudley Council (Medical summary required)", popular: false },
  { name: "East Cambridgeshire Council (Medical summary required)", popular: false },
  { name: "East Hertfordshire Council (Medical summary required)", popular: false },
  { name: "East Lindsey District Council (Full Medical Records)", popular: false },
  { name: "East Staffordshire (Medical summary required)", popular: false },
  { name: "Eastleigh Council (Medical summary required)", popular: false },
  { name: "Eden District Council (Medical summary required)", popular: false },
  { name: "Erewash Borough Council (Medical summary required)", popular: false },
  { name: "Exeter Council (Medical summary required)", popular: false },
  { name: "Fenland Council (Medical summary required)", popular: false },
  { name: "Forest Heath Council (Medical summary required)", popular: false },
  { name: "Forest of Dean Council (Medical summary required)", popular: false },
  { name: "Fylde Council (Medical summary required)", popular: false },
  { name: "Gateshead Council (Medical summary required)", popular: false },
  { name: "Gloucester City Council (Medical summary required)", popular: false },
  { name: "Gravesham Council (Medical summary required)", popular: false },
  { name: "Harlow Council (Medical summary required)", popular: false },
  { name: "Halton Council (Medical summary required)", popular: false },
  { name: "Harborough Council (Full Medical Records)", popular: false },
  { name: "Hartlepool Council (Full Medical Records)", popular: false },
  { name: "Havant Council (Medical summary required)", popular: false },
  { name: "Herefordshire County Council (Medical summary required)", popular: false },
  { name: "High Peak Council (Medical summary required)", popular: false },
  { name: "Hinckley and Bosworth Council (Medical summary required)", popular: false },
  { name: "Horsham Council (Medical summary required)", popular: false },
  { name: "Hull City Council (Medical Summary Required)", popular: false },
  { name: "Huntingdonshire Council (Full Medical Records)", popular: false },
  { name: "Hyndburn Borough Council (Medical summary required)", popular: false },
  { name: "Ipswitch Council (Medical summary required)", popular: false },
  { name: "Isle of Wight Council (Medical summary required)", popular: false },
  { name: "King's Lynn and West Norfolk Council (Medical summary required)", popular: false },
  { name: "Kingston upon Hull Council (Medical summary required)", popular: false },
  { name: "Kirklees Council (Full Medical Records)", popular: false },
  { name: "Knowsley Council (Medical Summary Required)", popular: false },
  { name: "Leeds City Council (Medical Summary Required)", popular: false },
  { name: "Lichfield District Council (Medical summary required)", popular: false },
  { name: "Liverpool Council (Medical summary required)", popular: false },
  { name: "Luton Council (Medical summary required)", popular: false },
  { name: "Maidstone Council (Medical summary required)", popular: false },
  { name: "Maldon Council (Medical summary required)", popular: false },
  { name: "Malvern Hills Council (Medical summary required)", popular: false },
  { name: "Manchester City Council (Medical summary required)", popular: false },
  { name: "Melton Council (Medical summary required)", popular: false },
  { name: "Mendip Council (Medical summary required)", popular: false },
  { name: "Mid Devon Council (Medical summary required)", popular: false },
  { name: "Middlesborough Council (Full Medical Records)", popular: false },
  { name: "Milton Keynes Council (Medical summary required)", popular: false },
  { name: "Newcastle upon Tyne Council (Medical summary required)", popular: false },
  { name: "Newcastle under Lyme Council (Medical summary required)", popular: false },
  { name: "North East Derbyshire Council (Medical summary required)", popular: false },
  { name: "North Kesteven Council (Medical summary required)", popular: false },
  { name: "North Lincolnshire Council (Medical summary required)", popular: false },
  { name: "North Norfolk Council (Medical summary required)", popular: false },
  { name: "North Somerset Council (Medical summary required)", popular: false },
  { name: "North Tyneside Council (Medical summary required)", popular: false },
  { name: "North Warwickshire (Medical summary required)", popular: false },
  { name: "North West Leicestershire Council (Full Medical Records)", popular: false },
  { name: "North Yorkshire Council (Medical summary required)", popular: false },
  { name: "Northampton Council (Full Medical Records)", popular: false },
  { name: "Northumberland Council (Medical summary required)", popular: false },
  { name: "Nuneaton & Bedworth Council", popular: false },
  { name: "Oadby & Wigston Council (Medical summary required)", popular: false },
  { name: "Oldham Council (Medical summary required)", popular: false },
  { name: "Oxford Council (Medical summary required)", popular: false },
  { name: "Pendle Borough Council (Medical summary required)", popular: false },
  { name: "Peterborough Council (Medical summary required)", popular: false },
  { name: "Plymouth Council (Medical summary required)", popular: false },
  { name: "Poole Council (Medical summary required)", popular: false },
  { name: "Preston City Council (Medical summary required)", popular: false },
  { name: "Redcar and Cleveland Borough Council (Full Medical Records)", popular: false },
  { name: "Rochford Council (Medical summary required)", popular: false },
  { name: "Rotherham Met Borough Council (Medical summary required)", popular: false },
  { name: "Rochdale City Council (Medical summary required)", popular: false },
  { name: "Rugby Council (Medical summary required)", popular: false },
  { name: "Runnymede Council (Medical summary required)", popular: false },
  { name: "Rushcliffe Council (Medical summary required)", popular: false },
  { name: "Rutland County Council (Medical summary required)", popular: false },
  { name: "Salford City Council (Medical summary required)", popular: false },
  { name: "Sandwell Council (Medical summary required)", popular: false },
  { name: "Sedgemoor Council (Medical summary required)", popular: false },
  { name: "Sefton Council (Medical summary required)", popular: false },
  { name: "Selby (Medical summary required)", popular: false },
  { name: "Sheffield Council (Medical summary required)", popular: false },
  { name: "Shepway Council (Medical summary required)", popular: false },
  { name: "Shropshire Council (Medical summary required)", popular: false },
  { name: "Solihull Metropolitan Council (Medical summary required)", popular: false },
  { name: "South Cambridge Council (Medical Records Required)", popular: false },
  { name: "South Derbyshire Council (Medical summary required)", popular: false },
  { name: "South Gloucestershire Council (Medical summary required)", popular: false },
  { name: "South Holland Council (Full Medical Records)", popular: false },
  { name: "South Lakeland District Council (Full Medical Records)", popular: false },
  { name: "South Oxfordshire Council (Medical summary required)", popular: false },
  { name: "South Ribble Council (Medical summary required)", popular: false },
  { name: "South Staffordshire Council (Medical summary required)", popular: false },
  { name: "South Tyneside Council (Medical summary required)", popular: false },
  { name: "Southampton Council (Medical summary required)", popular: false },
  { name: "Southend on Sea Council (Medical summary required)", popular: false },
  { name: "St Albans Council (Medical summary required)", popular: false },
  { name: "St Edmundsbury Council (Medical summary required)", popular: false },
  { name: "St Helens Council (Medical summary required)", popular: false },
  { name: "Stafford Council (Medical summary required)", popular: false },
  { name: "Staffordshire Moorlands District Council (Medical summary required)", popular: false },
  { name: "Stockport Council (Full Records Required)", popular: false },
  { name: "Stoke-on-Trent Council (Medical Summary required)", popular: false },
  { name: "Stroud District Council(Medical summary required)", popular: false },
  { name: "Sunderland Council (Medical summary required)", popular: false },
  { name: "Swale Council (Medical summary required)", popular: false },
  { name: "Swindon Council (Medical summary required)", popular: false },
  { name: "Tameside Council (Medical Summary Required)", popular: false },
  { name: "Telford & Wrekin Council (Medical summary required)", popular: false },
  { name: "Test Valley Council (Medical summary required)", popular: false },
  { name: "Tewkesbury Council (Medical summary required)", popular: false },
  { name: "Thurrock Council (Medical summary required)", popular: false },
  { name: "Torbay Council (Medical summary required)", popular: false },
  { name: "Trafford Council (Full Medical Records)", popular: false },
  { name: "Transport For London (£75 (Full Medical Records)", popular: false },
  { name: "Uttlesford Council (Medical summary required)", popular: false },
  { name: "Vale of White Horse Council (Medical summary required)", popular: false },
  { name: "Wakefield Council (Full Medical Records)", popular: false },
  { name: "Warrington Council (Medical summary required)", popular: false },
  { name: "Warwick Council (Medical summary required)", popular: false },
  { name: "Waveney Council (Medical summary required)", popular: false },
  { name: "West Dorset Council (Medical summary required)", popular: false },
  { name: "West Lancashire Council (Medical summary required)", popular: false },
  { name: "West Lindsey District Council (Full Medical Records)", popular: false },
  { name: "Westmorland and Furness Council (Medical summary required)", popular: false },
  { name: "West Suffolk Council (Medical summary required)", popular: false },
  { name: "Weymouth and Portland Council (Medical summary required)", popular: false },
  { name: "Wigan Council (Medical summary required)", popular: false },
  { name: "Wiltshire Council (Medical summary required)", popular: false },
  { name: "Windsor and Maidenhead Council (Medical summary required)", popular: false },
  { name: "Wirral Council (Medical summary required)", popular: false },
  { name: "Wrexham Council (Medical summary required)", popular: false },
  { name: "Wolverhampton City Council (Medical records)", popular: false },
  { name: "Wycome Council (Medical summary required)", popular: false },
  { name: "York Council (Medical summary required)", popular: false },
  { name: "Council Not listed - Please Contact Us", popular: false }
];

// Show dependent booking fields only after a medical type is selected.
function updateMedicalTypeFields() {
  if (type.value === 'Taxi / private-hire medical') {
    councilLabel.style.display = 'block';
    populateCouncilDropdown();
  } else {
    councilLabel.style.display = 'none';
    councilSelect.value = '';
  }

  if (type.value) {
    dateFieldset.style.display = 'block';
    loadAvailableDates();
  } else {
    dateFieldset.style.display = 'none';
    timeFieldset.style.display = 'none';
    calendarContainer.innerHTML = '';
    times.innerHTML = '';
    dateField.value = '';
    timeField.value = '';
  }

  updateRecordsWarning();
}

type.onchange = updateMedicalTypeFields;
councilSelect.onchange = updateRecordsWarning;
clinicSelect.onchange = updateRecordsWarning;

function recordsRequirement() {
  if (type.value === 'Taxi / private-hire medical') {
    if (!councilSelect.value) return null;
    const councilName = councilSelect.value.toLowerCase();
    if (councilName.includes('wolverhampton')) {
      return { kind: 'full medical records', age: 'within the last 4 weeks', authority: councilSelect.value };
    }
    if (councilName.includes('full medical records') || councilName.includes('full records') || councilName.includes('medical records required')) {
      return { kind: 'full medical records', age: 'within the last 3 months', authority: councilSelect.value };
    }
    if (councilName.includes('medical summary')) {
      return { kind: 'medical summary', age: 'within the last 3 months', authority: councilSelect.value };
    }
    return { kind: 'records confirmation', age: 'as specified by your council', authority: councilSelect.value, contactFirst: true };
  }

  if (type.value === 'HGV / LGV medical' || type.value === 'Bus / coach medical') {
    return { kind: 'medical summary', age: 'within the last 3 months', authority: type.value };
  }

  return null;
}

function updateRecordsWarning() {
  const requirement = recordsRequirement();
  if (!clinicSelect.value || !requirement) {
    recordsWarning.style.display = 'none';
    return;
  }

  if (requirement.contactFirst) {
    recordsWarningTitle.textContent = 'Please confirm your records requirement before booking';
    recordsWarningAction.textContent = 'Your selected council does not have a confirmed records rule in our list. Call us before booking so we can confirm exactly what you need to obtain from your GP surgery.';
    recordsWarningBooking.textContent = 'Please do not make a booking until the records requirement has been confirmed.';
  } else {
    const article = requirement.kind === 'medical summary' ? 'a' : 'your';
    recordsWarningTitle.textContent = `${requirement.kind === 'medical summary' ? 'Medical summary' : 'Full medical records'} required`;
    recordsWarningAction.textContent = `Contact your GP surgery and ask for ${article} ${requirement.kind}, either by email or as a paper copy. It must be dated ${requirement.age} and brought to your appointment.`;
    recordsWarningBooking.textContent = `Please do not make a booking unless you have your ${requirement.kind}.`;
  }

  const subject = requirement.contactFirst
    ? 'Request for confirmation of medical records required'
    : `Request for ${requirement.kind}`;
  const body = requirement.contactFirst
    ? `Dear GP surgery,\n\nI am arranging a driver medical for ${requirement.authority}. Please can you advise how I can request the medical records required for this assessment?\n\nKind regards,`
    : `Dear GP surgery,\n\nI am arranging a driver medical for ${requirement.authority}. Please provide my ${requirement.kind}, dated ${requirement.age}. I can receive this securely by email or collect a paper copy to bring to my appointment.\n\nPlease let me know if you need identification or a consent form from me.\n\nKind regards,`;
  gpTemplateLink.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  gpTemplateLink.textContent = requirement.contactFirst
    ? 'Email your GP to ask about records →'
    : `Email your GP for ${requirement.kind} →`;
  recordsWarning.style.display = 'block';
}

function populateCouncilDropdown() {
  councilSelect.innerHTML = '<option value="">Select your council</option>';
  
  const popularGroup = document.createElement('optgroup');
  popularGroup.label = 'Popular councils';
  
  const allGroup = document.createElement('optgroup');
  allGroup.label = 'All councils';
  
  councils.forEach(council => {
    const option = document.createElement('option');
    option.value = council.name;
    option.textContent = council.name;
    
    if (council.popular) {
      popularGroup.appendChild(option);
    } else {
      allGroup.appendChild(option);
    }
  });
  
  councilSelect.appendChild(popularGroup);
  councilSelect.appendChild(allGroup);
}

// Load available dates
function londonNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: Number(values.hour) * 60 + Number(values.minute)
  };
}

function dateFromKey(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function dateKey(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('-');
}

function slotMinutes(time) {
  const match = /^(\d{1,2}):(\d{2})(am|pm)$/.exec(time);
  if (!match) return NaN;
  let hour = Number(match[1]) % 12;
  if (match[3] === 'pm') hour += 12;
  return hour * 60 + Number(match[2]);
}

function fallbackDates() {
  const now = londonNow();
  const nextTuesday = dateFromKey(now.date);
  while (nextTuesday.getUTCDay() !== 2) nextTuesday.setUTCDate(nextTuesday.getUTCDate() + 1);
  if (dateKey(nextTuesday) === now.date && now.minutes >= 1290) {
    nextTuesday.setUTCDate(nextTuesday.getUTCDate() + 7);
  }

  return Array.from({ length: 8 }, (_, index) => {
    const day = new Date(nextTuesday);
    day.setUTCDate(day.getUTCDate() + index * 7);
    return {
      date: dateKey(day),
      label: day.toLocaleDateString('en-GB', {
        timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short'
      }),
      available: true
    };
  });
}

function fallbackSlots(date) {
  const now = londonNow();
  const slots = [];
  for (let minute = 1110; minute <= 1290; minute += 15) {
    const hour = Math.floor(minute / 60);
    const minutes = minute % 60;
    const time = `${hour - 12}:${String(minutes).padStart(2, '0')}pm`;
    slots.push({
      time,
      available: date > now.date || (date === now.date && slotMinutes(time) > now.minutes)
    });
  }
  return slots;
}

async function loadAvailableDates() {
  try {
    const response = await fetch(apiUrl('/api/available-dates'));
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error(`Availability API returned ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data.dates)) throw new Error('Availability API returned invalid dates');
    renderCalendar(data.dates);
  } catch (error) {
    console.warn('Using automatic local date availability:', error);
    renderCalendar(fallbackDates());
  }
}

function renderCalendar(dates) {
  calendarContainer.innerHTML = '';
  
  const calendarGrid = document.createElement('div');
  calendarGrid.className = 'calendar-grid';
  
  dates.forEach(dateInfo => {
    const dateButton = document.createElement('button');
    dateButton.type = 'button';
    dateButton.className = 'calendar-date';
    dateButton.textContent = dateInfo.label;
    dateButton.dataset.date = dateInfo.date;
    
    if (!dateInfo.available) {
      dateButton.classList.add('unavailable');
      dateButton.disabled = true;
    } else {
      dateButton.onclick = () => selectDate(dateInfo.date, dateButton);
    }
    
    calendarGrid.appendChild(dateButton);
  });
  
  calendarContainer.appendChild(calendarGrid);
}

function selectDate(date, button) {
  document.querySelectorAll('.calendar-date').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');
  dateField.value = date;
  
  // Load available time slots for this date
  loadAvailableSlots(date);
}

async function loadAvailableSlots(date) {
  try {
    const response = await fetch(apiUrl(`/api/available-slots/${date}`));
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error(`Availability API returned ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data.slots)) throw new Error('Availability API returned invalid slots');
    renderTimeSlots(data.slots);
    timeFieldset.style.display = 'block';
  } catch (error) {
    console.warn('Using automatic local time availability:', error);
    renderTimeSlots(fallbackSlots(date));
    timeFieldset.style.display = 'block';
  }
}

function renderTimeSlots(slots) {
  times.innerHTML = '';
  
  slots.forEach(slotInfo => {
    const timeButton = document.createElement('button');
    timeButton.type = 'button';
    timeButton.className = 'slot';
    timeButton.textContent = slotInfo.time;
    
    if (!slotInfo.available) {
      timeButton.classList.add('unavailable');
      timeButton.disabled = true;
      timeButton.style.textDecoration = 'line-through';
      timeButton.style.opacity = '1';
      timeButton.style.color = '#777';
      timeButton.style.backgroundColor = '#f1f1f1';
      timeButton.style.cursor = 'not-allowed';
    } else {
      timeButton.onclick = () => selectTime(slotInfo.time, timeButton);
    }
    
    times.appendChild(timeButton);
  });
}

function selectTime(time, button) {
  document.querySelectorAll('#time-options .slot').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');
  timeField.value = time;
}

// Form submission
form.onsubmit = async (event) => {
  event.preventDefault();
  
  if (!dateField.value || !timeField.value) {
    success.textContent = 'Please choose a date and a time.';
    return;
  }
  
  const formData = new FormData(form);
  const bookingData = {
    medicalType: formData.get('medicalType'),
    clinic: formData.get('clinic'),
    date: dateField.value,
    time: timeField.value,
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    postcode: formData.get('postcode'),
    council: formData.get('council'),
    paymentChoice: formData.get('paymentChoice')
  };
  
  try {
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Opening secure payment…';
    const response = await fetch(apiUrl('/api/create-booking-checkout'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });
    
    const result = await response.json().catch(() => ({}));
    
    if (response.ok && result.url) {
      window.location.assign(result.url);
    } else {
      success.textContent = result.error || 'Failed to book appointment. Please try again.';
      submitButton.disabled = false;
      submitButton.textContent = 'Continue to secure payment →';
    }
  } catch (error) {
    console.error('Error booking appointment:', error);
    success.textContent = 'Unable to open secure payment. Please try again or call 07480 609640.';
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.textContent = 'Continue to secure payment →';
  }
};

// Council guide section (existing functionality)
const council = document.querySelector('#council');
const message = document.querySelector('#council-message');
if (council && message) {
  council.onchange = () => {
    message.textContent = council.value === 'tfl' 
      ? 'TfL PCO: bring full GP medical records dated within the past 3 months. NHS App access alone is not sufficient.' 
      : council.value === 'other' 
      ? "Call 07480 609640 before booking. We will confirm whether we can complete your authority's form and what records are needed." 
      : 'Select an authority for records guidance.';
  };
}

document.querySelector('#year').textContent = new Date().getFullYear();
