// Strict dark portfolio interactions

const PROFILE_CONFIG = {
    github: "nirmalya-ghosh",
    leetcode: "nirmalya2127",
    analyticsEndpoint: "/api/analytics-event"
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
    element.textContent = `${target.toFixed(decimals)}${suffix}`;
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
        { at: 66, text: 'Syncing heatmaps' },
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

const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

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

const formatFullDate = (date) => date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
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

const getClientId = () => {
    const key = 'portfolioVisitorId';
    let value = localStorage.getItem(key);
    if (!value) {
        value = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(key, value);
    }
    return value;
};

const getSessionId = () => {
    const key = 'portfolioSessionId';
    let value = sessionStorage.getItem(key);
    if (!value) {
        value = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem(key, value);
    }
    return value;
};

const getUtmParams = () => {
    const params = new URLSearchParams(window.location.search);
    return ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
        .reduce((utm, key) => {
            const value = params.get(key);
            if (value) utm[key] = value.slice(0, 200);
            return utm;
        }, {});
};

const buildAnalyticsPayload = (eventName, metadata = {}) => ({
    eventName,
    visitorId: getClientId(),
    sessionId: getSessionId(),
    pagePath: window.location.pathname,
    pageTitle: document.title,
    referrer: document.referrer,
    deviceType: getDeviceType(),
    browser: getBrowserName(),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    language: navigator.language || '',
    metadata: {
        ...metadata,
        hash: window.location.hash || '',
        utm: getUtmParams()
    }
});

const sendAnalyticsEvent = (eventName, metadata = {}, options = {}) => {
    if (!PROFILE_CONFIG.analyticsEndpoint) return;

    const body = JSON.stringify(buildAnalyticsPayload(eventName, metadata));

    if (options.beacon && navigator.sendBeacon) {
        const sent = navigator.sendBeacon(
            PROFILE_CONFIG.analyticsEndpoint,
            new Blob([body], { type: 'application/json' })
        );
        if (sent) return;
    }

    fetch(PROFILE_CONFIG.analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: Boolean(options.keepalive)
    }).catch(() => {
        // Analytics is best-effort and must never interrupt the portfolio experience.
    });
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
    const solved = 435;
    const totalQuestions = Number(data.totalQuestions) || 0;
    const completion = totalQuestions ? Math.min(100, (solved / totalQuestions) * 100) : 0;
    const easySolved = Number(data.easySolved) || 0;
    const mediumSolved = Number(data.mediumSolved) || 0;
    const hardSolved = Number(data.hardSolved) || 0;
    const strongest = getStrongestDifficulty(data);
    const ring = document.querySelector('.leetcode-progress-ring');

    updateText('leetcode-total', formatNumber(solved));
    updateText('leetcode-easy', formatNumber(easySolved));
    updateText('leetcode-medium', formatNumber(mediumSolved));
    updateText('leetcode-hard', formatNumber(hardSolved));
    updateText('leetcode-rank', formatNumber(data.ranking));
    updateText('leetcode-strongest', strongest ? strongest.label : '--');
    updateText('leetcode-difficulty-mix', `${formatNumber(easySolved)}/${formatNumber(mediumSolved)}/${formatNumber(hardSolved)}`);

    if (ring) {
        const degreesPerProblem = totalQuestions ? 360 / totalQuestions : 0;
        ring.style.setProperty('--easy-deg', `${easySolved * degreesPerProblem}deg`);
        ring.style.setProperty('--medium-deg', `${mediumSolved * degreesPerProblem}deg`);
        ring.style.setProperty('--hard-deg', `${hardSolved * degreesPerProblem}deg`);
        ring.setAttribute('aria-label', `${formatNumber(solved)} LeetCode problems solved`);
        ring.title = `${formatNumber(solved)} solved: ${formatNumber(easySolved)} easy, ${formatNumber(mediumSolved)} medium, ${formatNumber(hardSolved)} hard`;
    }

    animateCount(document.getElementById('leetcode-easy'), easySolved);
    animateCount(document.getElementById('leetcode-medium'), mediumSolved);
    animateCount(document.getElementById('leetcode-hard'), hardSolved);
};

