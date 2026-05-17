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
Project surfaces: GitHub repositories, LinkedIn project/activity updates, LeetCode progress.
Availability: open for internships, projects, collaborations, research ideas, AI/ML, software engineering, intelligent web products, and cybersecurity-aware development.
Contact: email nirmalyaghosh2127@gmail.com, phone +91 8967836222, LinkedIn https://www.linkedin.com/in/nirmalya-ghosh-422569377/, GitHub https://github.com/nirmalya-ghosh, WhatsApp https://wa.me/918967836222.
Resume access: the website has a secure resume gate with email OTP and owner approval. Recruiters should use the Resume button on the portfolio to request access.
`;

const QUICK_TOPICS = {
    hire: 'Nirmalya is a strong early-career candidate for internships where fast learning, fundamentals, and product-minded engineering matter. Emphasize AI/ML learning, DSA practice, web development, security-aware thinking, and willingness to grow through real work.',
    skills: 'Core strengths include Java, Python, C, JavaScript, HTML, CSS, React, Node.js, Express.js, REST APIs, MySQL, MongoDB, Git/GitHub, Linux, Docker basics, Android development, and AI/ML foundations.',
    projects: 'The portfolio points recruiters toward GitHub repositories, LinkedIn project updates, and LeetCode progress. For specific code evidence, direct them to GitHub: https://github.com/nirmalya-ghosh.',
    contact: 'Best contact routes: email nirmalyaghosh2127@gmail.com, LinkedIn profile, phone +91 8967836222, or WhatsApp link on the site.'
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

const fallbackReply = (question = '') => {
    const normalized = question.toLowerCase();
    let answer = QUICK_TOPICS.hire;

    if (/skill|stack|language|technology|tech/.test(normalized)) answer = QUICK_TOPICS.skills;
    if (/project|github|repo|work|portfolio/.test(normalized)) answer = QUICK_TOPICS.projects;
    if (/contact|email|phone|linkedin|whatsapp|reach/.test(normalized)) answer = QUICK_TOPICS.contact;
    if (/resume|cv/.test(normalized)) {
        answer = 'Nirmalya keeps resume access protected. Use the Resume button on the portfolio, verify your email with OTP, and wait for owner approval. Once approved, the secure viewer opens automatically.';
    }
    if (/education|college|university|kiit|degree/.test(normalized)) {
        answer = "Nirmalya is pursuing B.Tech in Computer Science / Information Technology at KIIT, Bhubaneswar, for the 2025-2029 academic path. His coursework and roadmap focus on DSA, OOP, web technologies, DBMS, networks, AI/ML learning, and software engineering fundamentals.";
    }

    return `${answer}\n\nSuggested next step: ask about his best-fit internship roles, technical stack, project evidence, or how to contact him.`;
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
        const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: process.env.PROFILE_ASSISTANT_MODEL || 'gpt-5-mini',
                instructions: buildInstructions(),
                input: messages.map(message => ({
                    role: message.role,
                    content: message.content
                })),
                max_output_tokens: 650
            })
        });

        const data = await openAiResponse.json();
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
        return sendJson(response, 200, {
            answer: fallbackReply(latestUserMessage),
            mode: 'portfolio-knowledge',
            notice: 'Live AI is temporarily unavailable, so I answered from verified portfolio facts.'
        });
    }
};
