const PROFILE_CONTEXT = `
Nirmalya Ghosh is an AI/ML learner and software builder.
Positioning: turns code, data, and security fundamentals into thoughtful products that are fast, useful, and ready for real users.
Education: B.Tech in Computer Science / Information Technology at KIIT, Kalinga Institute of Industrial Technology, Bhubaneswar, 2025-2029. Schooling: Beachwood School CBSE Higher Secondary, 2025; St. Xavier's School ICSE Secondary Education, 2023.
Focus areas: AI/ML systems, DSA, software engineering fundamentals, intelligent web products, cybersecurity-aware development, ethical hacking basics, clean engineering, practical product thinking.
Languages: Java, Python, C, JavaScript, HTML, CSS.
Web development: React, Node.js, Express.js, REST APIs, responsive design.
App development: Android with Java/Kotlin, Flutter beginner, mobile UI, API integration.
AI/ML: Python for ML, data analysis, model building, automation, AI product thinking.
UI/UX: Figma, wireframing, prototyping, user flow, visual design.
Databases: MySQL, MongoDB.
Cybersecurity: Kali Linux, Nmap, vulnerability assessment, penetration testing basics, cybersecurity fundamentals.
Tools: Git, GitHub, VS Code, Linux, AWS basics, Docker, Android Studio.
Concepts: OOP, data structures, algorithms, system design, problem solving, clean code.
Activity profiles: GitHub username nirmalya-ghosh. LeetCode username nirmalya2127.
Project surfaces: a Featured Projects page at /featured-projects.html, GitHub repositories, LinkedIn project/activity updates, LeetCode progress.
Featured project highlights: Secure Resume Access System, Recruiter AI Profile Assistant, Coding Activity Dashboard, Responsive Portfolio Interface, and DSA/LeetCode Practice Track.
Availability: open for internships, projects, collaborations, research ideas, AI/ML, software engineering, intelligent web products, and cybersecurity-aware development.
Contact: email nirmalyaghosh2127@gmail.com, phone +91 8967836222, LinkedIn https://www.linkedin.com/in/nirmalya-ghosh-422569377/, GitHub https://github.com/nirmalya-ghosh, WhatsApp https://wa.me/918967836222.
Resume access: the website has a secure resume gate with email OTP and owner approval. Recruiters should use the Resume button on the portfolio to request access.
`;

