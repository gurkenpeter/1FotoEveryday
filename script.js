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
    const photoPreview = document.getElementById('photoPreview'); // This needs to exist in HTML
    const slideshowArea = document.getElementById('slideshowArea'); // Diashow-Bereich
    const slideshowImage = document.getElementById('slideshowImage'); // Diashow-Bild
    const prevSlideBtn = document.getElementById('prevSlide'); // "Zurück" Button Diashow
    const nextSlideBtn = document.getElementById('nextSlide'); // "Weiter" Button Diashow

    // NEW: Elements for fullscreen slideshow based on latest HTML
    const slideshowFullscreen = document.getElementById('slideshowFullscreen');
    const fullscreenImage = document.getElementById('fullscreenImage');
    const prevFullscreenBtn = document.getElementById('prevFullscreen');
    const nextFullscreenBtn = document.getElementById('nextFullscreen');
    const fullscreenBackButton = document.getElementById('fullscreenBackButton');


    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();
    let allPhotos = []; // Array zum Speichern aller Fotos (Base64-Strings)
    let currentSlideIndex = 0; // Aktueller Index in der Diashow
    let slideshowInterval; // Variable für das automatische Scrollen (Fullscreen)

    // --- Helper Functions (nested for scope) ---

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
        calendarDiv.innerHTML = ''; // Kalenderinhalt leeren

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startingDay = firstDayOfMonth.getDay(); // 0 = Sonntag, 1 = Montag, ...

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        calendarViewHeader.textContent = `${monthNames[month]} ${year}`;

        // Leere Zellen für die Tage vor dem 1. des Monats
        for (let i = 0; i < startingDay; i++) {
            const emptyCell = document.createElement('div');
            calendarDiv.appendChild(emptyCell);
        }

        // Tage des Monats
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            dayCell.textContent = day;
            dayCell.setAttribute('data-date', date); // <-- WICHTIG: Füge das data-date Attribut hinzu

            if (getPhotoData(date)) {
                dayCell.classList.add('has-photo');
            }
            
            dayCell.addEventListener('click', () => {
                // Die Logik zum Setzen der 'selected' Klasse ist jetzt in showDayInfo
                showDayInfo(date);
                hideSlideshow(); // Standard-Diashow ausblenden
                hideFullscreenSlideshow(); // Fullscreen-Diashow ausblenden
            });
            
            calendarDiv.appendChild(dayCell);
        }
    }

    function updateCalendarView(year, month) {
        generateCalendar(year, month);
    }

    function showDayInfo(date) {
        // WICHTIG: Entferne 'selected' von allen anderen Kalendertagen
        document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));

        // WICHTIG: Finde die spezifische Tageszelle und füge 'selected' hinzu
        const targetDayCell = document.querySelector(`.calendar-day[data-date="${date}"]`);
        if (targetDayCell) {
            targetDayCell.classList.add('selected');
        }

        const photoData = getPhotoData(date);
        selectedDayInfoDiv.innerHTML = `<h3>${date}</h3>`;
        slideshowArea.style.display = 'none'; // Standard-Diashow ausblenden

        if (photoData) {
            // Changed button ID to "openFullscreenBtn" to match previous HTML
            selectedDayInfoDiv.innerHTML += `<img src="${photoData.imageData}" style="max-width: 200px;"><p>${photoData.description || ''}</p><button id="openFullscreenBtn" style="margin-top: 10px; padding: 8px 12px; cursor: pointer;">Open Fullscreen Slideshow</button>`;
            const openFullscreenBtn = document.getElementById('openFullscreenBtn');
            if (openFullscreenBtn) {
                openFullscreenBtn.addEventListener('click', () => {
                    loadAndShowFullscreenSlideshow(date); // Call the fullscreen slideshow
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

    // Slideshow functions
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

    // Function for the single slideshow area (not fullscreen)
    function showSlide(index) {
        if (allPhotos.length > 0) {
            currentSlideIndex = (index + allPhotos.length) % allPhotos.length;
            slideshowImage.src = allPhotos[currentSlideIndex];
        }
    }

    function loadAndShowSlideshow(selectedDate) { // This seems to be for the small slideshow
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

    // Fullscreen Slideshow Functions
    function showFullscreenSlide(index) {
        if (allPhotos.length > 0) {
            currentSlideIndex = (index + allPhotos.length) % allPhotos.length;
            fullscreenImage.src = allPhotos[currentSlideIndex];
        }
    }

    function startAutomaticSlideshow() {
        clearInterval(slideshowInterval); // Clear existing interval
        slideshowInterval = setInterval(() => {
            showFullscreenSlide(currentSlideIndex + 1);
        }, 3000); // Every 3 seconds
    }

    function stopAutomaticSlideshow() {
        clearInterval(slideshowInterval);
    }

    function loadAndShowFullscreenSlideshow(selectedDate) {
        loadAllPhotosForSlideshow();
        if (allPhotos.length > 0) {
            slideshowFullscreen.style.display = 'flex'; // Use flex to center content
            document.body.style.overflow = 'hidden'; // Hide main scrollbar

            const selectedPhotoData = getPhotoData(selectedDate);
            if (selectedPhotoData && selectedPhotoData.imageData) {
                const index = allPhotos.indexOf(selectedPhotoData.imageData);
                showFullscreenSlide(index !== -1 ? index : 0);
            } else {
                showFullscreenSlide(0);
            }
            startAutomaticSlideshow();
        } else {
            alert('No photos available for the slideshow.');
            hideFullscreenSlideshow();
        }
    }

    function hideFullscreenSlideshow() {
        slideshowFullscreen.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore main scrollbar
        stopAutomaticSlideshow();
    }


    // --- Event Listeners ---

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
        selectedDayInfoDiv.innerHTML = ''; // Clear day info when navigating months
        hideSlideshow();
        hideFullscreenSlideshow();
    });

    nextMonthMainBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendarView(currentYear, currentMonth);
        selectedDayInfoDiv.innerHTML = ''; // Clear day info when navigating months
        hideSlideshow();
        hideFullscreenSlideshow();
    });

    deleteAllPhotosButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete ALL saved photos? This action cannot be undone!')) {
            deleteAllPhotos(); // This deleteAllPhotos is the one defined above
            alert('All saved photos have been deleted.');
            updateCalendarView(currentYear, currentMonth);
            selectedDayInfoDiv.innerHTML = '';
            hideSlideshow();
            hideFullscreenSlideshow();
        }
    });

    savePhotoButton.addEventListener('click', () => {
        console.log('Save button clicked.'); // Debugging log
        const file = photoInput.files[0];
        const description = photoDescription.value;
        const dateToSave = photoDateInput.value;

        console.log('File:', file, 'Date:', dateToSave); // Debugging log

        if (file && dateToSave) {
            console.log('File and date are valid, attempting save...'); // Debugging log
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Image = reader.result;
                savePhotoData(dateToSave, base64Image, description); // This savePhotoData is the one defined above

                alert(`Photo saved for ${dateToSave}!`); // This alert should now work
                photoInput.value = '';
                photoDateInput.value = '';
                photoDescription.value = '';
                if (photoPreview) { // Added a check for photoPreview in case of HTML issue
                    photoPreview.src = '';
                    photoPreview.style.display = 'none';
                }

                // WICHTIG: Korrekte Logik zum Aktualisieren des Kalenders und Auswählen des Tages
                updateCalendarView(currentYear, currentMonth);
                showDayInfo(dateToSave); // WICHTIG: Rufe showDayInfo mit dem korrekten Datum auf

                loadAllPhotosForSlideshow(); // Fotos neu laden nach dem Speichern
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a photo and a date first.');
        }
    });

    // Event listener for photo selection to display preview
    photoInput.addEventListener('change', () => {
        const file = photoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (photoPreview) { // Added a check for photoPreview
                    photoPreview.src = reader.result;
                    photoPreview.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        } else {
            if (photoPreview) { // Added a check for photoPreview
                photoPreview.src = '';
                photoPreview.style.display = 'none';
            }
        }
    });

    // Event listeners for slideshow navigation (standard, not fullscreen)
    prevSlideBtn.addEventListener('click', () => {
        showSlide(currentSlideIndex - 1);
    });

    nextSlideBtn.addEventListener('click', () => {
        showSlide(currentSlideIndex + 1);
    });

    // Event listeners for fullscreen slideshow navigation
    prevFullscreenBtn.addEventListener('click', () => {
        stopAutomaticSlideshow();
        showFullscreenSlide(currentSlideIndex - 1);
        startAutomaticSlideshow();
    });

    nextFullscreenBtn.addEventListener('click', () => {
        stopAutomaticSlideshow();
        showFullscreenSlide(currentSlideIndex + 1);
        startAutomaticSlideshow();
    });

    fullscreenBackButton.addEventListener('click', () => {
        hideFullscreenSlideshow();
    });


    // --- Initial calls ---
    updateCalendarView(currentYear, currentMonth);
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    showDayInfo(formattedToday); // Dies wählt heute aus und aktualisiert die Info-Box

    // Lade alle Fotos beim Start (optional, kann auch bei Bedarf geladen werden)
    loadAllPhotosForSlideshow();
});
