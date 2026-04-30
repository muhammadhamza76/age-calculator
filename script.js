document.addEventListener('DOMContentLoaded', () => {
    const dobInput = document.getElementById('dob');
    const targetDateInput = document.getElementById('target-date');
    const calcBtn = document.getElementById('calculate-btn');
    const errorMsg = document.getElementById('error-message');
    const resultsSection = document.getElementById('results-section');
    
    // Result elements
    const resYears = document.getElementById('res-years');
    const resMonths = document.getElementById('res-months');
    const resDays = document.getElementById('res-days');
    
    const statMonths = document.getElementById('stat-months');
    const statWeeks = document.getElementById('stat-weeks');
    const statDays = document.getElementById('stat-days');
    const statHours = document.getElementById('stat-hours');
    const statMinutes = document.getElementById('stat-minutes');
    const statSeconds = document.getElementById('stat-seconds');
    const statNextBirthday = document.getElementById('stat-next-birthday');

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Initialize Target Date to Today
    const today = new Date();

    // Initialize Flatpickr for fast, premium calendar selection (syncs with DD/MM/YYYY)
    flatpickr("#dob", {
        dateFormat: "d/m/Y",
        allowInput: true,
        maxDate: "today"
    });

    flatpickr("#target-date", {
        dateFormat: "d/m/Y",
        allowInput: true,
        defaultDate: today
    });

    // Input Masking Logic (DD/MM/YYYY)
    function applyDateMask(e) {
        let input = e.target;
        
        // Let backspace work naturally
        if (e.inputType === 'deleteContentBackward') return;
        
        let val = input.value.replace(/\D/g, ''); // Remove non-numeric
        
        if (val.length > 8) val = val.substring(0, 8);

        let dd = val.substring(0, 2);
        let mm = val.substring(2, 4);
        let yyyy = val.substring(4, 8);

        // Real-time Day Validation
        if (dd.length === 2) {
            let dNum = parseInt(dd, 10);
            if (dNum < 1) dd = '01';
            if (dNum > 31) dd = '31';
        } else if (dd.length === 1 && parseInt(dd, 10) > 3) {
            dd = '0' + dd;
        }

        // Real-time Month Validation
        if (mm.length === 2) {
            let mNum = parseInt(mm, 10);
            if (mNum < 1) mm = '01';
            if (mNum > 12) mm = '12';
        } else if (mm.length === 1 && parseInt(mm, 10) > 1) {
            mm = '0' + mm;
        }

        // Reconstruct formatted string
        let formatted = dd;
        if (val.length === 2) {
            formatted += '/';
        } else if (val.length > 2) {
            formatted += '/' + mm;
        }
        
        if (val.length === 4) {
            formatted += '/';
        } else if (val.length > 4) {
            formatted += '/' + yyyy;
        }

        input.value = formatted;
    }

    dobInput.addEventListener('input', applyDateMask);
    targetDateInput.addEventListener('input', applyDateMask);

    calcBtn.addEventListener('click', calculateAge);

    // Allow Enter key to trigger calculation
    [dobInput, targetDateInput].forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') calculateAge();
        });
    });

    function showError(message) {
        errorMsg.textContent = message;
        resultsSection.classList.add('hidden');
        
        // Shake animation for error
        const card = document.querySelector('.calculator-card');
        card.style.animation = 'none';
        card.offsetHeight; // trigger reflow
        card.style.animation = 'shake 0.5s ease-in-out';
    }

    // Strict parse for DD/MM/YYYY
    function parseDDMMYYYY(dateStr) {
        if (!dateStr || dateStr.length !== 10) return null;
        let parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        
        let d = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10);
        let y = parseInt(parts[2], 10);
        
        if (y < 1000) return null; // Enforce valid year
        
        let date = new Date(y, m - 1, d);
        // Ensure JavaScript didn't auto-wrap invalid days (like 31/02/2020 -> March)
        if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
            return null;
        }
        return date;
    }

    function calculateAge() {
        errorMsg.textContent = '';
        
        const dobStr = dobInput.value;
        const targetStr = targetDateInput.value;

        if (!dobStr || !targetStr) {
            return showError('Please enter both dates.');
        }

        let birthDate = parseDDMMYYYY(dobStr);
        let targetDate = parseDDMMYYYY(targetStr);

        if (!birthDate || isNaN(birthDate.getTime())) {
            return showError('Invalid Date of Birth format. Please enter a valid DD/MM/YYYY date.');
        }
        if (!targetDate || isNaN(targetDate.getTime())) {
            return showError('Invalid Target Date format. Please enter a valid DD/MM/YYYY date.');
        }

        if (birthDate > targetDate) {
            return showError('Date of Birth must be before or equal to the Till Date.');
        }

        // Calculate Exact Age
        let years = targetDate.getFullYear() - birthDate.getFullYear();
        let months = targetDate.getMonth() - birthDate.getMonth();
        let days = targetDate.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            const previousMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
            days += previousMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        // Calculate Extra Stats
        // Convert dates to UTC to avoid daylight saving time jumps affecting day differences
        const utc1 = Date.UTC(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const utc2 = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        
        const diffTime = Math.abs(utc2 - utc1);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // Detailed Fractional logic
        const diffWeeksDec = diffDays / 7;
        const totalMonthsDec = diffDays / 30.436875;
        
        const diffHours = diffDays * 24;
        const diffMinutes = diffHours * 60;
        const diffSeconds = diffMinutes * 60;

        // Calculate Next Birthday (relative to target date)
        let nextBirthday = new Date(targetDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        // If next birthday has passed this year, it's next year
        if (nextBirthday < targetDate && (nextBirthday.getMonth() !== targetDate.getMonth() || nextBirthday.getDate() !== targetDate.getDate())) {
            nextBirthday.setFullYear(targetDate.getFullYear() + 1);
        }

        let daysToNextBd;
        if (targetDate.getMonth() === birthDate.getMonth() && targetDate.getDate() === birthDate.getDate()) {
            statNextBirthday.innerHTML = `<span style="color:var(--accent-color)">Today! 🥳</span>`;
        } else {
            const nextBdUtc = Date.UTC(nextBirthday.getFullYear(), nextBirthday.getMonth(), nextBirthday.getDate());
            daysToNextBd = Math.ceil((nextBdUtc - utc2) / (1000 * 60 * 60 * 24));
            statNextBirthday.textContent = `${daysToNextBd.toLocaleString()} Days`;
        }

        // Update UI Text
        // For fractional outputs, format up to 2 decimal places with commas
        const numFormat = new Intl.NumberFormat('en-US');
        const decFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

        statMonths.textContent = decFormat.format(totalMonthsDec);
        statWeeks.textContent = decFormat.format(diffWeeksDec);
        statDays.textContent = numFormat.format(diffDays);
        statHours.textContent = numFormat.format(diffHours);
        statMinutes.textContent = numFormat.format(diffMinutes);
        statSeconds.textContent = numFormat.format(diffSeconds);

        // Reveal section
        resultsSection.classList.remove('hidden');

        // Scroll so the entire results section is fully visible on screen.
        // By aligning the bottom of the results to the bottom of the screen (with a small margin),
        // we guarantee the full answer is shown without getting cut off.
        setTimeout(() => {
            if (resultsSection) {
                const rect = resultsSection.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // Calculate the absolute bottom position of the results section
                const resultsBottom = scrollTop + rect.bottom;
                
                // Scroll so the bottom of the results is exactly 40px from the bottom of the viewport
                const targetY = resultsBottom - window.innerHeight + 40;
                
                window.scrollTo({
                    top: targetY,
                    behavior: 'smooth'
                });
            }
        }, 50);

        // Animate numbers
        animateValue(resYears, 0, years, 1000);
        animateValue(resMonths, 0, months, 1000);
        animateValue(resDays, 0, days, 1000);
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // easeOutQuart
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            obj.innerHTML = Math.floor(easeProgress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end;
            }
        };
        window.requestAnimationFrame(step);
    }
});
