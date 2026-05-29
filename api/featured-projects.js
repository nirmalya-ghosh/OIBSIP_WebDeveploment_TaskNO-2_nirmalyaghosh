const {
    sendJson,
    supabaseFetch
} = require('./_resume-access');

const normalizeProject = (project) => ({
    id: project.id,
    title: project.title,
    shortDescription: project.short_description,
    thumbnailUrl: project.thumbnail_url,
    imageAlt: project.image_alt,
    demoType: project.demo_type,
    demoLabel: project.demo_label,
    demoUrl: project.demo_url,
    githubUrl: project.github_url,
    displayOrder: project.display_order,
    published: project.published,
    category: project.category,
    techStack: project.tech_stack || [],
    projectStatus: project.project_status,
    projectRole: project.project_role,
    problemSolved: project.problem_solved,
    highlights: project.highlights || [],
    featuredBadge: project.featured_badge,
    projectDate: project.project_date,
    slug: project.slug,
    isPinned: project.is_pinned,
    createdAt: project.created_at
});

module.exports = async (request, response) => {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    const url = new URL(request.url, `https://${request.headers.host || 'localhost'}`);
    const limit = Math.min(24, Math.max(1, Number(url.searchParams.get('limit')) || 24));

    try {
        let rows;
        try {
            rows = await supabaseFetch(
                `featured_projects?published=eq.true&select=id,title,short_description,thumbnail_url,image_alt,demo_type,demo_label,demo_url,github_url,display_order,published,category,tech_stack,project_status,project_role,problem_solved,highlights,featured_badge,project_date,slug,is_pinned,created_at&order=is_pinned.desc,display_order.asc,created_at.desc&limit=${limit}`,
                { method: 'GET' }
            );
        } catch (error) {
            rows = await supabaseFetch(
                `featured_projects?published=eq.true&select=id,title,short_description,thumbnail_url,demo_type,demo_url,github_url,display_order,published,created_at&order=display_order.asc,created_at.desc&limit=${limit}`,
                { method: 'GET' }
            );
        }

        return sendJson(response, 200, {
            ok: true,
            projects: (rows || []).map(normalizeProject)
        });
    } catch (error) {
        return sendJson(response, 502, { error: error.message || 'Featured projects could not be loaded.' });
    }
};