const PROFILE_FACTS = {
    fit: {
        title: 'Hiring fit',
        summary: 'Nirmalya is a strong early-career candidate for internships where fast learning, software fundamentals, AI/ML curiosity, and product-minded execution matter.',
        evidence: [
            'He is building practical portfolio systems, including secure resume access, an AI recruiter assistant, activity dashboards, and responsive web interfaces.',
            'His learning path combines DSA, web development, AI/ML foundations, databases, Linux tooling, and cybersecurity-aware development.',
            'He shows useful internship signals: initiative, public project evidence, willingness to learn, and comfort connecting engineering work to recruiter needs.'
        ],
        next: 'Review the Featured Projects page, GitHub repositories, LeetCode activity, and request the gated resume from the portfolio.'
    },
    skills: {
        title: 'Technical skills',
        summary: 'His strongest current stack is Java/Python/C for fundamentals, JavaScript/HTML/CSS for web work, and React/Node/Express for full-stack learning.',
        evidence: [
            'Languages: Java, Python, C, JavaScript, HTML, and CSS.',
            'Web: React, Node.js, Express.js, REST APIs, responsive interfaces, and frontend interaction design.',
            'Data and tools: MySQL, MongoDB, Git, GitHub, VS Code, Linux, Docker basics, AWS basics, and Android Studio.',
            'AI/ML: Python for ML, data analysis, model-building foundations, automation, and AI product thinking.'
        ],
        next: 'Ask for a role-specific summary, such as frontend intern, AI/ML intern, software engineering intern, or cybersecurity-focused intern.'
    },
    projects: {
        title: 'Project evidence',
        summary: 'The best project entry point is the Featured Projects page at /featured-projects.html, followed by GitHub repositories for source-level review.',
        evidence: [
            'Secure Resume Access System: gated resume workflow with OTP, approval, signed access, and Vercel Function support.',
            'Recruiter AI Profile Assistant: embedded assistant that answers from verified portfolio knowledge and can use OpenAI when configured.',
            'Coding Activity Dashboard: recruiter-friendly GitHub and LeetCode activity surfaces.',
            'Responsive Portfolio Interface: mobile-aware personal site with contact workflows and polished interactions.',
            'DSA and LeetCode Practice Track: visible problem-solving and interview-preparation signal.'
        ],
        next: 'Open /featured-projects.html, then inspect GitHub at https://github.com/nirmalya-ghosh.'
    },
    contact: {
        title: 'Contact',
        summary: 'Recruiters can contact Nirmalya directly through email, LinkedIn, phone, or WhatsApp.',
        evidence: [
            'Email: nirmalyaghosh2127@gmail.com',
            'Phone: +91 8967836222',
            'LinkedIn: https://www.linkedin.com/in/nirmalya-ghosh-422569377/',
            'GitHub: https://github.com/nirmalya-ghosh',
            'WhatsApp: https://wa.me/918967836222'
        ],
        next: 'For resume access, use the Resume button on the portfolio so the secure approval flow can track the request.'
    },
    resume: {
        title: 'Resume access',
        summary: 'Nirmalya keeps resume access protected through the portfolio resume gate.',
        evidence: [
            'Recruiters should use the Resume button on the website.',
            'The flow verifies email with OTP and waits for owner approval.',
            'After approval, the secure viewer opens the resume access route.'
        ],
        next: 'Use a professional email address when requesting access so the approval decision is easier.'
    },
    education: {
        title: 'Education',
        summary: 'Nirmalya is pursuing a B.Tech in Computer Science / Information Technology at KIIT, Bhubaneswar, for the 2025-2029 path.',
        evidence: [
            'University: KIIT, Kalinga Institute of Industrial Technology, Bhubaneswar.',
            'Higher Secondary: Beachwood School, CBSE, 2025.',
            'Secondary Education: St. Xavier\'s School, ICSE, 2023.',
            'Relevant learning areas include DSA, OOP, DBMS, networks, web technologies, AI/ML, and software engineering fundamentals.'
        ],
        next: 'For verified academic documents or details not listed here, contact Nirmalya directly.'
    },
    ai: {
        title: 'AI/ML direction',
        summary: 'Nirmalya is building toward AI/ML and intelligent product engineering from a practical learner foundation.',
        evidence: [
            'He uses Python for ML learning, data analysis, model-building basics, and automation.',
            'His portfolio assistant shows prompt design, grounded answering, and production fallback behavior.',
            'His best fit today is an internship where he can learn under supervision while contributing to AI-assisted tools, data workflows, or intelligent web features.'
        ],
        next: 'Ask him about recent experiments, model-building practice, or AI product ideas in an interview.'
    },
    security: {
        title: 'Cybersecurity awareness',
        summary: 'Nirmalya has cybersecurity fundamentals and uses them to think about safer product workflows.',
        evidence: [
            'Known tools and topics include Kali Linux, Nmap, vulnerability assessment, penetration testing basics, and secure workflow thinking.',
            'The resume access system reflects practical security awareness: verification, approval, access control, and protected document viewing.',
            'This is an early-career security foundation, not a claim of senior security specialization.'
        ],
        next: 'For security-focused roles, ask about threat modeling, web security basics, and how he would protect a user-facing workflow.'
    }
};

const INTENT_KEYWORDS = {
    fit: ['hire', 'hiring', 'fit', 'intern', 'internship', 'role', 'candidate', 'why', 'select', 'choose', 'strength', 'good'],
    skills: ['skill', 'stack', 'language', 'technology', 'tech', 'framework', 'tool', 'database', 'programming', 'know', 'web', 'website', 'frontend', 'backend', 'full-stack', 'fullstack', 'react', 'node'],
    projects: ['project', 'github', 'repo', 'repository', 'work', 'portfolio', 'built', 'code', 'featured', 'evidence'],
    contact: ['contact', 'email', 'phone', 'linkedin', 'whatsapp', 'reach', 'connect', 'message', 'call'],
    resume: ['resume', 'cv', 'document', 'download', 'view', 'access', 'approval', 'otp'],
    education: ['education', 'college', 'university', 'kiit', 'degree', 'school', 'academic', 'study', 'b.tech'],
    ai: ['ai', 'ml', 'machine', 'learning', 'model', 'data', 'automation', 'intelligent', 'openai'],
    security: ['security', 'cyber', 'ethical', 'hacking', 'kali', 'nmap', 'vulnerability', 'penetration', 'secure']
};

const sendJson = (response, statusCode, payload) => {
    response.statusCode = statusCode;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(payload));
};

