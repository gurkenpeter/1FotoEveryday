document.addEventListener('DOMContentLoaded', () => {
    const photoInput = document.getElementById('photoInput');
    const photoDescription = document.getElementById('photoDescription');
    const savePhotoButton = document.getElementById('savePhotoButton');
    const calendarDiv = document.getElementById('calendar');
    const selectedDayInfoDiv = document.getElementById('selectedDayInfo');
    const photoDateInput = document.getElementById('photoDate');
    const deleteAllPhotosButton = document.getElementById('deleteAllPhotosButton');
    const prevMonthMainBtn = document.getElementById('prevMonthMain');
    const nextMonthMainBtn = document.getElementById('nextMonthMain');
    const calendarViewHeader = document.getElementById('calendarViewHeader');
    const todayPhotoBtn = document.getElementById('todayPhotoBtn');
    const photoPreview = document.getElementById('photoPreview'); // Hol das Vorschau-Element

    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();

    // Event Listener für den "Heute"-Button neben dem Datumsauswahlfeld
    todayPhotoBtn.addEventListener('click', () => {
        const today = new Date();
        const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        photoDateInput.value = formattedToday;
    });

    // Event Listener für den "Zurück"-Button (Hauptkalender)
    prevMonthMainBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendarView(currentYear, currentMonth);
    });

    // Event Listener für den "Weiter"-Button (Hauptkalender)
    nextMonthMainBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendarView(currentYear, currentMonth);
    });

    deleteAllPhotosButton.addEventListener('click', () => {
        if (confirm('Bist du sicher, dass du ALLE gespeicherten Fotos löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden!')) {
            deleteAllPhotos();
            alert('Alle gespeicherten Fotos wurden gelöscht.');
            updateCalendarView(currentYear, currentMonth);
            selectedDayInfoDiv.innerHTML = '';
        }
    });

    savePhotoButton.addEventListener('click', () => {
        const file = photoInput.files[0];
        const description = photoDescription.value;
        const dateToSave = photoDateInput.value;

        if (file && dateToSave) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Image = reader.result;
                savePhotoData(dateToSave, base64Image, description);
                alert(`Foto für den ${dateToSave} gespeichert!`);
                photoInput.value = '';
                photoDateInput.value = '';
                photoDescription.value = '';
                photoPreview.src = ''; // Vorschau leeren
                photoPreview.style.display = 'none'; // Vorschau ausblenden
                updateCalendarView(currentYear, currentMonth);
                // Nach dem Speichern auch die Tagesinfo neu laden, falls das aktuelle Datum ausgewählt ist
                const selectedDateInCalendar = document.querySelector('.calendar-day.selected');
                if (selectedDateInCalendar) {
                    showDayInfo(selectedDateInCalendar.textContent);
                }
            };
            reader.readAsDataURL(file);
        } else {
            alert('Bitte wähle zuerst ein Foto und ein Datum aus.');
        }
    });

    function deleteAllPhotos() {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith('photo-')) {
                localStorage.removeItem(key);
            }
        }
        console.log('Alle Fotos wurden aus dem Local Storage gelöscht.');
    }

    function savePhotoData(date, imageData, description) {
        const key = `photo-${date}`;
        const data = {
            imageData: imageData,
            description: description
        };
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Daten für ${date} gespeichert:`, data);
    }

    function getPhotoData(date) {
        const key = `photo-${date}`;
        const storedData = localStorage.getItem(key);
        return storedData ? JSON.parse(storedData) : null;
    }

    function generateCalendar(year, month) {
        calendarDiv.innerHTML = '';

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startingDay = firstDayOfMonth.getDay();

        const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
        calendarViewHeader.textContent = `${monthNames[month]} ${year}`;

        for (let i = 0; i < startingDay; i++) {
            const emptyCell = document.createElement('div');
            calendarDiv.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            dayCell.textContent = day;
            if (getPhotoData(date)) {
                dayCell.classList.add('has-photo');
            }
            dayCell.addEventListener('click', () => {
                // Entferne die Klasse 'selected' von allen anderen Tagen
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                // Füge die Klasse 'selected' zum aktuell geklickten Tag hinzu
                dayCell.classList.add('selected');
                showDayInfo(date);
            });
            calendarDiv.appendChild(dayCell);
        }
    }

    function updateCalendarView(year, month) {
        generateCalendar(year, month);
    }

    function showDayInfo(date) {
        const photoData = getPhotoData(date);
        selectedDayInfoDiv.innerHTML = `<h3>${date}</h3>`;
        if (photoData) {
            selectedDayInfoDiv.innerHTML += `<img src="${photoData.imageData}" style="max-width: 200px;"><p>${photoData.description || ''}</p>`;
        } else {
            selectedDayInfoDiv.innerHTML += `<p>Kein Foto für diesen Tag gespeichert.</p><button id="setDateButton" data-date="${date}">Foto für diesen Tag speichern</button>`;
            const setDateButton = document.getElementById('setDateButton');
            if (setDateButton) {
                setDateButton.addEventListener('click', () => {
                    const selectedDate = setDateButton.getAttribute('data-date');
                    photoDateInput.value = selectedDate;
                });
            }
        }
    }

    // Event Listener für die Fotoauswahl, um eine Vorschau anzuzeigen
    photoInput.addEventListener('change', () => {
        const file = photoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                photoPreview.src = reader.result;
                photoPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            photoPreview.src = '';
            photoPreview.style.display = 'none';
        }
    });

    // Initialer Aufruf des Hauptkalenders
    updateCalendarView(currentYear, currentMonth);

    // Zeige die Informationen für den heutigen Tag beim ersten Laden
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    showDayInfo(formattedToday);

    // Markiere den heutigen Tag im Kalender beim ersten Laden
    const todayCell = document.querySelector(`.calendar-day:nth-child(${new Date().getDate() + new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()})`);
    if (todayCell) {
        todayCell.classList.add('selected');
    }
});

function deleteAllPhotos() {
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key.startsWith('photo-')) {
            localStorage.removeItem(key);
        }
    }
    console.log('Alle Fotos wurden aus dem Local Storage gelöscht.');
}

function savePhotoData(date, imageData, description) {
    const key = `photo-${date}`;
    const data = {
        imageData: imageData,
        description: description
    };
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`Daten für ${date} gespeichert:`, data);
}

function getPhotoData(date) {
    const key = `photo-${date}`;
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : null;
}

function generateCalendar(year, month) {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDay = firstDayOfMonth.getDay();

    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    calendarViewHeader.textContent = `${monthNames[month]} ${year}`;
    calendarDiv.innerHTML = '';

    for (let i = 0; i < startingDay; i++) {
        const emptyCell = document.createElement('div');
        calendarDiv.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        dayCell.textContent = day;
        if (getPhotoData(date)) {
            dayCell.classList.add('has-photo');
        }
        dayCell.addEventListener('click', () => {
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            dayCell.classList.add('selected');
            showDayInfo(date);
        });
        calendarDiv.appendChild(dayCell);
    }
}

function updateCalendarView(year, month) {
    generateCalendar(year, month);
}

function showDayInfo(date) {
    const photoData = getPhotoData(date);
    selectedDayInfoDiv.innerHTML = `<h3>${date}</h3>`;
    if (photoData) {
        selectedDayInfoDiv.innerHTML += `<img src="${photoData.imageData}" style="max-width: 200px;"><p>${photoData.description || ''}</p>`;
    } else {
        selectedDayInfoDiv.innerHTML += `<p>Kein Foto für diesen Tag gespeichert.</p><button id="setDateButton" data-date="${date}">Foto für diesen Tag speichern</button>`;
        const setDateButton = document.getElementById('setDateButton');
        if (setDateButton) {
            setDateButton.addEventListener('click', () => {
                const selectedDate = setDateButton.getAttribute('data-date');
                photoDateInput.value = selectedDate;
            });
        }
    }
}