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
    const photoPreview = document.getElementById('photoPreview');
    const slideshowArea = document.getElementById('slideshowArea'); // Diashow-Bereich
    const slideshowImage = document.getElementById('slideshowImage'); // Diashow-Bild
    const prevSlideBtn = document.getElementById('prevSlide'); // "Zurück" Button Diashow
    const nextSlideBtn = document.getElementById('nextSlide'); // "Weiter" Button Diashow

    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();
    let allPhotos = []; // Array zum Speichern aller Fotos
    let currentSlideIndex = 0; // Aktueller Index in der Diashow

    // Event listener for the "Today" button next to the date input
    todayPhotoBtn.addEventListener('click', () => {
        const today = new Date();
        const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        photoDateInput.value = formattedToday;
    });

    // Event listeners for the main calendar navigation
    prevMonthMainBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendarView(currentYear, currentMonth);
        hideSlideshow(); // Diashow ausblenden beim Navigieren im Kalender
    });

    nextMonthMainBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendarView(currentYear, currentMonth);
        hideSlideshow(); // Diashow ausblenden beim Navigieren im Kalender
    });

    deleteAllPhotosButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete ALL saved photos? This action cannot be undone!')) {
            deleteAllPhotos();
            alert('All saved photos have been deleted.');
            updateCalendarView(currentYear, currentMonth);
            selectedDayInfoDiv.innerHTML = '';
            hideSlideshow(); // Diashow ausblenden nach dem Löschen
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
                photoPreview.src = '';
                photoPreview.style.display = 'none';
                updateCalendarView(currentYear, currentMonth);
                const selectedDateInCalendar = document.querySelector('.calendar-day.selected');
                if (selectedDateInCalendar) {
                    showDayInfo(selectedDateInCalendar.textContent);
                }
                loadAllPhotosForSlideshow(); // Fotos neu laden nach dem Speichern
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
        allPhotos = []; // Array leeren
        currentSlideIndex = 0;
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
                dayCell.addEventListener('click', () => {
                    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                    dayCell.classList.add('selected');
                    showDayInfo(date);
                    loadAndShowSlideshow(date); // Diashow laden und anzeigen
                });
            } else {
                dayCell.addEventListener('click', () => {
                    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                    dayCell.classList.add('selected');
                    showDayInfo(date);
                    hideSlideshow(); // Diashow ausblenden, wenn kein Foto vorhanden
                });
            }
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
            selectedDayInfoDiv.innerHTML += `<img src="${photoData.imageData}" style="max-width: 200px;"><p>${photoData.description || ''}</p><button id="openSlideshowBtn" style="margin-top: 10px; padding: 8px 12px; cursor: pointer;">Open Slideshow</button>`;
            const openSlideshowBtn = document.getElementById('openSlideshowBtn');
            if (openSlideshowBtn) {
                openSlideshowBtn.addEventListener('click', () => {
                    loadAndShowSlideshow(date);
                });
            }
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

    function loadAllPhotosForSlideshow() {
        allPhotos = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('photo-')) {
                const photoData = getPhotoData(key.substring(6)); // Remove 'photo-' prefix
                if (photoData && photoData.imageData) {
                    allPhotos.push(photoData.imageData);
                }
            }
        }
        console.log('All photos loaded for slideshow:', allPhotos.length);
        currentSlideIndex = 0;
    }

    function showSlide(index) {
        if (allPhotos.length > 0) {
            currentSlideIndex = (index + allPhotos.length) % allPhotos.length;
            slideshowImage.src = allPhotos[currentSlideIndex];
        }
    }

    function loadAndShowSlideshow(selectedDate) {
        loadAllPhotosForSlideshow();
        if (allPhotos.length > 0) {
            slideshowArea.style.display = 'block';
            const selectedPhotoData = getPhotoData(selectedDate);
            if (selectedPhotoData && selectedPhotoData.imageData) {
                const index = allPhotos.indexOf(selectedPhotoData.imageData);
                showSlide(index !== -1 ? index : 0);
            } else {
                showSlide(0); // Show the first photo if the selected date's photo isn't found
            }
        } else {
            alert('No photos available for the slideshow.');
            hideSlideshow();
        }
    }

    function hideSlideshow() {
        slideshowArea.style.display = 'none';
    }

    // Event listeners for slideshow navigation
    prevSlideBtn.addEventListener('click', () => {
        showSlide(currentSlideIndex - 1);
    });

    nextSlideBtn.addEventListener('click', () => {
        showSlide(currentSlideIndex + 1);
    });

    // Initial calls
    updateCalendarView(currentYear, currentMonth);
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    showDayInfo(formattedToday);
    const todayCell = document.querySelector(`.calendar-day:nth-child(${new Date().getDate() + new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()})`);
    if (todayCell) {
        todayCell.classList.add('selected');
    }

    // Load all photos initially for the slideshow (optional, can be loaded on demand)
    loadAllPhotosForSlideshow();
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
            dayCell.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                dayCell.classList.add('selected');
                showDayInfo(date);
                loadAndShowSlideshow(date); // Diashow laden und anzeigen
            });
        } else {
            dayCell.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                dayCell.classList.add('selected');
                showDayInfo(date);
                hideSlideshow(); // Diashow ausblenden, wenn kein Foto vorhanden
            });
        }
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
        selectedDayInfoDiv.innerHTML += `<img src="${photoData.imageData}" style="max-width: 200px;"><p>${photoData.description || ''}</p><button id="openSlideshowBtn" style="margin-top: 10px; padding: 8px 12px; cursor: pointer;">Open Slideshow</button>`;
        const openSlideshowBtn = document.getElementById('openSlideshowBtn');
        if (openSlideshowBtn) {
            openSlideshowBtn.addEventListener('click', () => {
                loadAndShowSlideshow(date);
            });
        }
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