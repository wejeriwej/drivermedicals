const form = document.querySelector('#booking-form');
const postcodeLabel = form?.querySelector('input[name="postcode"]')?.closest('label');

if (postcodeLabel) {
  const addressFields = document.createElement('div');
  addressFields.className = 'booking-address-fields';
  addressFields.innerHTML = `
    <label>Address line 1 *<input name="addressLine1" autocomplete="address-line1" required></label>
    <label>Address line 2 <input name="addressLine2" autocomplete="address-line2"></label>
    <div class="formrow"><label>Town / city *<input name="city" autocomplete="address-level2" required></label><label>Postcode *<input name="postcode" autocomplete="postal-code" required></label></div>
  `;
  postcodeLabel.replaceWith(addressFields);
}

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
const API_BASE_URL = 'https://motor-medicals-api.onrender.com';
const apiUrl = path => `${API_BASE_URL}${path}`;

const clinicName = 'London Clinic – Greenwich, Linear House, Peyton Place, London SE10 8RS';
if (clinicSelect) {
  clinicSelect.innerHTML = `<option value="">Choose a clinic</option><option value="${clinicName}">London Clinic – Greenwich · Wednesday evenings</option>`;
  const clinicLocationNote = document.createElement('div');
  clinicLocationNote.className = 'clinic-location-note';
  clinicLocationNote.hidden = true;
  clinicLocationNote.innerHTML = '<strong>London Clinic – Greenwich</strong><address>Linear House<br>Peyton Place<br>London<br>SE10 8RS</address>';
  clinicSelect.closest('label')?.after(clinicLocationNote);
  clinicSelect.addEventListener('change', () => {
    clinicLocationNote.hidden = !clinicSelect.value;
  });
}

const notice = document.querySelector('.notice');
if (notice?.firstChild) notice.firstChild.textContent = 'London Clinic – Greenwich · Wednesday evenings ';
const heroEyebrow = document.querySelector('.hero .eyebrow');
if (heroEyebrow) heroEyebrow.textContent = 'Driver medicals at our London Clinic – Greenwich';
const heroClinicDay = document.querySelector('.hero ul li:last-child');
if (heroClinicDay) heroClinicDay.textContent = '✓ Wednesday evenings';
const appointmentCardDay = document.querySelector('.appointment-card strong');
if (appointmentCardDay) appointmentCardDay.textContent = 'Wednesday evening';
const appointmentCardLocation = document.querySelector('.appointment-card > p');
if (appointmentCardLocation) appointmentCardLocation.textContent = 'London Clinic – Greenwich';
const locationHighlight = document.querySelector('.highlights div:last-child');
if (locationHighlight) {
  locationHighlight.querySelector('b').textContent = 'London Clinic – Greenwich';
  locationHighlight.querySelector('span').textContent = 'Wednesdays, 6:30pm–9:30pm';
}
const bookingHeading = document.querySelector('.booking > div h2');
if (bookingHeading) bookingHeading.textContent = 'Choose your Wednesday appointment.';
const bookingIntroduction = document.querySelector('.booking > div > p:not(.eyebrow):not(.price)');
if (bookingIntroduction) bookingIntroduction.textContent = 'Appointments at our London Clinic – Greenwich, based at Linear House, are available on Wednesday evenings every 15 minutes from 6:30pm to 9:30pm.';
const dateLegend = document.querySelector('#date-fieldset legend');
if (dateLegend) dateLegend.textContent = 'Choose a Wednesday *';
const description = document.querySelector('meta[name="description"]');
if (description) description.content = 'Book an affordable £43 driver medical at our London Clinic – Greenwich, including a free eye test.';

const councilAvailabilityNote = document.createElement('p');
councilAvailabilityNote.className = 'council-availability-note';
councilAvailabilityNote.hidden = true;
councilAvailabilityNote.innerHTML = '<strong>Is your licensing authority missing?</strong> We cannot complete a medical form for an authority that is not listed. Please contact your GP surgery or licensing authority to arrange the correct medical.';
councilLabel?.after(councilAvailabilityNote);
councilAvailabilityNote.after(recordsWarning);