const renderHeatmap = (container, days, getDayData, options = {}) => {
    if (!container) return;

    container.classList.remove('is-loading', 'is-error');
    delete container.dataset.error;
    container.innerHTML = '';
    const leadingBlanks = days[0].getDay();
    const totalColumns = Math.ceil((days.length + leadingBlanks) / 7);
    container.style.gridTemplateColumns = `repeat(${totalColumns}, var(--heatmap-cell))`;
    const todayKey = getDateKey(new Date());

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
        const dateKey = getDateKey(day);
        const square = document.createElement('span');
        square.className = 'heatmap-day';
        square.dataset.level = level;
        square.dataset.count = count;
        square.dataset.date = dateKey;
        square.style.setProperty('--heatmap-index', index);
        if (count > 0) square.classList.add('is-active');
        if (dateKey === todayKey) square.classList.add('is-today');
        square.tabIndex = 0;
        square.title = `${formatFullDate(day)}: ${count} ${options.unit || 'activities'}`;
        square.setAttribute('aria-label', square.title);
        square.addEventListener('mouseenter', () => {
            if (options.focusElement) {
                options.focusElement.textContent = `${formatFullDate(day)}: ${count} ${options.unit || 'activities'}`;
            }
        });
        square.addEventListener('focus', () => {
            if (options.focusElement) {
                options.focusElement.textContent = `${formatFullDate(day)}: ${count} ${options.unit || 'activities'}`;
            }
        });
        fragment.appendChild(square);
    });

    container.appendChild(fragment);
};

const setHeatmapError = (container, message = 'Activity data is temporarily unavailable.') => {
    if (!container) return;
    container.innerHTML = '';
    container.classList.remove('is-loading');
    container.classList.add('is-error');
    container.dataset.error = message;
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
        updateText('proof-github-active', insights.activeDays);
        updateText('github-average', insights.activeDays ? (sumCounts(days, day => getGitHubDay(day).count) / insights.activeDays).toFixed(1) : '0');
        updateText('github-longest-streak', insights.longestStreak);
        updateText('github-best-day', insights.bestDate ? `${insights.bestCount} on ${formatShortDate(insights.bestDate)}` : '0');
        updateText('github-last-30', formatNumber(sumCounts(days.slice(-30), day => getGitHubDay(day).count)));
        animateCount(document.getElementById('github-active-days'), insights.activeDays);
        if (focusElement) {
            focusElement.textContent = `${formatNumber(sumCounts(days, day => getGitHubDay(day).count))} contributions across ${insights.activeDays} active days. Hover a square for the exact date.`;
        }

        renderHeatmap(container, days, getGitHubDay, {
            monthsContainer,
            focusElement,
            unit: 'contributions'
        });
    } catch (error) {
        if (focusElement) focusElement.textContent = 'GitHub data could not be loaded right now.';
        setHeatmapError(container, 'Could not load GitHub contribution data.');
    }
};