const cleanMessages = (messages = []) =>
    messages
        .filter(message => ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string')
        .slice(-8)
        .map(message => ({
            role: message.role,
            content: message.content.slice(0, 1200)
        }));

const normalize = (value = '') =>
    String(value)
        .toLowerCase()
        .replace(/[^a-z0-9+.#\s/-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const detectIntents = (question = '') => {
    const normalized = normalize(question);
    const scores = Object.entries(INTENT_KEYWORDS)
        .map(([intent, keywords]) => ({
            intent,
            score: keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? 1 : 0), 0)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

    if (!scores.length) return ['fit'];

    return scores
        .slice(0, 3)
        .map(item => item.intent);
};

const formatTopic = (topic) => {
    const fact = PROFILE_FACTS[topic];
    if (!fact) return '';

    return [
        `Short answer: ${fact.summary}`,
        `Evidence:\n${fact.evidence.map(item => `- ${item}`).join('\n')}`,
        `Next step: ${fact.next}`
    ].join('\n\n');
};

const unknownReply = () => [
    'Short answer: I do not have a verified portfolio fact for that specific detail.',
    'Evidence: I can safely answer about Nirmalya\'s skills, education, featured projects, resume access, contact routes, GitHub/LeetCode direction, AI/ML learning, and cybersecurity-aware work.',
    'Next step: Contact Nirmalya directly at nirmalyaghosh2127@gmail.com for private, latest, or document-level details.'
].join('\n\n');

const fallbackReply = (question = '') => {
    const normalized = question.toLowerCase();
    if (/salary|ctc|gpa|cgpa|grade|marks|private|address|date of birth|dob|government|aadhaar|pan/.test(normalized)) {
        return unknownReply();
    }

    const intents = detectIntents(question);
    const sections = intents.map(formatTopic).filter(Boolean);
    const answer = sections.join('\n\n---\n\n');

    return `${answer}\n\nYou can also ask a sharper follow-up like: "Summarize him for a frontend internship", "What project should I review first?", or "How do I request the resume?"`;
};

const buildInstructions = () => `
You are Nirmalya Ghosh's recruiter-facing portfolio assistant.
Your audience is recruiters, hirers, collaborators, and visitors evaluating Nirmalya.
Be concise, confident, warm, and specific. Use only the profile context below. If asked for unknown facts, say you do not have that detail and suggest contacting Nirmalya.
Do not invent employers, grades, awards, private resume content, salary expectations, legal claims, or confidential information.
Guide recruiters toward evidence: GitHub, LinkedIn, LeetCode, resume gate, and contact options.
When useful, structure answers as "Short answer", "Evidence", and "Next step".

PROFILE CONTEXT:
${PROFILE_CONTEXT}
`;

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    let payload = request.body || {};
    if (!payload || typeof payload === 'string') {
        try {
            payload = typeof payload === 'string' ? JSON.parse(payload) : {};
        } catch (error) {
            return sendJson(response, 400, { error: 'Invalid request body.' });
        }
    }

    const messages = cleanMessages(payload.messages);
    const latestUserMessage = [...messages].reverse().find(message => message.role === 'user')?.content || '';

    if (!latestUserMessage.trim()) {
        return sendJson(response, 400, { error: 'Please ask a question first.' });
    }

    if (!process.env.OPENAI_API_KEY) {
        return sendJson(response, 200, {
            answer: fallbackReply(latestUserMessage),
            mode: 'portfolio-knowledge'
        });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 18000);
        const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: process.env.PROFILE_ASSISTANT_MODEL || 'gpt-4o-mini',
                instructions: buildInstructions(),
                input: messages.map(message => ({
                    role: message.role,
                    content: message.content
                })),
                max_output_tokens: 650
            }),
            signal: controller.signal
        });
        const data = await openAiResponse.json();
        clearTimeout(timeout);
        if (!openAiResponse.ok) {
            throw new Error(data?.error?.message || 'Assistant service failed.');
        }

        const answer = data.output_text
            || data.output?.flatMap(item => item.content || []).find(part => part.type === 'output_text')?.text
            || fallbackReply(latestUserMessage);

        return sendJson(response, 200, {
            answer,
            mode: 'ai'
        });
    } catch (error) {
        console.warn('Profile assistant OpenAI fallback:', error?.message || 'Unknown OpenAI error');
        return sendJson(response, 200, {
            answer: fallbackReply(latestUserMessage),
            mode: 'portfolio-knowledge',
            notice: 'Live AI is temporarily unavailable, so I answered from verified portfolio facts.'
        });
    }
};