const sessionIncludesHeading = Array.from(document.querySelectorAll('.split h2'))
  .find(heading => heading.textContent.includes('free eye test'));

if (sessionIncludesHeading) {
  const sessionVisual = document.querySelector('.service-visual');
  const hgvImage = document.createElement('img');
  hgvImage.className = 'hgv-support-image';
  hgvImage.src = 'art/hgv-medical-support.png';
  hgvImage.alt = 'White HGV lorry at a logistics depot';
  sessionVisual?.appendChild(hgvImage);
}

const phoneBookingHelp = document.createElement('p');
phoneBookingHelp.className = 'booking-phone-help';
phoneBookingHelp.innerHTML = 'Finding it difficult to book an appointment? <a href="tel:07480609640">Call 07480 609640</a> and we will help you book over the phone.';
form?.querySelector('button[type="submit"]')?.after(phoneBookingHelp);

const bookingError = document.createElement('p');
bookingError.className = 'booking-error';
bookingError.hidden = true;
form?.querySelector('h3')?.after(bookingError);

const bookingFieldErrors = {
  medicalType: 'Choose a medical type so we can prepare the correct assessment form.',
  council: 'Choose your licensing authority so we can confirm the records you must bring.',
  clinic: 'Choose the clinic location before selecting your appointment.',
  appointmentDate: 'Choose an available Wednesday date before continuing.',
  appointmentTime: 'Choose an available time for your appointment.',
  paymentChoice: 'Choose whether you would like to pay the £5 deposit or the full £43 today.',
  firstName: 'Enter your first name so we know who the appointment is for.',
  lastName: 'Enter your last name so we can confirm your booking.',
  email: 'Enter a valid email address so we can send your appointment confirmation.',
  phone: 'Enter a phone number in case we need to contact you about your appointment.',
  addressLine1: 'Enter your address so we can include it with your booking details.',
  city: 'Enter your town or city so your address is complete.',
  postcode: 'Enter your postcode so your address is complete.'
};

