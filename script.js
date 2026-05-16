// Theme Handling Removed for Permanent Light Mode

const PROFILE_CONFIG = {
    github: "nirmalya-ghosh",
    leetcode: "nirmalya2127",
    analyticsEndpoint: ""
};

const PERF_CONFIG = {
    isCoarsePointer: window.matchMedia('(pointer: coarse)').matches,
    isSmallScreen: window.matchMedia('(max-width: 900px)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    lowMemory: navigator.deviceMemory && navigator.deviceMemory <= 4
};

const allowEnhancedMotion = () =>
    !PERF_CONFIG.reducedMotion && !PERF_CONFIG.isCoarsePointer && !PERF_CONFIG.isSmallScreen && !PERF_CONFIG.lowMemory;

const splitTextToSpans = () => {
    // Kept as a safe hook for the existing GSAP setup.
};

const animateCount = (element, target, options = {}) => {
    if (!element || !Number.isFinite(target)) return;
    const suffix = options.suffix || '';
    const decimals = options.decimals || 0;
    const counter = { value: 0 };

    gsap.to(counter, {
        value: target,
        duration: options.duration || 1.3,
        ease: 'power2.out',
        onUpdate: () => {
            element.textContent = `${counter.value.toFixed(decimals)}${suffix}`;
        }
    });
};

const initTilt = () => {
    if (typeof VanillaTilt === 'undefined') return;
    if (!allowEnhancedMotion()) return;

    VanillaTilt.init(document.querySelectorAll('.hero-img, .project-card[data-tilt]'), {
        max: 6,
        speed: 420,
        glare: false,
        scale: 1.01
    });
};

const initPreloader = () => {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    const progressBar = document.getElementById('loader-progress-bar');
    const percentElement = document.getElementById('loader-percent');
    const statusElement = document.getElementById('loader-status');
    const statusSteps = [
        { at: 18, text: 'Loading profile' },
        { at: 42, text: 'Preparing projects' },
        { at: 66, text: 'Syncing activity' },
        { at: 84, text: 'Optimizing interface' },
        { at: 100, text: 'Ready' }
    ];
    let progress = 0;
    let stepIndex = 0;

    const setProgress = (value) => {
        progress = Math.min(100, Math.max(progress, value));
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (percentElement) percentElement.textContent = `${String(Math.round(progress)).padStart(2, '0')}%`;

        while (statusSteps[stepIndex] && progress >= statusSteps[stepIndex].at) {
            if (statusElement) statusElement.textContent = statusSteps[stepIndex].text;
            stepIndex += 1;
        }
    };

    const progressTimer = window.setInterval(() => {
        const remaining = 96 - progress;
        const increment = Math.max(0.35, remaining * 0.09);
        setProgress(progress + increment);
    }, 95);

    const hidePreloader = () => {
        window.setTimeout(() => {
            window.clearInterval(progressTimer);
            setProgress(100);
            preloader.classList.add('is-hidden');
            window.setTimeout(() => preloader.remove(), 850);
        }, 1250);
    };

    setProgress(4);

    if (document.readyState === 'complete') {
        hidePreloader();
    } else {
        window.addEventListener('load', hidePreloader, { once: true });
    }
};

const initActiveNav = () => {
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    const sections = Array.from(navLinks)
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    if (!sections.length) return;

    let ticking = false;
    const updateActiveLink = () => {
        const current = sections.reduce((active, section) => {
            const rect = section.getBoundingClientRect();
            return rect.top <= 160 ? section : active;
        }, sections[0]);

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
        });
    };
    const requestUpdate = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            updateActiveLink();
            ticking = false;
        });
    };

    updateActiveLink();
    window.addEventListener('scroll', requestUpdate, { passive: true });
};

const initDigitalClock = () => {
    const dayElement = document.getElementById('clock-day');
    const timeElement = document.getElementById('clock-time');
    if (!dayElement || !timeElement) return;

    const formatter = new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata'
    });

    const dayFormatter = new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        timeZone: 'Asia/Kolkata'
    });

    const updateClock = () => {
        const now = new Date();
        dayElement.textContent = dayFormatter.format(now).toUpperCase();
        timeElement.textContent = formatter.format(now);
    };

    updateClock();
    window.setInterval(updateClock, 1000);
};

const createTypewriter = (selector, phrases, options = {}) => {
    const element = document.querySelector(selector);
    if (!element || !phrases.length) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
        element.textContent = phrases[0];
        return;
    }

    const typingSpeed = options.typingSpeed || 52;
    const deletingSpeed = options.deletingSpeed || 28;
    const holdDelay = options.holdDelay || 1500;
    const nextDelay = options.nextDelay || 320;
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const tick = () => {
        const phrase = phrases[phraseIndex];

        if (isDeleting) {
            charIndex -= 1;
        } else {
            charIndex += 1;
        }

        element.textContent = phrase.slice(0, charIndex);

        if (!isDeleting && charIndex === phrase.length) {
            isDeleting = true;
            window.setTimeout(tick, holdDelay);
            return;
        }

        if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            window.setTimeout(tick, nextDelay);
            return;
        }

        const cadence = isDeleting ? deletingSpeed : typingSpeed + Math.round(Math.random() * 24);
        window.setTimeout(tick, cadence);
    };

    element.textContent = '';
    window.setTimeout(tick, options.startDelay || 250);
};

const initTypewriters = () => {
    createTypewriter('#hero-typewriter-text', [
        'AI/ML-powered applications.',
        'intelligent systems from data.',
        'machine learning experiments.',
        'DSA-backed engineering solutions.',
        'secure AI-ready products.'
    ], {
        startDelay: 500,
        holdDelay: 1600
    });

    createTypewriter('#about-typewriter-text', [
        'I am a B.Tech student focused on AI/ML, strong DSA, intelligent applications, and practical software engineering.',
        'I build toward machine learning, data-driven systems, automation, scalable code, and secure product thinking.',
        'I am strengthening Python, Java, data structures, algorithms, web technologies, and cybersecurity fundamentals.'
    ], {
        startDelay: 850,
        typingSpeed: 34,
        deletingSpeed: 18,
        holdDelay: 2200
    });

    createTypewriter('#contact-typewriter-text', [
        'ready to join for internships in AI/ML, software engineering, and intelligent products.',
        'open to big-tech-level learning, DSA-heavy engineering, and research-driven AI/ML builds.',
        'available for internships, collaborations, and cybersecurity-aware product work.'
    ], {
        startDelay: 900,
        typingSpeed: 38,
        deletingSpeed: 20,
        holdDelay: 1900
    });
};

