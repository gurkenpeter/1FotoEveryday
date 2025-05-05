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
    const photoPreview = document.getElementById('photoPreview'); // Get the preview element

    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();

    // Event listener for the "Today" button next to the date input
    todayPhotoBtn.addEventListener('click', () => {
        const today = new Date();
        const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        photoDateInput.value = formattedToday;
    });

    // Event listener for the "Previous" button (main calendar)
    prevMonthMainBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendarView(currentYear, currentMonth);
    });

    // Event listener for the "Next" button (main calendar)
    nextMonthMainBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendarView(currentYear, currentMonth);
    });

    deleteAllPhotosButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete ALL saved photos? This action cannot be undone!')) {
            deleteAllPhotos();
            alert('All saved photos have been deleted.');
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
                alert(`Photo saved for ${dateToSave}!`);
                photoInput.value = '';
                photoDateInput.value = '';
                photoDescription.value = '';
                photoPreview.src = ''; // Clear preview
                photoPreview.style.display = 'none'; // Hide preview
                updateCalendarView(currentYear, currentMonth);
                // Reload day info after saving, if the current date is selected
                const selectedDateInCalendar = document.querySelector('.calendar-day.selected');
                if (selectedDateInCalendar) {
                    showDayInfo(selectedDateInCalendar.textContent);
                }
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a photo and a date first.');
        }
    });

    function deleteAllPhotos() {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith('photo-')) {
                localStorage.removeItem(key);
            }
        }
        console.log('All photos have been deleted from local storage.');
    }

    function savePhotoData(date, imageData, description) {
        const key = `photo-${date}`;
        const data = {
            imageData: imageData,
            description: description
        };
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Data saved for ${date}:`, data);
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

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
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
                // Remove 'selected' class from all other days
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                // Add 'selected' class to the clicked day
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
            selectedDayInfoDiv.innerHTML += `<p>No photo saved for this day.</p><button id="setDateButton" data-date="${date}">Save photo for this day</button>`;
            const setDateButton = document.getElementById('setDateButton');
            if (setDateButton) {
                setDateButton.addEventListener('click', () => {
                    const selectedDate = setDateButton.getAttribute('data-date');
                    photoDateInput.value = selectedDate;
                });
            }
        }
    }

    // Event listener for photo selection to display preview
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

    // Initial call to generate the calendar
    updateCalendarView(currentYear, currentMonth);

    // Show information for today on initial load
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    showDayInfo(formattedToday);

    // Mark today's date in the calendar on initial load
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
    console.log('All photos have been deleted from local storage.');
}

function savePhotoData(date, imageData, description) {
    const key = `photo-${date}`;
    const data = {
        imageData: imageData,
        description: description
    };
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`Data saved for ${date}:`, data);
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

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
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
        selectedDayInfoDiv.innerHTML += `<p>No photo saved for this day.</p><button id="setDateButton" data-date="${date}">Save photo for this day</button>`;
        const setDateButton = document.getElementById('setDateButton');
        if (setDateButton) {
            setDateButton.addEventListener('click', () => {
                const selectedDate = setDateButton.getAttribute('data-date');
                photoDateInput.value = selectedDate;
            });
        }
    }
}