const initLeetCodeHeatmap = async () => {
    const container = document.getElementById('leetcode-heatmap');
    const monthsContainer = document.getElementById('leetcode-months');
    const focusElement = document.getElementById('leetcode-focus');
    if (!container) return;

    try {
        const response = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${PROFILE_CONFIG.leetcode}`);
        if (!response.ok) throw new Error('LeetCode heatmap request failed');

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
        updateText('proof-leetcode-active', insights.activeDays);
        if (focusElement) {
            focusElement.textContent = `${formatNumber(sumCounts(days, day => getLeetCodeDay(day).count))} submissions across ${insights.activeDays} active days. Hover a square for the exact date.`;
        }

        renderHeatmap(container, days, getLeetCodeDay, {
            monthsContainer,
            focusElement,
            unit: 'submissions'
        });
    } catch (error) {
        if (focusElement) focusElement.textContent = 'LeetCode submission data could not be loaded right now.';
        updateLeetCodeOverview({});
        setHeatmapError(container, 'Could not load LeetCode submission data.');
    }
};

const initCodingHeatmaps = () => {
    initGitHubHeatmap();
    initLeetCodeHeatmap();
};

const initSupabaseAnalytics = () => {
    localStorage.removeItem('portfolioTotalVisits');

    const sessionStart = Date.now();
    let maxScrollDepth = 0;
    let lastSectionId = '';
    let lastEngagementSentAt = 0;

    sendAnalyticsEvent('page_view', {
        screenWidth: window.screen?.width || null,
        screenHeight: window.screen?.height || null,
        colorDepth: window.screen?.colorDepth || null,
        connection: navigator.connection?.effectiveType || '',
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    });

    const updateScrollDepth = () => {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        maxScrollDepth = Math.max(maxScrollDepth, Math.round(((window.scrollY || 0) / maxScroll) * 100));
    };

    window.addEventListener('scroll', updateScrollDepth, { passive: true });
    updateScrollDepth();

    const sectionObserver = 'IntersectionObserver' in window
        ? new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting || entry.intersectionRatio < 0.45) return;
                const sectionId = entry.target.id || '';
                if (!sectionId || sectionId === lastSectionId) return;
                lastSectionId = sectionId;
                sendAnalyticsEvent('section_view', { sectionId });
            });
        }, { threshold: [0.45] })
        : null;

    sectionObserver?.observe(document.getElementById('hero'));
    document.querySelectorAll('main section[id]').forEach(section => sectionObserver?.observe(section));

    document.addEventListener('click', event => {
        if (!(event.target instanceof Element)) return;
        const link = event.target.closest('a');
        const button = event.target.closest('button');
        const target = link || button;
        if (!target) return;

        const href = link?.getAttribute('href') || '';
        const url = link?.href || '';
        const text = (target.getAttribute('aria-label') || target.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 140);
        const projectCard = target.closest('.project-card');
        const contactBox = target.closest('.contact-box, .orbit-icon');

        let eventName = button ? 'button_click' : 'link_click';
        if (link?.classList.contains('protected-document-link')) eventName = 'document_gate_open';
        if (projectCard) eventName = 'project_link_click';
        if (contactBox) eventName = 'contact_link_click';
        if (url && /^https?:\/\//.test(url) && !url.startsWith(window.location.origin)) eventName = 'outbound_link_click';
        if (href?.startsWith('#')) eventName = 'anchor_link_click';
        if (target.matches('[data-assistant-prompt]')) eventName = 'assistant_prompt_click';

        sendAnalyticsEvent(eventName, {
            label: text,
            href,
            url,
            documentId: link?.dataset.documentId || '',
            documentLabel: link?.dataset.documentLabel || '',
            projectTitle: projectCard?.querySelector('h3')?.textContent?.trim() || '',
            contactTarget: contactBox?.getAttribute('aria-label') || ''
        });
    }, { capture: true });

    const flushEngagement = () => {
        const now = Date.now();
        if (now - lastEngagementSentAt < 1000) return;
        lastEngagementSentAt = now;
        sendAnalyticsEvent('session_engagement', {
            durationSeconds: Math.round((now - sessionStart) / 1000),
            maxScrollDepth
        }, { beacon: true, keepalive: true });
    };

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushEngagement();
    });
    window.addEventListener('pagehide', flushEngagement);
};

const initDocumentGate = () => {
    const links = document.querySelectorAll('.protected-document-link');
    const modal = document.getElementById('document-gate-modal');
    const form = document.getElementById('document-gate-form');
    const closeButton = modal?.querySelector('.document-gate-close');
    const turnstileElement = document.getElementById('turnstile-widget');
    const turnstileStatus = document.getElementById('turnstile-status');
    const copyElement = document.getElementById('document-gate-copy');
    const errorElement = document.getElementById('document-gate-error');
    const submitButton = form?.querySelector('button[type="submit"]');
    const emailCard = document.getElementById('document-email-card');
    const companyEmailInput = document.getElementById('document-company-email');
    const otpInput = document.getElementById('document-otp');
    const sendOtpButton = document.getElementById('document-send-otp');
    const otpStatus = document.getElementById('document-otp-status');
    const approvalStatus = document.getElementById('document-approval-status');
    const approvalTitle = document.getElementById('document-approval-title');
    const approvalCopy = document.getElementById('document-approval-copy');
    const resumeViewerModal = document.getElementById('resume-viewer-modal');
    const resumeViewerFrame = document.getElementById('resume-viewer-frame');
    const resumeViewerNote = document.getElementById('resume-viewer-note');
    const resumeViewerWatermark = document.getElementById('resume-viewer-watermark');
    const resumeViewerClose = resumeViewerModal?.querySelector('.resume-viewer-close');
    const resumeOpenNewTab = document.getElementById('resume-open-new-tab');
    const resumeFrameOpenLink = document.getElementById('resume-frame-open-link');

    if (!links.length || !modal || !form || !closeButton || !turnstileElement || !submitButton) return;
    const submitButtonOriginalHtml = submitButton.innerHTML;

    let activeDocumentId = '';
    let activeLabel = 'document';
    let turnstileWidgetId = null;
    let turnstileToken = '';
    let turnstileReadyTimer = null;
    let turnstileRenderStarted = false;
    let otpRequestId = '';
    let verifiedOtpEmail = '';
    let approvalPollTimer = null;

    const syncModalScrollLock = () => {
        const hasOpenModal = modal.classList.contains('active') || Boolean(resumeViewerModal?.classList.contains('active'));
        document.documentElement.classList.toggle('modal-open', hasOpenModal);
        document.body.classList.toggle('modal-open', hasOpenModal);
    };

    const setError = (message = '') => {
        if (errorElement) errorElement.textContent = message;
    };

    const setOtpStatus = (message = '') => {
        if (otpStatus) otpStatus.textContent = message;
    };

    const setCloudflareStatus = (message = '') => {
        if (turnstileStatus) turnstileStatus.textContent = message;
    };

    const getAccessEmail = () => String(companyEmailInput?.value || '').trim().toLowerCase();

    const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const resetOtp = () => {
        otpRequestId = '';
        verifiedOtpEmail = '';
        if (otpInput) otpInput.value = '';
        setOtpStatus('');
    };

    const setApprovalStage = (stage = 'idle', copy = '') => {
        if (!approvalStatus) return;

        const isVisible = stage !== 'idle';
        approvalStatus.hidden = !isVisible;
        modal.classList.toggle('is-awaiting-approval', stage === 'waiting');
        modal.classList.toggle('is-approval-approved', stage === 'approved');
        approvalStatus.dataset.stage = stage;

        if (stage === 'waiting') {
            if (approvalTitle) approvalTitle.textContent = 'Verification complete';
            if (approvalCopy) approvalCopy.textContent = copy || 'Your email and OTP are verified. Waiting for approval to release the resume securely.';
        }

        if (stage === 'approved') {
            if (approvalTitle) approvalTitle.textContent = 'Access approved';
            if (approvalCopy) approvalCopy.textContent = copy || 'Approval received. Opening the secure resume viewer now.';
        }
    };

    const stopApprovalPolling = () => {
        if (approvalPollTimer) {
            window.clearInterval(approvalPollTimer);
            approvalPollTimer = null;
        }
    };

    const setRedirectingState = (url, openUrl = url) => {
        stopApprovalPolling();
        setError('');
        setOtpStatus('Approval received. Preparing your secure resume viewer...');
        setApprovalStage('approved', 'Approval received. Preparing your secure resume viewer now.');
        sendAnalyticsEvent('resume_access_approved', {
            documentId: activeDocumentId
        });
        submitButton.disabled = true;
        submitButton.classList.add('is-redirecting');
        submitButton.innerHTML = 'Opening Secure Resume <i class="fas fa-spinner fa-spin"></i>';

        window.setTimeout(() => {
            openResumeViewer(url, verifiedOtpEmail, openUrl);
            setOpen(false);
        }, 1650);
    };

    const openResumeViewer = (url, email, openUrl = url) => {
        if (!resumeViewerModal || !resumeViewerFrame) {
            window.location.href = openUrl;
            return;
        }

        const isExternalViewer = /drive\.google\.com\/file\/d\/[^/]+\/preview/.test(url);
        const viewerUrl = isExternalViewer ? url : `${url}#toolbar=0&navpanes=0&scrollbar=1`;
        resumeViewerFrame.src = viewerUrl;
        if (resumeOpenNewTab) resumeOpenNewTab.href = openUrl;
        if (resumeFrameOpenLink) resumeFrameOpenLink.href = openUrl;
        if (resumeViewerNote) resumeViewerNote.textContent = 'Your approval is confirmed. The resume is available in this viewer and can also be opened in a new tab.';
        if (resumeViewerWatermark) {
            const watermark = `Verified for ${email}`;
            resumeViewerWatermark.textContent = watermark;
            resumeViewerWatermark.dataset.watermark = watermark;
        }
        resumeViewerModal.classList.add('active');
        resumeViewerModal.setAttribute('aria-hidden', 'false');
        syncModalScrollLock();
    };

    const closeResumeViewer = () => {
        if (!resumeViewerModal) return;
        resumeViewerModal.classList.remove('active');
        resumeViewerModal.setAttribute('aria-hidden', 'true');
        syncModalScrollLock();
        if (resumeViewerFrame) resumeViewerFrame.src = 'about:blank';
        if (resumeOpenNewTab) resumeOpenNewTab.href = '#';
        if (resumeFrameOpenLink) resumeFrameOpenLink.href = '#';
    };

    const startApprovalPolling = ({ requestId, email }) => {
        stopApprovalPolling();
        let checks = 0;

        const checkStatus = async () => {
            checks += 1;
            try {
                const response = await fetch('/api/resume-access-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requestId, email })
                });
                const result = await response.json();

                if (!response.ok) throw new Error(result?.error || 'Approval check failed.');

                if (result.status === 'approved' && result.url) {
                    setRedirectingState(result.url, result.openUrl || result.url);
                    return;
                }

                if (result.status === 'rejected') {
                    stopApprovalPolling();
                    setError(result.message || 'Your resume access request was not approved.');
                    submitButton.innerHTML = 'Request Not Approved <i class="fas fa-times"></i>';
                    return;
                }

                const dotCount = (checks % 3) + 1;
                const waitingCopy = `Verification complete. Waiting for approval${'.'.repeat(dotCount)}`;
                setOtpStatus(waitingCopy);
                setApprovalStage('waiting', 'Your request is in review. This window will update automatically as soon as access is approved.');
            } catch (error) {
                if (checks > 3) {
                    setOtpStatus('Still waiting for approval. Keep this window open.');
                    setApprovalStage('waiting', 'Still waiting for approval. The resume will open here automatically once access is granted.');
                }
            }
        };

        checkStatus();
        approvalPollTimer = window.setInterval(checkStatus, 4500);
    };

    const renderTurnstile = ({ forceReset = false } = {}) => {
        if (turnstileReadyTimer) {
            window.clearTimeout(turnstileReadyTimer);
            turnstileReadyTimer = null;
        }

        if (!window.turnstile) {
            setCloudflareStatus('Connecting to Cloudflare...');
            turnstileElement.classList.add('is-loading');
            turnstileReadyTimer = window.setTimeout(() => renderTurnstile(), 160);
            return;
        }

        const sitekey = turnstileElement.dataset.sitekey;
        if (!sitekey || sitekey === 'YOUR_TURNSTILE_SITE_KEY') {
            setError('Cloudflare site key is not configured yet.');
            setCloudflareStatus('');
            return;
        }

        if (turnstileWidgetId !== null) {
            if (forceReset) {
                window.turnstile.reset(turnstileWidgetId);
                turnstileToken = '';
                setCloudflareStatus('Refreshing Cloudflare verification...');
                turnstileElement.classList.add('is-loading');
            } else if (turnstileToken) {
                setCloudflareStatus('Cloudflare verified.');
                turnstileElement.classList.remove('is-loading');
            }
            return;
        }

        turnstileRenderStarted = true;
        setCloudflareStatus('Preparing Cloudflare verification...');
        turnstileElement.classList.add('is-loading');
        turnstileWidgetId = window.turnstile.render(turnstileElement, {
            sitekey,
            size: 'flexible',
            theme: 'dark',
            retry: 'auto',
            'retry-interval': 800,
            'refresh-expired': 'auto',
            'refresh-timeout': 'auto',
            callback: token => {
                turnstileToken = token;
                setError('');
                setCloudflareStatus('Cloudflare verified.');
                turnstileElement.classList.remove('is-loading');
            },
            'expired-callback': () => {
                turnstileToken = '';
                setCloudflareStatus('Refreshing Cloudflare verification...');
                turnstileElement.classList.add('is-loading');
                renderTurnstile({ forceReset: true });
            },
            'error-callback': () => {
                turnstileToken = '';
                setCloudflareStatus('Cloudflare is reconnecting...');
                turnstileElement.classList.add('is-loading');
            }
        });
    };

    const warmTurnstile = () => {
        if (turnstileRenderStarted || turnstileWidgetId !== null) return;
        renderTurnstile();
    };

    const setOpen = (isOpen) => {
        modal.classList.toggle('active', isOpen);
        modal.setAttribute('aria-hidden', String(!isOpen));
        syncModalScrollLock();

        if (isOpen) {
            setError('');
            stopApprovalPolling();
            resetOtp();
            if (companyEmailInput) companyEmailInput.value = '';
            if (emailCard) emailCard.hidden = activeDocumentId !== 'resume';
            setApprovalStage('idle');
            submitButton.disabled = false;
            submitButton.classList.remove('is-redirecting');
            submitButton.innerHTML = submitButtonOriginalHtml;
            renderTurnstile();
        } else if (window.turnstile && turnstileWidgetId !== null) {
            stopApprovalPolling();
            resetOtp();
            setApprovalStage('idle');
        }
    };

    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            activeDocumentId = link.dataset.documentId || '';
                activeLabel = link.dataset.documentLabel || 'document';
            if (copyElement) {
                copyElement.textContent = activeDocumentId === 'resume'
                    ? 'Verify your email with OTP. After approval, keep this window open and the resume will open here.'
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
            sendAnalyticsEvent('resume_otp_requested', {
                documentId: activeDocumentId
            });
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
    resumeViewerClose?.addEventListener('click', closeResumeViewer);

    modal.addEventListener('click', event => {
        if (event.target === modal) setOpen(false);
    });
    resumeViewerModal?.addEventListener('click', event => {
        if (event.target === resumeViewerModal) closeResumeViewer();
    });

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal.classList.contains('active')) setOpen(false);
        if (event.key === 'Escape' && resumeViewerModal?.classList.contains('active')) closeResumeViewer();
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();

        const honeypot = form.querySelector('.document-honeypot');
        if (honeypot?.value) return;

        if (!turnstileToken) {
            renderTurnstile();
            setError('Cloudflare is finishing verification. Please wait a moment and try again.');
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
                sendAnalyticsEvent('resume_access_pending_approval', {
                    documentId: activeDocumentId
                });
                setError('');
                setOtpStatus(result.message || 'Verification complete. Waiting for approval.');
                setApprovalStage('waiting', 'Your email and OTP are verified. Waiting for approval to release the resume securely.');
                submitButton.disabled = true;
                submitButton.innerHTML = 'Waiting for Approval <i class="fas fa-hourglass-half"></i>';
                startApprovalPolling({ requestId: otpRequestId, email: accessEmail });
            }
        } catch (error) {
            setError(error.message || 'Verification failed. Please try again.');
            if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
            turnstileToken = '';
            setCloudflareStatus('Refreshing Cloudflare verification...');
            turnstileElement.classList.add('is-loading');
        } finally {
            if (!requestCompleted) submitButton.disabled = false;
            submitButton.classList.remove('is-loading');
        }
    });

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(warmTurnstile, { timeout: 1800 });
    } else {
        window.setTimeout(warmTurnstile, 900);
    }
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
    if (!allowEnhancedMotion()) return;

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
        sendAnalyticsEvent('contact_form_submit_attempt', {
            hasName: Boolean(payload.name),
            hasEmail: Boolean(payload.email),
            hasSubject: Boolean(payload.subject),
            messageLength: payload.message?.length || 0
        });

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
            sendAnalyticsEvent('contact_form_submit_success', {
                subjectLength: payload.subject?.length || 0,
                messageLength: payload.message?.length || 0
            });
            alert('Message Sent Successfully!');
        } catch (error) {
            btn.innerHTML = 'Try Again';
            sendAnalyticsEvent('contact_form_submit_error', {
                message: error.message || 'Message could not be sent.'
            });
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
        const sections = document.querySelectorAll("#about, #skills, #heatmaps, #featured-projects, #projects, #contact");
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

const initProfileAssistant = () => {
    const assistant = document.getElementById('profile-assistant');
    const launcher = document.getElementById('assistant-launcher');
    const panel = document.getElementById('assistant-panel');
    const closeButton = document.getElementById('assistant-close');
    const messagesElement = document.getElementById('assistant-messages');
    const form = document.getElementById('assistant-form');
    const input = document.getElementById('assistant-input');
    const promptButtons = document.querySelectorAll('[data-assistant-prompt]');

    if (!assistant || !launcher || !panel || !messagesElement || !form || !input) return;

    const messages = [{
        role: 'assistant',
        content: "Hi, I am Nirmalya AI. Ask about internship fit, skills, projects, resume download, or contact details."
    }];

    const escapeText = (value = '') =>
        String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    const renderMessages = () => {
        messagesElement.innerHTML = messages.map(message => `
            <div class="assistant-message ${message.role}">
                <span>${message.role === 'assistant' ? 'Nirmalya AI' : 'You'}</span>
                <p>${escapeText(message.content).replace(/\n/g, '<br>')}</p>
            </div>
        `).join('');
        messagesElement.scrollTop = messagesElement.scrollHeight;
    };

    const setOpen = (open) => {
        assistant.classList.toggle('is-open', open);
        panel.setAttribute('aria-hidden', String(!open));
        launcher.setAttribute('aria-expanded', String(open));
        if (open) window.setTimeout(() => input.focus(), 120);
    };

    const setLoading = (loading) => {
        assistant.classList.toggle('is-thinking', loading);
        input.disabled = loading;
        form.querySelector('button')?.toggleAttribute('disabled', loading);
    };

    const askAssistant = async (question) => {
        const content = question.trim();
        if (!content) return;

        sendAnalyticsEvent('assistant_question_submitted', {
            questionLength: content.length,
            fromSuggestion: Boolean([...promptButtons].some(button => button.dataset.assistantPrompt === content))
        });
        messages.push({ role: 'user', content });
        renderMessages();
        input.value = '';
        setLoading(true);

        try {
            const response = await fetch('/api/profile-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messages.slice(-8) })
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result?.error || 'Assistant unavailable.');

            messages.push({
                role: 'assistant',
                content: result.answer || 'I could not find a reliable answer for that. Please contact Nirmalya directly for the latest details.'
            });
        } catch (error) {
            messages.push({
                role: 'assistant',
                content: 'I am having trouble connecting right now. You can still reach Nirmalya at nirmalyaghosh2127@gmail.com or review his GitHub at github.com/nirmalya-ghosh.'
            });
        } finally {
            setLoading(false);
            renderMessages();
        }
    };

    renderMessages();
    launcher.addEventListener('click', () => setOpen(!assistant.classList.contains('is-open')));
    closeButton?.addEventListener('click', () => setOpen(false));
    promptButtons.forEach(button => {
        button.addEventListener('click', () => {
            setOpen(true);
            askAssistant(button.dataset.assistantPrompt || '');
        });
    });
    form.addEventListener('submit', event => {
        event.preventDefault();
        askAssistant(input.value);
    });
    input.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            form.requestSubmit();
        }
    });
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initCodingHeatmaps();
    initSupabaseAnalytics();
    if (document.getElementById('contactForm')) initForm();
    initActiveNav();
    initScrollProgress();
    initProfileAssistant();
});