const getDateKey = (date) => date.toISOString().slice(0, 10);

const getLastYearDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(today.getDate() - 364);

    const days = [];
    for (let date = new Date(start); date <= today; date.setDate(date.getDate() + 1)) {
        days.push(new Date(date));
    }

    return days;
};

const getLevelFromCount = (count, maxCount) => {
    if (!count) return 0;
    if (maxCount <= 4) return Math.min(4, count);
    if (count >= maxCount * 0.75) return 4;
    if (count >= maxCount * 0.5) return 3;
    if (count >= maxCount * 0.25) return 2;
    return 1;
};

const formatShortDate = (date) => date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
});

const renderHeatmapMonths = (container, days) => {
    if (!container || !days.length) return;

    const leadingBlanks = days[0].getDay();
    const totalColumns = Math.ceil((days.length + leadingBlanks) / 7);
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${totalColumns}, var(--heatmap-cell))`;

    let previousMonth = '';
    days.forEach((day, index) => {
        const month = day.toLocaleDateString('en-US', { month: 'short' });
        if (month === previousMonth) return;

        previousMonth = month;
        const label = document.createElement('span');
        label.textContent = month;
        label.style.gridColumn = `${Math.floor((index + leadingBlanks) / 7) + 1} / span 3`;
        label.style.gridRow = '1';
        container.appendChild(label);
    });
};

const getActivityInsights = (days, getCount) => {
    let activeDays = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let runningStreak = 0;
    let bestCount = 0;
    let bestDate = null;

    days.forEach(day => {
        const count = getCount(day);
        if (count > 0) {
            activeDays += 1;
            runningStreak += 1;
            if (runningStreak > longestStreak) longestStreak = runningStreak;
            if (count > bestCount) {
                bestCount = count;
                bestDate = day;
            }
        } else {
            runningStreak = 0;
        }
    });

    for (let i = days.length - 1; i >= 0; i--) {
        if (getCount(days[i]) <= 0) break;
        currentStreak += 1;
    }

    return { activeDays, currentStreak, longestStreak, bestCount, bestDate };
};

const updateText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
};

const sumCounts = (days, getCount) => {
    return days.reduce((sum, day) => sum + getCount(day), 0);
};

const formatNumber = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    return number.toLocaleString('en-US');
};

const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
};

const getDeviceType = () => {
    const width = window.innerWidth;
    const agent = navigator.userAgent.toLowerCase();
    if (/tablet|ipad/.test(agent)) return 'Tablet';
    if (/mobi|android|iphone/.test(agent) || width < 700) return 'Mobile';
    return 'Desktop';
};

const getBrowserName = () => {
    const agent = navigator.userAgent;
    if (agent.includes('Edg/')) return 'Edge';
    if (agent.includes('Chrome/')) return 'Chrome';
    if (agent.includes('Firefox/')) return 'Firefox';
    if (agent.includes('Safari/') && !agent.includes('Chrome/')) return 'Safari';
    return 'Browser';
};

const getFlagEmoji = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    return countryCode
        .toUpperCase()
        .split('')
        .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
        .join('');
};

const renderCountryTraffic = (countries = []) => {
    const lists = [
        document.getElementById('country-traffic-list'),
        document.getElementById('metrics-country-list')
    ].filter(Boolean);
    if (!lists.length) return;

    const normalized = countries
        .filter(country => country && country.country)
        .map(country => ({
            country: country.country,
            code: country.code || country.countryCode || '',
            visitors: Number(country.visitors) || 0
        }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 5);

    const maxVisitors = Math.max(1, ...normalized.map(country => country.visitors));

    const markup = normalized.map(country => {
        const width = Math.max(6, Math.round((country.visitors / maxVisitors) * 100));
        return `<span><b>${getFlagEmoji(country.code)} ${country.country}</b><i style="--bar: ${width}%"></i><em>${formatNumber(country.visitors)}</em></span>`;
    }).join('') || '<span><b>Unknown</b><i style="--bar: 0%"></i><em>--</em></span>';

    lists.forEach(list => {
        list.innerHTML = markup;
    });
};

const renderVisitorGraph = (values) => {
    const line = document.getElementById('visitor-graph-line');
    const area = document.getElementById('visitor-graph-area');
    if (!line || !area || !values.length) return;

    const width = 320;
    const height = 120;
    const padding = 12;
    const max = Math.max(1, ...values);
    const points = values.map((value, index) => {
        const x = values.length === 1 ? padding : padding + (index / (values.length - 1)) * (width - padding * 2);
        const y = height - padding - (value / max) * (height - padding * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    line.setAttribute('points', points.join(' '));
    area.setAttribute('d', `M ${points[0]} L ${points.slice(1).join(' L ')} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`);
};

const getStrongestDifficulty = (data) => {
    const solved = [
        { label: 'Easy', solved: Number(data.easySolved) || 0, total: Number(data.totalEasy) || 0 },
        { label: 'Medium', solved: Number(data.mediumSolved) || 0, total: Number(data.totalMedium) || 0 },
        { label: 'Hard', solved: Number(data.hardSolved) || 0, total: Number(data.totalHard) || 0 }
    ];

    return solved
        .map(item => ({
            ...item,
            percent: item.total ? item.solved / item.total : 0
        }))
        .sort((a, b) => b.percent - a.percent)[0];
};

const updateLeetCodeOverview = (data) => {
    const solved = Number(data.totalSolved) || 0;
    const totalQuestions = Number(data.totalQuestions) || 0;
    const completion = totalQuestions ? Math.min(100, (solved / totalQuestions) * 100) : 0;
    const easySolved = Number(data.easySolved) || 0;
    const mediumSolved = Number(data.mediumSolved) || 0;
    const hardSolved = Number(data.hardSolved) || 0;
    const strongest = getStrongestDifficulty(data);
    const ring = document.querySelector('.leetcode-progress-ring');

    updateText('leetcode-total', formatNumber(solved));
    updateText('leetcode-total-questions', formatNumber(totalQuestions));
    updateText('leetcode-easy', formatNumber(easySolved));
    updateText('leetcode-medium', formatNumber(mediumSolved));
    updateText('leetcode-hard', formatNumber(hardSolved));
    updateText('leetcode-coverage', `${completion.toFixed(1)}%`);
    updateText('leetcode-rank', formatNumber(data.ranking));
    updateText('leetcode-strongest', strongest ? strongest.label : '--');
    updateText('leetcode-difficulty-mix', `${formatNumber(easySolved)}/${formatNumber(mediumSolved)}/${formatNumber(hardSolved)}`);

    if (ring) {
        const degreesPerProblem = totalQuestions ? 360 / totalQuestions : 0;
        ring.style.setProperty('--easy-deg', `${easySolved * degreesPerProblem}deg`);
        ring.style.setProperty('--medium-deg', `${mediumSolved * degreesPerProblem}deg`);
        ring.style.setProperty('--hard-deg', `${hardSolved * degreesPerProblem}deg`);
        ring.setAttribute('aria-label', `${formatNumber(solved)} solved out of ${formatNumber(totalQuestions)} LeetCode problems`);
        ring.title = `${completion.toFixed(1)}% complete: ${formatNumber(easySolved)} easy, ${formatNumber(mediumSolved)} medium, ${formatNumber(hardSolved)} hard`;
    }

    animateCount(document.getElementById('leetcode-total'), solved);
    animateCount(document.getElementById('leetcode-easy'), easySolved);
    animateCount(document.getElementById('leetcode-medium'), mediumSolved);
    animateCount(document.getElementById('leetcode-hard'), hardSolved);
};

const renderHeatmap = (container, days, getDayData, options = {}) => {
    if (!container) return;

    container.classList.remove('is-loading', 'is-error');
    container.innerHTML = '';
    const leadingBlanks = days[0].getDay();
    const totalColumns = Math.ceil((days.length + leadingBlanks) / 7);
    container.style.gridTemplateColumns = `repeat(${totalColumns}, var(--heatmap-cell))`;

    renderHeatmapMonths(options.monthsContainer, days);
    if (options.monthsContainer && !container.dataset.monthSyncReady) {
        container.dataset.monthSyncReady = 'true';
        container.addEventListener('scroll', () => {
            options.monthsContainer.scrollLeft = container.scrollLeft;
        }, { passive: true });
    }

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < leadingBlanks; i++) {
        const blank = document.createElement('span');
        blank.className = 'heatmap-day heatmap-day-blank';
        blank.setAttribute('aria-hidden', 'true');
        blank.style.visibility = 'hidden';
        fragment.appendChild(blank);
    }

    days.forEach((day, index) => {
        const { count, level } = getDayData(day);
        const square = document.createElement('span');
        square.className = 'heatmap-day';
        square.dataset.level = level;
        square.style.setProperty('--heatmap-index', index);
        square.tabIndex = 0;
        square.title = `${count} ${options.unit || 'activities'} on ${day.toLocaleDateString()}`;
        square.setAttribute('aria-label', square.title);
        square.addEventListener('mouseenter', () => {
            if (options.focusElement) {
                options.focusElement.textContent = `${formatShortDate(day)}: ${count} ${options.unit || 'activities'}`;
            }
        });
        square.addEventListener('focus', () => {
            if (options.focusElement) {
                options.focusElement.textContent = `${formatShortDate(day)}: ${count} ${options.unit || 'activities'}`;
            }
        });
        fragment.appendChild(square);
    });

    container.appendChild(fragment);
};

const setHeatmapError = (container) => {
    if (!container) return;
    container.innerHTML = '';
    container.classList.remove('is-loading');
    container.classList.add('is-error');
};

const initGitHubHeatmap = async () => {
    const container = document.getElementById('github-heatmap');
    const monthsContainer = document.getElementById('github-months');
    const focusElement = document.getElementById('github-focus');
    const totalElement = document.getElementById('github-total');
    if (!container) return;

    try {
        const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${PROFILE_CONFIG.github}?y=last`);
        if (!response.ok) throw new Error('GitHub contribution request failed');

        const data = await response.json();
        const contributionMap = new Map(
            (data.contributions || []).map(day => [day.date, {
                count: Number(day.count) || 0,
                level: Number(day.level) || 0
            }])
        );

        if (totalElement) {
            totalElement.textContent = data.total?.lastYear ?? '0';
            animateCount(totalElement, Number(data.total?.lastYear) || 0);
        }

        const days = getLastYearDays();
        const getGitHubDay = day => {
            return contributionMap.get(getDateKey(day)) || { count: 0, level: 0 };
        };
        const insights = getActivityInsights(days, day => getGitHubDay(day).count);

        updateText('github-active-days', insights.activeDays);
        updateText('github-current-streak', insights.currentStreak);
        updateText('github-density', `${Math.round((insights.activeDays / days.length) * 100)}%`);
        updateText('github-average', insights.activeDays ? (sumCounts(days, day => getGitHubDay(day).count) / insights.activeDays).toFixed(1) : '0');
        updateText('github-longest-streak', insights.longestStreak);
        updateText('github-best-day', insights.bestDate ? `${insights.bestCount} on ${formatShortDate(insights.bestDate)}` : '0');
        updateText('github-last-30', formatNumber(sumCounts(days.slice(-30), day => getGitHubDay(day).count)));
        animateCount(document.getElementById('github-active-days'), insights.activeDays);
        animateCount(document.getElementById('github-current-streak'), insights.currentStreak);
        if (focusElement) {
            focusElement.textContent = `Longest streak: ${insights.longestStreak} days. Hover a square for daily GitHub activity.`;
        }

        renderHeatmap(container, days, getGitHubDay, {
            monthsContainer,
            focusElement,
            unit: 'contributions'
        });
    } catch (error) {
        setHeatmapError(container);
    }
};

