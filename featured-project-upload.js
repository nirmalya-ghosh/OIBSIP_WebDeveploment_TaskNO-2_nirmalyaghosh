document.addEventListener('DOMContentLoaded', async () => {
    const fallbackConfig = {
        supabaseUrl: 'https://jpoxbkrzffwtfevbbgxq.supabase.co',
        supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwb3hia3J6ZmZ3dGZldmJiZ3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MzA4NzgsImV4cCI6MjA5NDUwNjg3OH0.FB_8ZmxwKbsZ4idLj0aBiHtfo2Lzpy1HH3-wI_jm6rI'
    };
    const form = document.getElementById('featured-project-upload-form');
    const fileInput = document.getElementById('project-thumbnail');
    const cropImage = document.getElementById('project-crop-image');
    const fileName = document.getElementById('project-thumbnail-name');
    const status = document.getElementById('admin-project-status');
    const uploadAuthStatus = document.getElementById('upload-auth-status');
    const submitButton = form?.querySelector('button[type="submit"]');
    const resetButton = form?.querySelector('button[type="reset"]');
    const previewThumb = document.getElementById('preview-thumb');
    const previewTitle = document.getElementById('preview-title');
    const previewDescription = document.getElementById('preview-description');
    const previewBadge = document.getElementById('preview-badge');
    const previewTech = document.getElementById('preview-tech');
    const saveNextDialog = document.getElementById('admin-save-next');
    const addAnotherButton = document.getElementById('admin-add-another');
    const viewFeaturedButton = document.getElementById('admin-view-featured');
    const cropButtons = [...document.querySelectorAll('[data-crop-action]')];
    const cropAspectButtons = [...document.querySelectorAll('[data-crop-aspect]')];
    const cropZoom = document.getElementById('project-crop-zoom');
    let cropper = null;
    let supabaseClient = null;
    let session = null;
    let adminSessionToken = sessionStorage.getItem('featuredProjectAdminSession') || '';
    let cropScaleX = 1;
    let cropScaleY = 1;
    let cropPreviewFrame = 0;

    if (!form || !fileInput || !cropImage || !status || !submitButton) return;

    const field = (name) => form.elements.namedItem(name);
    const fields = {
        title: field('title'),
        shortDescription: field('shortDescription'),
        category: field('category'),
        techStack: field('techStack'),
        projectStatus: field('projectStatus'),
        projectRole: field('projectRole'),
        problemSolved: field('problemSolved'),
        highlights: field('highlights'),
        imageAlt: field('imageAlt'),
        demoType: field('demoType'),
        demoLabel: field('demoLabel'),
        demoUrl: field('demoUrl'),
        githubUrl: field('githubUrl'),
        displayOrder: field('displayOrder'),
        projectDate: field('projectDate'),
        featuredBadge: field('featuredBadge'),
        slug: field('slug'),
        isPinned: field('isPinned'),
        published: field('published')
    };

    const setStatus = (message, state = '') => {
        status.textContent = message;
        status.dataset.state = state;
    };

    const setUploadStatus = (message, state = '') => {
        if (!uploadAuthStatus) return;
        uploadAuthStatus.textContent = message;
        uploadAuthStatus.dataset.state = state;
    };

    const closeSaveNextDialog = () => {
        if (!saveNextDialog) return;
        saveNextDialog.hidden = true;
        document.body.classList.remove('admin-save-next-open');
    };

    const openSaveNextDialog = () => {
        if (!saveNextDialog) {
            window.location.href = 'featured-projects.html';
            return;
        }
        saveNextDialog.hidden = false;
        document.body.classList.add('admin-save-next-open');
        addAnotherButton?.focus();
    };

    const setFormEnabled = (enabled) => {
        [...form.elements].forEach(element => {
            element.disabled = !enabled;
        });
        submitButton.disabled = !enabled;
        setCropControlsEnabled(enabled && Boolean(cropper));
    };

    const setCropControlsEnabled = (enabled) => {
        [...cropButtons, ...cropAspectButtons].forEach(button => {
            button.disabled = !enabled;
        });
        if (cropZoom) cropZoom.disabled = !enabled;
    };

    const syncZoomSlider = () => {
        if (!cropper || !cropZoom) return;
        const imageData = cropper.getImageData();
        const naturalWidth = imageData?.naturalWidth || imageData?.width || 1;
        const currentWidth = imageData?.width || naturalWidth;
        const zoomLevel = Math.min(3, Math.max(0.35, currentWidth / naturalWidth));
        cropZoom.value = zoomLevel.toFixed(2);
    };

    const fitCropToWholeImage = () => {
        if (!cropper) return;
        const imageData = cropper.getImageData();
        const naturalWidth = imageData?.naturalWidth || imageData?.width || 0;
        const naturalHeight = imageData?.naturalHeight || imageData?.height || 0;
        if (!naturalWidth || !naturalHeight) return;

        cropper.setAspectRatio(NaN);
        cropper.setData({
            x: 0,
            y: 0,
            width: naturalWidth,
            height: naturalHeight,
            rotate: 0,
            scaleX: cropScaleX,
            scaleY: cropScaleY
        });
        syncZoomSlider();
        renderCroppedPreview();
    };

    const renderCroppedPreview = () => {
        if (!cropper || !previewThumb || cropPreviewFrame) return;
        cropPreviewFrame = window.requestAnimationFrame(() => {
            cropPreviewFrame = 0;
            if (!cropper) return;
            const canvas = cropper.getCroppedCanvas({
                maxWidth: 720,
                maxHeight: 720,
                imageSmoothingQuality: 'high'
            });
            if (!canvas) return;
            previewThumb.innerHTML = `<img src="${canvas.toDataURL('image/jpeg', 0.82)}" alt="">`;
            previewThumb.classList.add('has-image');
        });
    };

    setFormEnabled(false);

    const requireVerification = (message) => {
        setFormEnabled(false);
        setUploadStatus(message, 'error');
        window.setTimeout(() => {
            window.location.href = 'featured-project-admin.html';
        }, 1400);
    };

    const loadPublicConfig = async () => {
        try {
            const configResponse = await fetch('/api/public-config', {
                cache: 'no-store'
            });
            if (!configResponse.ok) throw new Error('Config endpoint unavailable.');

            const config = await configResponse.json();
            return {
                supabaseUrl: config.supabaseUrl || fallbackConfig.supabaseUrl,
                supabaseAnonKey: config.supabaseAnonKey || fallbackConfig.supabaseAnonKey
            };
        } catch (_) {
            return fallbackConfig;
        }
    };

    try {
        const config = await loadPublicConfig();
        if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase) {
            throw new Error('Secure upload sign-in is not configured.');
        }

        supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
        const result = await supabaseClient.auth.getSession();
        session = result.data.session;

        const expiresAt = Number(sessionStorage.getItem('featuredProjectAdminSessionExpiresAt') || 0);
        if (!session?.access_token) {
            requireVerification('No Supabase admin session found. Returning to verification...');
            return;
        }

        if (!adminSessionToken || Date.now() >= expiresAt) {
            requireVerification('Admin upload verification expired. Returning to verification...');
            return;
        }

        const identityResponse = await fetch('/api/admin-project-session', {
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        });
        if (!identityResponse.ok) {
            requireVerification('Only admin has access to upload projects. Returning to verification...');
            return;
        }

        setFormEnabled(true);
        setUploadStatus('Upload workspace unlocked.', 'success');
    } catch (error) {
        requireVerification(error.message || 'Verification check failed. Returning to verification...');
        return;
    }

    fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        if (fileName) fileName.textContent = file.name;

        const reader = new FileReader();
        reader.onload = () => {
            cropImage.src = reader.result;
            cropImage.parentElement.classList.add('has-image');
            if (cropper) cropper.destroy();
            cropScaleX = 1;
            cropScaleY = 1;
            cropper = new Cropper(cropImage, {
                aspectRatio: NaN,
                viewMode: 0,
                dragMode: 'move',
                autoCropArea: 1,
                background: false,
                movable: true,
                cropBoxMovable: true,
                cropBoxResizable: true,
                responsive: true,
                rotatable: true,
                scalable: true,
                zoomable: true,
                zoomOnWheel: true,
                minCropBoxWidth: 1,
                minCropBoxHeight: 1,
                toggleDragModeOnDblclick: true,
                ready: () => {
                    setCropControlsEnabled(true);
                    fitCropToWholeImage();
                },
                crop: renderCroppedPreview,
                cropend: renderCroppedPreview,
                zoom: () => {
                    window.requestAnimationFrame(syncZoomSlider);
                    renderCroppedPreview();
                }
            });

            if (previewThumb) {
                previewThumb.innerHTML = `<img src="${reader.result}" alt="">`;
                previewThumb.classList.add('has-image');
            }
        };
        reader.readAsDataURL(file);
    });

    cropAspectButtons.forEach(button => {
        button.addEventListener('click', () => {
            cropAspectButtons.forEach(item => item.classList.toggle('is-active', item === button));
            if (cropper) {
                cropper.setAspectRatio(NaN);
                cropper.crop();
                renderCroppedPreview();
            }
        });
    });

    cropButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!cropper) return;
            const action = button.dataset.cropAction;
            if (action === 'zoom-in') cropper.zoom(0.1);
            if (action === 'zoom-out') cropper.zoom(-0.1);
            if (action === 'rotate-left') cropper.rotate(-90);
            if (action === 'rotate-right') cropper.rotate(90);
            if (action === 'flip-horizontal') {
                cropScaleX *= -1;
                cropper.scaleX(cropScaleX);
            }
            if (action === 'flip-vertical') {
                cropScaleY *= -1;
                cropper.scaleY(cropScaleY);
            }
            if (action === 'fit-image') {
                fitCropToWholeImage();
            }
            if (action === 'reset') {
                cropScaleX = 1;
                cropScaleY = 1;
                cropper.reset();
                fitCropToWholeImage();
            }
            syncZoomSlider();
            renderCroppedPreview();
        });
    });

    cropZoom?.addEventListener('input', () => {
        if (!cropper) return;
        cropper.zoomTo(Number(cropZoom.value) || 1);
        renderCroppedPreview();
    });

    const getCroppedThumbnail = () => {
        if (!cropper) return '';
        return cropper
            .getCroppedCanvas({
                maxWidth: 1600,
                maxHeight: 1600,
                imageSmoothingQuality: 'high'
            })
            .toDataURL('image/jpeg', 0.86);
    };

    const splitList = (value = '') => String(value || '')
        .split(/[\n,•|]/)
        .map(item => item.trim())
        .filter(Boolean);

    const updateCounters = () => {
        document.querySelectorAll('[data-counter-for]').forEach(counter => {
            const field = document.getElementById(counter.dataset.counterFor);
            if (!field) return;
            counter.textContent = `${field.value.length} / ${field.maxLength}`;
        });
    };

    const slugify = (value = '') => String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 96);

    const updatePreview = () => {
        if (previewTitle) previewTitle.textContent = fields.title.value.trim() || 'Project title';
        if (previewDescription) {
            previewDescription.textContent = fields.shortDescription.value.trim() || 'Your project summary will appear here while you type.';
        }
        if (previewBadge) {
            previewBadge.textContent = fields.featuredBadge.value.trim() || fields.category.value.trim() || 'Featured';
        }
        if (previewTech) {
            const tech = splitList(fields.techStack.value).slice(0, 4);
            previewTech.innerHTML = tech.length
                ? tech.map(item => `<span>${item.replace(/[<>&"]/g, '')}</span>`).join('')
                : '<span>Tech stack</span>';
        }
    };

    form.addEventListener('input', event => {
        if (event.target === fields.title && !fields.slug.dataset.touched) {
            fields.slug.value = slugify(fields.title.value);
        }
        if (event.target === fields.slug) {
            fields.slug.dataset.touched = 'true';
            fields.slug.value = slugify(fields.slug.value);
        }
        updateCounters();
        updatePreview();
    });

    form.addEventListener('reset', () => {
        window.setTimeout(() => {
            cropImage.removeAttribute('src');
            cropImage.parentElement.classList.remove('has-image');
            if (fileName) fileName.textContent = 'PNG, JPG, or WebP. Free crop enabled.';
            if (previewThumb) {
                previewThumb.innerHTML = '<i class="fas fa-image"></i>';
                previewThumb.classList.remove('has-image');
            }
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            cropScaleX = 1;
            cropScaleY = 1;
            if (cropZoom) cropZoom.value = '1';
            setCropControlsEnabled(false);
            fields.slug.dataset.touched = '';
            setStatus('');
            updateCounters();
            updatePreview();
        }, 0);
    });

    updateCounters();
    updatePreview();

    addAnotherButton?.addEventListener('click', () => {
        closeSaveNextDialog();
        form.reset();
        fields.title?.focus();
    });

    viewFeaturedButton?.addEventListener('click', () => {
        window.location.href = 'featured-projects.html';
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();

        if (!session?.access_token || !adminSessionToken) {
            requireVerification('Verification missing. Returning to secure gate...');
            return;
        }

        const thumbnailDataUrl = getCroppedThumbnail();
        if (!thumbnailDataUrl) {
            setStatus('Please upload and crop a thumbnail first.', 'error');
            return;
        }

        const payload = {
            thumbnailDataUrl,
            title: fields.title.value.trim(),
            shortDescription: fields.shortDescription.value.trim(),
            category: fields.category.value.trim(),
            techStack: splitList(fields.techStack.value),
            projectStatus: fields.projectStatus.value,
            projectRole: fields.projectRole.value.trim(),
            problemSolved: fields.problemSolved.value.trim(),
            highlights: splitList(fields.highlights.value),
            imageAlt: fields.imageAlt.value.trim(),
            demoType: fields.demoType.value,
            demoLabel: fields.demoLabel.value.trim(),
            demoUrl: fields.demoUrl.value.trim(),
            githubUrl: fields.githubUrl.value.trim(),
            displayOrder: Number(fields.displayOrder.value) || 100,
            projectDate: fields.projectDate.value,
            featuredBadge: fields.featuredBadge.value.trim(),
            slug: fields.slug.value.trim(),
            isPinned: fields.isPinned.checked,
            published: fields.published.checked
        };

        submitButton.disabled = true;
        if (resetButton) resetButton.disabled = true;
        setStatus('Saving project securely...', 'loading');

        try {
            const response = await fetch('/api/admin-featured-projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                    'X-Admin-Session': adminSessionToken
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result?.error || 'Project could not be saved.');

            setStatus(result?.warning || 'Project saved. Published work is live on the Featured Projects page.', result?.warning ? 'warning' : 'success');
            openSaveNextDialog();
        } catch (error) {
            setStatus(error.message || 'Project could not be saved.', 'error');
        } finally {
            submitButton.disabled = false;
            if (resetButton) resetButton.disabled = false;
        }
    });
});