function showBookingError(message) {
  bookingError.textContent = message;
  bookingError.hidden = false;
  bookingError.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

form?.addEventListener('invalid', event => {
  const field = event.target;
  const message = bookingFieldErrors[field.name || field.id]
    || (field.type === 'checkbox' ? 'Please confirm that we may contact you about this booking.' : 'Please complete this required field before continuing.');
  showBookingError(message);
}, true);

form?.addEventListener('input', () => {
  bookingError.hidden = true;
});

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

function updateMedicalTypeFields() {
  if (type.value === 'Taxi / private-hire medical') {
    councilLabel.style.display = 'block';
    councilAvailabilityNote.hidden = false;
    populateCouncilDropdown();
  } else {
    councilLabel.style.display = 'none';
    councilAvailabilityNote.hidden = true;
    councilSelect.value = '';
  }

  dateFieldset.style.display = 'block';
  loadAvailableDates();

  if (!type.value) {
    timeFieldset.style.display = 'none';
    times.innerHTML = '';
    dateField.value = '';
    timeField.value = '';
  }

  updateRecordsWarning();
}

type.onchange = updateMedicalTypeFields;
councilSelect.onchange = () => {
  councilAvailabilityNote.hidden = Boolean(councilSelect.value);
  updateRecordsWarning();
};

dateFieldset.style.display = 'block';
loadAvailableDates();

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
  if (!requirement) {
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

function displayAppointmentDate(value) {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function calendarDateLabel(value) {
  const date = dateFromKey(value);
  const day = date.getUTCDate();
  const remainder = day % 100;
  const suffix = remainder >= 11 && remainder <= 13
    ? 'th'
    : ({ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] || 'th');
  const weekday = date.toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short' });
  const month = date.toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'short' });
  return `${weekday} ${day}${suffix} ${month}`;
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
  const nextWednesday = dateFromKey(now.date);
  while (nextWednesday.getUTCDay() !== 3) nextWednesday.setUTCDate(nextWednesday.getUTCDate() + 1);
  if (dateKey(nextWednesday) === now.date && now.minutes >= 1290) {
    nextWednesday.setUTCDate(nextWednesday.getUTCDate() + 7);
  }

  return Array.from({ length: 8 }, (_, index) => {
    const day = new Date(nextWednesday);
    day.setUTCDate(day.getUTCDate() + index * 7);
    return {
      date: dateKey(day),
      label: calendarDateLabel(dateKey(day)),
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

function openHealthChecklist() {
  if (document.querySelector('.health-check-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'health-check-overlay';
  overlay.innerHTML = `
    <section class="health-check-modal" role="dialog" aria-modal="true" aria-labelledby="health-check-title">
      <button class="health-check-close" type="button" aria-label="Close health checklist">×</button>
      <p class="eyebrow">Before payment</p>
      <h2 id="health-check-title">A quick health checklist</h2>
      <p class="health-check-intro">Please answer these questions so you know what to bring. This is not a licence decision — your doctor, DVLA and licensing authority make the final assessment.</p>
      <form id="health-check-form">
        <div class="health-question-card" role="group" aria-labelledby="diabetes-question">
          <p class="health-question" id="diabetes-question">Do you have diabetes? *</p>
          <div class="health-answer-options"><label><input type="radio" name="hasDiabetes" value="yes" required> Yes</label><label><input type="radio" name="hasDiabetes" value="no"> No</label></div>
        </div>
        <div class="health-follow-up" data-follow-up="diabetes" hidden>
          <div class="health-question-card" role="group" aria-labelledby="hypo-medicine-question">
            <p class="health-question" id="hypo-medicine-question">Do you use insulin or medicine that can cause low blood glucose (hypos)? *</p>
            <div class="health-answer-options"><label><input type="radio" name="usesInsulinOrHypoMeds" value="yes"> Yes</label><label><input type="radio" name="usesInsulinOrHypoMeds" value="no"> No</label></div>
          </div>
          <div class="health-question-card" role="group" aria-labelledby="sglt2-question">
            <p class="health-question" id="sglt2-question">Do you take dapagliflozin or another SGLT2 inhibitor? *</p>
            <div class="health-answer-options"><label><input type="radio" name="usesSglt2" value="yes"> Yes</label><label><input type="radio" name="usesSglt2" value="no"> No</label></div>
          </div>
          <div class="health-guidance" data-guidance="diabetes" hidden></div>
        </div>
        <div class="health-question-card" role="group" aria-labelledby="epilepsy-question">
          <p class="health-question" id="epilepsy-question">Do you have epilepsy or a history of seizures? *</p>
          <div class="health-answer-options"><label><input type="radio" name="hasEpilepsy" value="yes" required> Yes</label><label><input type="radio" name="hasEpilepsy" value="no"> No</label></div>
        </div>
        <div class="health-guidance" data-guidance="epilepsy" hidden><strong>Important Group 2 guidance</strong><p>For HGV, bus and coach licensing, a person with epilepsy generally needs to have been seizure-free for 10 years and not taken epilepsy medicine during that period before a licence may be considered. A one-off seizure can have different requirements. Taxi/private-hire rules vary by authority — check with your licensing authority or treating clinician before booking.</p></div>
        <div class="health-question-card" role="group" aria-labelledby="blood-pressure-question">
          <p class="health-question" id="blood-pressure-question">Do you have high blood pressure, or take medicine for it? *</p>
          <div class="health-answer-options"><label><input type="radio" name="hasHighBloodPressure" value="yes" required> Yes</label><label><input type="radio" name="hasHighBloodPressure" value="no"> No</label></div>
        </div>
        <div class="health-guidance" data-guidance="blood-pressure" hidden><strong>Have your blood pressure well controlled before attending</strong><p>Please see your GP or treating clinician before the appointment if your blood pressure is not well controlled. For HGV, bus and coach (Group 2) licences, resting blood pressure consistently at or above 180/100 mmHg means you must stop driving and notify DVLA until it is controlled. Your clinician and licensing authority make the final decision.</p></div>
        <label class="health-acknowledgement"><input type="checkbox" required> I have read the guidance and understand that I must bring the relevant documents and equipment to my appointment.</label>
        <button class="button" type="submit">I understand — continue to payment <span>→</span></button>
      </form>
    </section>
  `;

  const close = () => overlay.remove();
  const diabetesFollowUp = overlay.querySelector('[data-follow-up="diabetes"]');
  const diabetesGuidance = overlay.querySelector('[data-guidance="diabetes"]');
  const epilepsyGuidance = overlay.querySelector('[data-guidance="epilepsy"]');
  const bloodPressureGuidance = overlay.querySelector('[data-guidance="blood-pressure"]');
  const diabetesInputs = overlay.querySelectorAll('input[name="hasDiabetes"]');
  const epilepsyInputs = overlay.querySelectorAll('input[name="hasEpilepsy"]');
  const bloodPressureInputs = overlay.querySelectorAll('input[name="hasHighBloodPressure"]');
  const treatmentInputs = overlay.querySelectorAll('input[name="usesInsulinOrHypoMeds"], input[name="usesSglt2"]');

  diabetesInputs.forEach(input => input.addEventListener('change', () => {
    const hasDiabetes = input.value === 'yes';
    diabetesFollowUp.hidden = !hasDiabetes;
    diabetesFollowUp.querySelectorAll('input').forEach(field => field.required = hasDiabetes);
    if (!hasDiabetes) {
      diabetesFollowUp.querySelectorAll('input').forEach(field => field.checked = false);
      diabetesGuidance.hidden = true;
    }
  }));
  epilepsyInputs.forEach(input => input.addEventListener('change', () => {
    epilepsyGuidance.hidden = input.value !== 'yes';
  }));
  bloodPressureInputs.forEach(input => input.addEventListener('change', () => {
    bloodPressureGuidance.hidden = input.value !== 'yes';
  }));
  treatmentInputs.forEach(input => input.addEventListener('change', () => {
    const insulinOrHypoMeds = overlay.querySelector('input[name="usesInsulinOrHypoMeds"]:checked')?.value === 'yes';
    const usesSglt2 = overlay.querySelector('input[name="usesSglt2"]:checked')?.value === 'yes';
    if (!insulinOrHypoMeds && !usesSglt2) {
      diabetesGuidance.hidden = true;
      return;
    }
    diabetesGuidance.hidden = false;
    diabetesGuidance.innerHTML = `${insulinOrHypoMeds ? '<strong>Bring six weeks of readings and your meter</strong><p>If you use insulin or medicines that can cause hypos, bring six weeks of blood-glucose readings and your blood-glucose meter (or access to your continuous monitor) to the appointment. Follow your clinician’s and licensing authority’s monitoring instructions when driving.</p>' : ''}${usesSglt2 ? '<strong>SGLT2 medicine note</strong><p>Dapagliflozin is not normally a hypo-causing medicine on its own, but it can have other important diabetes safety considerations. Bring your medication list and discuss any driving or sick-day advice with your treating clinician.</p>' : ''}`;
  }));
  overlay.querySelector('.health-check-close').addEventListener('click', close);
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  overlay.querySelector('#health-check-form').addEventListener('submit', event => {
    event.preventDefault();
    form.dataset.healthChecklistComplete = 'true';
    close();
    form.requestSubmit();
  });
  document.body.appendChild(overlay);
  overlay.querySelector('input[name="hasDiabetes"]').focus();
}

// Form submission
form.onsubmit = async (event) => {
  event.preventDefault();
  
  if (!dateField.value || !timeField.value) {
    showBookingError(!dateField.value
      ? 'Choose an available Wednesday date before continuing.'
      : 'Choose an available time for your appointment.');
    return;
  }

  if (!form.dataset.healthChecklistComplete) {
    openHealthChecklist();
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
    addressLine1: formData.get('addressLine1'),
    addressLine2: formData.get('addressLine2'),
    city: formData.get('city'),
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