const initLeetCodeHeatmap = async () => {
    const container = document.getElementById('leetcode-heatmap');
    const monthsContainer = document.getElementById('leetcode-months');
    const focusElement = document.getElementById('leetcode-focus');
    if (!container) return;

    try {
        const response = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${PROFILE_CONFIG.leetcode}`);
        if (!response.ok) throw new Error('LeetCode activity request failed');

        const data = await response.json();
        const calendar = data.submissionCalendar || {};
        const calendarByDate = new Map(
            Object.entries(calendar).map(([timestamp, count]) => {
                const date = new Date(Number(timestamp) * 1000);
                return [getDateKey(date), Number(count) || 0];
            })
        );
        const maxCount = Math.max(0, ...calendarByDate.values());

        updateLeetCodeOverview(data);

        const days = getLastYearDays();
        const getLeetCodeDay = day => {
            const count = calendarByDate.get(getDateKey(day)) || 0;
            return { count, level: getLevelFromCount(count, maxCount) };
        };
        const insights = getActivityInsights(days, day => getLeetCodeDay(day).count);

        updateText('leetcode-active-days', insights.activeDays);
        updateText('leetcode-current-streak', insights.currentStreak);
        if (focusElement) {
            focusElement.textContent = `Longest streak: ${insights.longestStreak} days. Hover a square for daily LeetCode submissions.`;
        }

        renderHeatmap(container, days, getLeetCodeDay, {
            monthsContainer,
            focusElement,
            unit: 'submissions'
        });
    } catch (error) {
        setHeatmapError(container);
    }
};

const initCodingHeatmaps = () => {
    initGitHubHeatmap();
    initLeetCodeHeatmap();
};

const initVisitorAnalytics = async () => {
    const sessionStart = Date.now();
    const visitorSeries = Array.from({ length: 18 }, () => 0);
    const totalKey = 'portfolioTotalVisits';
    const storedVisits = Number(localStorage.getItem(totalKey)) || 0;
    const totalVisits = storedVisits + 1;
    localStorage.setItem(totalKey, String(totalVisits));

    updateText('metric-active-visitors', '1');
    updateText('metric-total-visitors', formatNumber(totalVisits));
    const deviceType = getDeviceType();
    updateText('metric-device-type', deviceType);
    updateText('metric-browser', getBrowserName());
    updateText('metric-viewport', `${window.innerWidth} x ${window.innerHeight}`);
    updateText('metric-timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local');
    updateText('metric-session-summary', 'Session started just now');
    updateText('metric-environment-summary', `${deviceType} on ${getBrowserName()}`);
    renderCountryTraffic([{ country: 'This device', visitors: totalVisits }]);
    renderVisitorGraph(visitorSeries);

    const tickSessionDuration = () => {
        const elapsedSeconds = Math.floor((Date.now() - sessionStart) / 1000);
        const duration = formatDuration(elapsedSeconds);
        updateText('metric-session-duration', duration);
        updateText('metric-session-summary', `${duration} active, ${formatNumber(totalVisits)} local visits`);
        visitorSeries.push(1 + Math.round(Math.abs(Math.sin(elapsedSeconds / 7)) * 2));
        visitorSeries.shift();
        renderVisitorGraph(visitorSeries);
    };
    tickSessionDuration();
    setInterval(tickSessionDuration, 1000);

    try {
        const geoResponse = await fetch('https://ipapi.co/json/');
        if (geoResponse.ok) {
            const geo = await geoResponse.json();
            if (!PROFILE_CONFIG.analyticsEndpoint) {
                renderCountryTraffic([{
                    country: geo.country_name || 'Current country',
                    code: geo.country_code,
                    visitors: totalVisits
                }]);
                updateText('metric-source', 'Local session');
                updateText('metric-visitor-source', geo.country_name || 'Local session');
            }
        }
    } catch (error) {
        // Keep local analytics if geo lookup is blocked.
    }

    if (!PROFILE_CONFIG.analyticsEndpoint) return;

    try {
        const response = await fetch(PROFILE_CONFIG.analyticsEndpoint);
        if (!response.ok) throw new Error('Analytics endpoint failed');
        const data = await response.json();

        updateText('metric-active-visitors', formatNumber(data.activeVisitors));
        updateText('metric-total-visitors', formatNumber(data.totalVisitors));
        if (data.averageSessionDuration) {
            updateText('metric-session-duration', data.averageSessionDuration);
        }
        if (data.deviceTypes?.top) {
            updateText('metric-device-type', data.deviceTypes.top);
        }
        if (Array.isArray(data.countries)) {
            renderCountryTraffic(data.countries);
        }
        if (Array.isArray(data.visitorSeries)) {
            renderVisitorGraph(data.visitorSeries.map(value => Number(value) || 0));
            updateText('metric-graph-caption', 'Live feed');
        }

        updateText('metric-source', 'Live feed');
        updateText('metric-visitor-source', 'Live feed');
    } catch (error) {
        updateText('metric-source', 'Local session');
        updateText('metric-visitor-source', 'Local session');
    }
};

const initMetricsModal = () => {
    const modal = document.getElementById('metrics-modal');
    const openButton = document.getElementById('live-metrics-button');
    const closeButton = modal?.querySelector('.metrics-close');
    if (!modal || !openButton || !closeButton) return;

    const setOpen = (isOpen) => {
        modal.classList.toggle('active', isOpen);
        modal.setAttribute('aria-hidden', String(!isOpen));
        openButton.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('modal-open', isOpen);
        if (isOpen) closeButton.focus();
    };

    openButton.addEventListener('click', () => setOpen(true));
    closeButton.addEventListener('click', () => setOpen(false));
    modal.addEventListener('click', (event) => {
        if (event.target === modal) setOpen(false);
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('active')) {
            setOpen(false);
            openButton.focus();
        }
    });
    window.addEventListener('resize', () => {
        updateText('metric-viewport', `${window.innerWidth} x ${window.innerHeight}`);
        const deviceType = getDeviceType();
        updateText('metric-device-type', deviceType);
    }, { passive: true });
};

const initDocumentGate = () => {
    const links = document.querySelectorAll('.protected-document-link');
    const modal = document.getElementById('document-gate-modal');
    const form = document.getElementById('document-gate-form');
    const closeButton = modal?.querySelector('.document-gate-close');
    const turnstileElement = document.getElementById('turnstile-widget');
    const copyElement = document.getElementById('document-gate-copy');
    const errorElement = document.getElementById('document-gate-error');
    const submitButton = form?.querySelector('button[type="submit"]');
    const emailCard = document.getElementById('document-email-card');
    const companyEmailInput = document.getElementById('document-company-email');
    const otpInput = document.getElementById('document-otp');
    const sendOtpButton = document.getElementById('document-send-otp');
    const otpStatus = document.getElementById('document-otp-status');

    if (!links.length || !modal || !form || !closeButton || !turnstileElement || !submitButton) return;
    const submitButtonOriginalHtml = submitButton.innerHTML;

    let activeDocumentId = '';
    let activeLabel = 'document';
    let turnstileWidgetId = null;
    let turnstileToken = '';
    let otpRequestId = '';
    let verifiedOtpEmail = '';

    const setError = (message = '') => {
        if (errorElement) errorElement.textContent = message;
    };

    const setOtpStatus = (message = '') => {
        if (otpStatus) otpStatus.textContent = message;
    };

    const getAccessEmail = () => String(companyEmailInput?.value || '').trim().toLowerCase();

    const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const resetOtp = () => {
        otpRequestId = '';
        verifiedOtpEmail = '';
        if (otpInput) otpInput.value = '';
        setOtpStatus('');
    };

    const renderTurnstile = () => {
        if (!window.turnstile) {
            setError('Verification is still loading. Please try again in a moment.');
            return;
        }

        const sitekey = turnstileElement.dataset.sitekey;
        if (!sitekey || sitekey === 'YOUR_TURNSTILE_SITE_KEY') {
            setError('Turnstile site key is not configured yet.');
            return;
        }

        if (turnstileWidgetId !== null) {
            window.turnstile.reset(turnstileWidgetId);
            turnstileToken = '';
            return;
        }

        turnstileWidgetId = window.turnstile.render(turnstileElement, {
            sitekey,
            size: 'flexible',
            theme: 'dark',
            callback: token => {
                turnstileToken = token;
                setError('');
            },
            'expired-callback': () => {
                turnstileToken = '';
                setError('Verification expired. Please complete it again.');
            },
            'error-callback': () => {
                turnstileToken = '';
                setError('Verification could not load. Refresh and try again.');
            }
        });
    };

    const setOpen = (isOpen) => {
        modal.classList.toggle('active', isOpen);
        modal.setAttribute('aria-hidden', String(!isOpen));
        document.body.classList.toggle('modal-open', isOpen);

        if (isOpen) {
            setError('');
            resetOtp();
            if (companyEmailInput) companyEmailInput.value = '';
            if (emailCard) emailCard.hidden = activeDocumentId !== 'resume';
            submitButton.disabled = false;
            submitButton.innerHTML = submitButtonOriginalHtml;
            window.setTimeout(renderTurnstile, 80);
        } else if (window.turnstile && turnstileWidgetId !== null) {
            window.turnstile.reset(turnstileWidgetId);
            turnstileToken = '';
            resetOtp();
        }
    };

    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            activeDocumentId = link.dataset.documentId || '';
            activeLabel = link.dataset.documentLabel || 'document';
            if (copyElement) {
                copyElement.textContent = activeDocumentId === 'resume'
                    ? 'Verify your email with OTP. After approval, the resume link will be emailed to you.'
                    : `Complete the verification to open ${activeLabel}.`;
            }
            setOpen(true);
        });
    });

    sendOtpButton?.addEventListener('click', async () => {
        const email = getAccessEmail();

        if (!isValidEmail(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        sendOtpButton.disabled = true;
        setError('');
        setOtpStatus('Sending OTP...');

        try {
            const response = await fetch('/api/request-document-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    documentId: activeDocumentId
                })
            });
            const result = await response.json();

            if (!response.ok || !result?.requestId) {
                throw new Error(result?.error || 'OTP could not be sent.');
            }

            otpRequestId = result.requestId;
            verifiedOtpEmail = email;
            setOtpStatus('OTP sent. Check your inbox.');
            otpInput?.focus();
        } catch (error) {
            resetOtp();
            setError(error.message || 'OTP could not be sent.');
        } finally {
            sendOtpButton.disabled = false;
        }
    });

    companyEmailInput?.addEventListener('input', () => {
        if (getAccessEmail() !== verifiedOtpEmail) resetOtp();
    });

    closeButton.addEventListener('click', () => setOpen(false));

    modal.addEventListener('click', event => {
        if (event.target === modal) setOpen(false);
    });

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal.classList.contains('active')) setOpen(false);
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();

        const honeypot = form.querySelector('.document-honeypot');
        if (honeypot?.value) return;

        if (!turnstileToken) {
            setError('Please complete the Cloudflare verification first.');
            return;
        }

        const accessEmail = getAccessEmail();
        const otp = String(otpInput?.value || '').trim();
        if (activeDocumentId === 'resume') {
            if (!isValidEmail(accessEmail)) {
                setError('Please enter a valid email address.');
                return;
            }

            if (!otpRequestId || accessEmail !== verifiedOtpEmail || !/^\d{6}$/.test(otp)) {
                setError('Please request the OTP and enter the 6-digit code.');
                return;
            }
        }

        submitButton.disabled = true;
        submitButton.classList.add('is-loading');
        setError('Verifying...');
        let requestCompleted = false;

        try {
            const response = await fetch('/api/verify-turnstile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: turnstileToken,
                    documentId: activeDocumentId,
                    email: accessEmail,
                    otp,
                    requestId: otpRequestId
                })
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error || 'Verification failed. Please try again.');
            }

            if (result?.url) {
                setOpen(false);
                window.open(result.url, '_blank', 'noopener,noreferrer');
                return;
            }

            if (result?.pendingApproval) {
                requestCompleted = true;
                setError('');
                setOtpStatus(result.message || 'Request sent. You will receive the resume link after approval.');
                submitButton.disabled = true;
                submitButton.innerHTML = 'Request Sent <i class="fas fa-check"></i>';
            }
        } catch (error) {
            setError(error.message || 'Verification failed. Please try again.');
            if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
            turnstileToken = '';
        } finally {
            if (!requestCompleted) submitButton.disabled = false;
            submitButton.classList.remove('is-loading');
        }
    });
};

// Custom Cursor Logic
const initCursor = () => {
    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');

    // Only init on desktop
    if (window.innerWidth < 900 || !cursorDot || !cursorOutline) return;

    // Center the transforms first
    gsap.set(cursorDot, { xPercent: -50, yPercent: -50, left: 0, top: 0 });
    gsap.set(cursorOutline, { xPercent: -50, yPercent: -50, left: 0, top: 0 });

    // Performance-optimized cursor movement
    const xToDot = gsap.quickTo(cursorDot, "x", { duration: 0.1, ease: "power3" });
    const yToDot = gsap.quickTo(cursorDot, "y", { duration: 0.1, ease: "power3" });

    const xToOutline = gsap.quickTo(cursorOutline, "x", { duration: 0.5, ease: "power3" });
    const yToOutline = gsap.quickTo(cursorOutline, "y", { duration: 0.5, ease: "power3" });

    window.addEventListener('mousemove', (e) => {
        xToDot(e.clientX);
        yToDot(e.clientY);
        xToOutline(e.clientX);
        yToOutline(e.clientY);
    });

    // Hover effects
    const interactiveElements = document.querySelectorAll('a, button, .cta-button, .view-project, .contact-box');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            gsap.to(cursorOutline, {
                scale: 1.5,
                backgroundColor: 'rgba(255, 87, 34, 0.1)',
                duration: 0.3
            });
            gsap.to(cursorDot, {
                scale: 0.5,
                duration: 0.3
            });
        });

        el.addEventListener('mouseleave', () => {
            gsap.to(cursorOutline, {
                scale: 1,
                backgroundColor: 'transparent',
                duration: 0.3
            });
            gsap.to(cursorDot, {
                scale: 1,
                duration: 0.3
            });
        });
    });
};

// Scroll Progress (GSAP Optimized)
const initScrollProgress = () => {
    const progress = document.getElementById('scroll-progress');
    if (!progress) return;

    let ticking = false;
    const update = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        progress.style.transform = `scaleX(${Math.min(1, scrollTop / maxScroll)})`;
        ticking = false;
    };

    progress.style.transformOrigin = 'left center';
    progress.style.width = '100%';
    progress.style.transform = 'scaleX(0)';
    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });
    update();
};

const initProfileIconBounce = () => {
    if (PERF_CONFIG.reducedMotion) return;

    const wrapper = document.querySelector('.hero-image-wrapper');
    const portrait = document.querySelector('.hero-portrait-shell');
    const icons = Array.from(document.querySelectorAll('.hero-image-wrapper .orbit-icon'));
    if (!wrapper || !portrait || !icons.length) return;

    const states = icons.map((icon, index) => {
        icon.classList.add('profile-bounce-icon');
        icon.style.setProperty('--bounce-x', '0px');
        icon.style.setProperty('--bounce-y', '0px');

        const directionX = icon.classList.contains('orbit-1') || icon.classList.contains('orbit-2') ? -1 : 1;
        const directionY = icon.classList.contains('orbit-2') || icon.classList.contains('orbit-3') ? -1 : 1;
        const speed = 12 + index * 2.4;

        return {
            icon,
            x: 0,
            y: 0,
            vx: directionX * speed,
            vy: directionY * speed * 0.72,
            width: 0,
            height: 0,
            baseLeft: 0,
            baseTop: 0
        };
    });

    let bounds = null;
    let isVisible = true;
    let lastTime = performance.now();

    const measure = () => {
        const wrapperRect = wrapper.getBoundingClientRect();
        const portraitRect = portrait.getBoundingClientRect();

        bounds = {
            width: wrapperRect.width,
            height: wrapperRect.height,
            portrait: {
                left: portraitRect.left - wrapperRect.left,
                right: portraitRect.right - wrapperRect.left,
                top: portraitRect.top - wrapperRect.top,
                bottom: portraitRect.bottom - wrapperRect.top
            }
        };

        states.forEach(state => {
            state.width = state.icon.offsetWidth;
            state.height = state.icon.offsetHeight;
            state.baseLeft = state.icon.offsetLeft;
            state.baseTop = state.icon.offsetTop;
        });
    };

    const intersectsPortrait = (left, top, width, height) => {
        const gap = 4;
        return (
            left < bounds.portrait.right + gap &&
            left + width > bounds.portrait.left - gap &&
            top < bounds.portrait.bottom + gap &&
            top + height > bounds.portrait.top - gap
        );
    };

    const bounceFromPortrait = (state, left, top) => {
        const iconCenterX = left + state.width / 2;
        const iconCenterY = top + state.height / 2;
        const portraitCenterX = (bounds.portrait.left + bounds.portrait.right) / 2;
        const portraitCenterY = (bounds.portrait.top + bounds.portrait.bottom) / 2;

        if (Math.abs(iconCenterX - portraitCenterX) > Math.abs(iconCenterY - portraitCenterY)) {
            state.vx = Math.abs(state.vx) * (iconCenterX < portraitCenterX ? -1 : 1);
            state.x += state.vx > 0 ? 2 : -2;
        } else {
            state.vy = Math.abs(state.vy) * (iconCenterY < portraitCenterY ? -1 : 1);
            state.y += state.vy > 0 ? 2 : -2;
        }
    };

    const tick = (time) => {
        const dt = Math.min((time - lastTime) / 1000, 0.04);
        lastTime = time;

        if (bounds && isVisible) {
            states.forEach(state => {
                state.x += state.vx * dt;
                state.y += state.vy * dt;

                let left = state.baseLeft + state.x;
                let top = state.baseTop + state.y;

                if (left <= 0 || left + state.width >= bounds.width) {
                    state.vx *= -1;
                    state.x = Math.min(Math.max(state.x, -state.baseLeft), bounds.width - state.baseLeft - state.width);
                    left = state.baseLeft + state.x;
                }

                if (top <= 0 || top + state.height >= bounds.height) {
                    state.vy *= -1;
                    state.y = Math.min(Math.max(state.y, -state.baseTop), bounds.height - state.baseTop - state.height);
                    top = state.baseTop + state.y;
                }

                if (intersectsPortrait(left, top, state.width, state.height)) {
                    bounceFromPortrait(state, left, top);
                }

                state.icon.style.setProperty('--bounce-x', `${state.x.toFixed(2)}px`);
                state.icon.style.setProperty('--bounce-y', `${state.y.toFixed(2)}px`);
            });
        }

        requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(entries => {
        isVisible = entries[0]?.isIntersecting ?? true;
    }, { threshold: 0.05 });

    measure();
    observer.observe(wrapper);
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('load', measure, { once: true });
    requestAnimationFrame(tick);
};

// Mobile Menu
const initMobileMenu = () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');
    if (!hamburger || !navLinks) return;

    const setMenuOpen = (isOpen) => {
        navLinks.classList.toggle('active', isOpen);
        hamburger.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('nav-open', isOpen);
    };

    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-controls', 'site-navigation');
    navLinks.id = navLinks.id || 'site-navigation';

    hamburger.addEventListener('click', () => setMenuOpen(!navLinks.classList.contains('active')));

    hamburger.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setMenuOpen(!navLinks.classList.contains('active'));
        }
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            setMenuOpen(false);
        });
    });

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') setMenuOpen(false);
    });
};

// Contact Form (Resend API via Vercel Function)
const initForm = () => {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const btn = form.querySelector('.cta-button');
    const originalBtnText = btn?.innerHTML || 'Send Message';

    form.action = '/api/contact';
    form.method = 'POST';
    form.removeAttribute('target');

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!btn) return;

        const payload = {
            name: form.name?.value?.trim(),
            email: form.email?.value?.trim(),
            subject: form.subject?.value?.trim(),
            message: form.message?.value?.trim()
        };

        btn.disabled = true;
        btn.innerHTML = 'Sending...';
        btn.style.opacity = '0.72';

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error || 'Message could not be sent.');
            }

            btn.innerHTML = 'Message Sent!';
            form.reset();
            alert('Message Sent Successfully!');
        } catch (error) {
            btn.innerHTML = 'Try Again';
            alert(error.message || 'Message could not be sent. Please try again.');
        } finally {
            btn.disabled = false;
            btn.style.opacity = '1';
            window.setTimeout(() => {
                btn.innerHTML = originalBtnText;
            }, 3000);
        }
    });
};

// Vanta.js Removed
const initVanta = () => {
    // Moved to particles.js
};

// ... (Physics Code Content)

// Antigravity Physics Engine (High-Performance Spring System)
class SpringSolver {
    constructor(tension = 120, friction = 15) {
        this.tension = tension;
        this.friction = friction;
        this.currentValue = 0;
        this.targetValue = 0;
        this.velocity = 0;
    }

    update(dt) {
        // Solve Spring (F = -kx - cv)
        const displacement = this.currentValue - this.targetValue;
        const force = -this.tension * displacement;
        const damping = -this.friction * this.velocity;
        const acceleration = force + damping;

        this.velocity += acceleration * dt;
        this.currentValue += this.velocity * dt;
        return this.currentValue;
    }

    setTarget(value) {
        this.targetValue = value;
    }
}

class AntigravityElement {
    constructor(element, options = {}) {
        this.element = element;
        this.rect = this.element.getBoundingClientRect();

        // Configuration
        this.isMagnetic = options.magnetic || false;
        this.isFloating = options.floating || false;

        // Physics tuning
        // Magnetic: snappy but fluid
        // Floating: very slow, underwater feel
        const tension = this.isMagnetic ? 150 : 10;
        const friction = this.isMagnetic ? 12 : 5;

        this.springX = new SpringSolver(tension, friction);
        this.springY = new SpringSolver(tension, friction);

        this.isActive = false;

        this.init();
    }

    init() {
        if (this.isMagnetic) {
            this.element.addEventListener('mousemove', (e) => this.onMouseMove(e));
            this.element.addEventListener('mouseleave', () => this.onMouseLeave());
            // Update rect on scroll/resize to keep physics accurate
            window.addEventListener('resize', () => this.updateRect(), { passive: true });
        }

        if (this.isFloating) {
            window.addEventListener('mousemove', (e) => this.onGlobalMouseMove(e), { passive: true });
        }
    }

    updateRect() {
        this.rect = this.element.getBoundingClientRect();
    }

    onMouseMove(e) {
        this.isActive = true;
        // Optimization: calc rect only on enter or lazily if needed, but here we assume rect is roughly static relative to viewport unless scrolled.
        // Actually for magnetic buttons in flow, getBoundingClientRect on every frame is expensive (Layout Thrashing).
        // Better: Use the cached rect and update it on 'mouseenter'
        if (!this.rectValid) {
            this.updateRect();
            this.rectValid = true;
        }

        const x = (e.clientX - this.rect.left) - this.rect.width / 2;
        const y = (e.clientY - this.rect.top) - this.rect.height / 2;

        this.springX.setTarget(x * 0.4);
        this.springY.setTarget(y * 0.4);
    }

    onGlobalMouseMove(e) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Very subtle parallax
        const moveX = (e.clientX - centerX) * 0.015;
        const moveY = (e.clientY - centerY) * 0.015;

        this.springX.setTarget(moveX);
        this.springY.setTarget(moveY);
    }

    onMouseLeave() {
        this.isActive = false;
        this.springX.setTarget(0);
        this.springY.setTarget(0);
        this.rectValid = false; // Invalidate cache
    }

    render(dt) {
        const x = this.springX.update(dt);
        const y = this.springY.update(dt);

        // Optimization: sleep if settled
        if (!this.isActive && Math.abs(x - this.springX.targetValue) < 0.05 && Math.abs(y - this.springY.targetValue) < 0.05 && Math.abs(this.springX.velocity) < 0.05) {
            return;
        }

        this.element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
}

// Global Physics Manager
const physicsWorld = {
    elements: [],
    lastTime: performance.now(),
    started: false,
    init() {
        if (this.started) return;
        this.started = true;
        // Start Loop
        const loop = (time) => {
            const dt = Math.min((time - this.lastTime) / 1000, 0.1);
            this.lastTime = time;
            this.elements.forEach(el => el.render(dt));
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    },
    add(el, options) {
        this.elements.push(new AntigravityElement(el, options));
    }
};

// Replace old Magnetic function
const initMagneticButtons = () => {
    if (!allowEnhancedMotion()) return;
    physicsWorld.init();

    // Interactive Magnets
    const magnets = document.querySelectorAll('.nav-links a, .contact-box');
    magnets.forEach(el => {
        physicsWorld.add(el, { magnetic: true });
    });

    // Ambient Floaters (Antigravity cards)
    // DISABLED to prevent conflict with ScrollTrigger
    /* 
    if (window.innerWidth > 900) {
        const floaters = document.querySelectorAll('.glossy-card, .skill-item');
        floaters.forEach(el => {
            physicsWorld.add(el, { floating: true });
        });
    } 
    */
};

window.addEventListener('load', () => {
    if (window.requestIdleCallback) {
        requestIdleCallback(() => {
            // initVanta(); // Removed
            initTilt();
            initCursor();
        });
    } else {
        setTimeout(() => {
            // initVanta(); // Removed
            initTilt();
            initCursor();
        }, 100);
    }

    // Desktop-only smooth scroll. Native scrolling is faster on mobile Chrome.
    if (typeof Lenis !== 'undefined' && allowEnhancedMotion()) {
        const lenis = new Lenis({
            duration: 0.85,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 1.35,
        });

        // Sync Lenis with ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(500, 33);

        // Global ScrollTrigger Optimization
        ScrollTrigger.defaults({
            fastScrollEnd: true,
            preventOverlaps: true
        });
    } else if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.defaults({
            fastScrollEnd: true,
            preventOverlaps: true
        });
    }
});

// Tabs Logic
document.addEventListener('DOMContentLoaded', () => {
    const tabTitles = document.querySelectorAll('.tab-title');
    const projectsContent = document.getElementById('projects-content');
    const certificationsContent = document.getElementById('certifications-content');

    tabTitles.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');

            // Update active state for tabs
            tabTitles.forEach(t => {
                t.classList.remove('active');
                t.classList.add('inactive');
            });
            tab.classList.add('active');
            tab.classList.remove('inactive');

            // Toggle Content
            if (target === 'projects') {
                projectsContent.style.display = 'grid';
                certificationsContent.style.display = 'none';
            } else if (target === 'certifications') {
                projectsContent.style.display = 'none';
                certificationsContent.style.display = 'grid';
            }
        });
    });
});

// Advanced GSAP Animations
const initAdvancedAnimations = () => {
    gsap.registerPlugin(ScrollTrigger);
    const lightweightMotion = !allowEnhancedMotion();

    gsap.from(".hero-greeting, .hero-name, .hero-role, .hero-buttons .cta-button", {
        opacity: 0,
        y: lightweightMotion ? 10 : 28,
        duration: lightweightMotion ? 0.35 : 0.9,
        stagger: lightweightMotion ? 0.04 : 0.12,
        ease: "power3.out"
    });

    gsap.from(".hero-image-wrapper", {
        opacity: 0,
        scale: lightweightMotion ? 1 : 0.94,
        y: lightweightMotion ? 8 : 24,
        duration: lightweightMotion ? 0.35 : 1,
        ease: "power3.out"
    });

    // 0. Text Reveals
    if (!lightweightMotion) {
        splitTextToSpans('.section-title, .about-arrow-header');

        document.querySelectorAll('.section-title, .about-arrow-header').forEach(title => {
            const chars = title.querySelectorAll('span');
            gsap.from(chars, {
                scrollTrigger: {
                    trigger: title,
                    start: "top 80%",
                },
                opacity: 0,
                y: 50,
                rotateX: -90,
                stagger: 0.1,
                duration: 1,
                ease: "back.out(1.7)"
            });
        });
    }

    // 1. Responsive Layout Logic
    const handleLayout = () => {
        const heroText = document.querySelector('.hero-text');
        const heroBtns = document.querySelector('.hero-buttons');

        if (!heroText || !heroBtns) return;

        if (heroBtns.parentElement !== heroText) {
            heroText.appendChild(heroBtns);
        }
    };

    handleLayout();
    window.addEventListener('resize', handleLayout);

    // 2. GSAP MatchMedia
    let mm = gsap.matchMedia();

    // DESKTOP
    mm.add("(min-width: 901px)", () => {
        // Hero Animation Removed per user request

        // Ensure static visibility
        gsap.set(".hero-text", { clearProps: "all" });
        gsap.set(".hero-image-wrapper", { clearProps: "all" });

        const projectTrack = document.querySelector(".projects-horizontal-track");
        if (projectTrack) {
            gsap.set(projectTrack, { clearProps: "transform" });
        }
    });

    // MOBILE
    mm.add("(max-width: 900px)", () => {
        gsap.set(".hero-text", { scale: 1, y: 0, opacity: 1, clearProps: "transform" });
        gsap.set(".hero-image-wrapper", { opacity: 1, y: 0, scale: 1, visibility: "visible", clearProps: "transform" });
    });

    if (!lightweightMotion) {
        // Section Reveals
        const sections = document.querySelectorAll("#about, #skills, #activity, #projects, #contact");
        sections.forEach(section => {
            gsap.fromTo(section, {
                opacity: 0,
                y: 42
            }, {
                scrollTrigger: {
                    trigger: section,
                    start: "top 85%",
                    toggleActions: "play none none none"
                },
                opacity: 1,
                y: 0,
                duration: 0.7,
                ease: "power2.out"
            });
        });
    }

    gsap.utils.toArray(".education-content, .skills-grid-new").forEach(timeline => {
        ScrollTrigger.create({
            trigger: timeline,
            start: "top 75%",
            onEnter: () => timeline.classList.add("timeline-visible"),
            onLeaveBack: () => timeline.classList.remove("timeline-visible")
        });
    });

    if (!lightweightMotion) {
        // Staggered Animations (Updated)
        gsap.utils.toArray(".glossy-card, .project-card, .heatmap-card, .contact-pill, .skill-item").forEach(el => {
            gsap.from(el, {
                scrollTrigger: {
                    trigger: el,
                    start: "top 92%",
                    once: true
                },
                y: 24,
                opacity: 0,
                duration: 0.45,
                ease: "power2.out"
            });
        });
    }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initMobileMenu();
    initMagneticButtons();
    initCodingHeatmaps();
    initVisitorAnalytics();
    initMetricsModal();
    initDocumentGate();
    if (document.getElementById('contactForm')) initForm();
    initAdvancedAnimations();
    initActiveNav();
    initDigitalClock();
    initTypewriters();
    initProfileIconBounce();
    initScrollProgress();
});
