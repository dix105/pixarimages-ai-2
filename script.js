document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================
    // NAVIGATION & SCROLL
    // =========================================
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('header nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            menuToggle.textContent = nav.classList.contains('active') ? '✕' : '☰';
        });

        // Close menu when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });
    }

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // =========================================
    // SCROLL ANIMATIONS
    // =========================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));

    // =========================================
    // ACCORDION
    // =========================================
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');
            
            // Close all
            document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
            
            // Toggle clicked
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // =========================================
    // MODALS
    // =========================================
    function openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent bg scroll
        }
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    // Triggers
    document.querySelectorAll('[data-modal-target]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = btn.getAttribute('data-modal-target');
            openModal(id);
        });
    });

    // Close buttons
    document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-modal-close');
            closeModal(id);
        });
    });

    // Close on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // =========================================
    // API & REAL BACKEND INTEGRATION
    // =========================================

    // DOM Elements
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const previewImage = document.getElementById('preview-image');
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultContainer = document.getElementById('result-container'); // May not exist in HTML, handled safely
    const resultPlaceholder = document.getElementById('result-placeholder');
    const loadingState = document.getElementById('loading-state');
    const resultFinal = document.getElementById('result-final');
    const downloadBtn = document.getElementById('download-btn');

    // State
    let currentUploadedUrl = null;
    const USER_ID = 'DObRu1vyStbUynoQmTcHBlhs55z2'; // Hardcoded for this agent
    const EFFECT_ID = 'pixarStyle';
    const MODEL = 'image-effects';
    const TOOL_TYPE = 'image-effects';

    // --- HELPER FUNCTIONS ---

    // Generate nanoid for unique filename
    function generateNanoId(length = 21) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // UI Helpers
    function showLoading() {
        if (loadingState) loadingState.classList.remove('hidden');
        if (loadingState) loadingState.style.display = 'flex'; // Ensure flex layout
        if (resultPlaceholder) resultPlaceholder.classList.add('hidden');
        if (resultFinal) resultFinal.classList.add('hidden');
        
        // Hide existing video if it exists
        const vid = document.getElementById('result-video');
        if (vid) vid.style.display = 'none';
    }

    function hideLoading() {
        if (loadingState) loadingState.classList.add('hidden');
        if (loadingState) loadingState.style.display = 'none';
    }

    function updateStatus(text) {
        // Try to find a status text element, otherwise use the button
        const statusText = document.querySelector('#loading-state p') || document.getElementById('status-text');
        if (statusText) statusText.textContent = text;

        if (generateBtn) {
            if (text === 'READY') {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate';
            } else if (text === 'COMPLETE') {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate';
            } else if (text === 'ERROR') {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate';
            } else {
                // Processing states
                generateBtn.disabled = true;
                generateBtn.textContent = text;
            }
        }
    }

    function showError(msg) {
        alert('Error: ' + msg);
    }

    function showPreview(url) {
        if (previewImage) {
            previewImage.src = url;
            previewImage.classList.remove('hidden');
        }
        if (uploadZone) {
            const placeholder = uploadZone.querySelector('.placeholder-content');
            if (placeholder) placeholder.classList.add('hidden');
        }
        if (resetBtn) resetBtn.disabled = false;
    }

    function showDownloadButton(url) {
        if (downloadBtn) {
            downloadBtn.dataset.url = url;
            downloadBtn.disabled = false;
            downloadBtn.style.display = 'inline-block';
        }
    }

    function showResultMedia(url) {
        const container = resultFinal ? resultFinal.parentElement : document.querySelector('.result-area');
        if (!container) return;

        const isVideo = url.toLowerCase().match(/\.(mp4|webm)(\?.*)?$/i);

        if (isVideo) {
            if (resultFinal) resultFinal.classList.add('hidden');
            if (resultFinal) resultFinal.style.display = 'none';

            let video = document.getElementById('result-video');
            if (!video) {
                video = document.createElement('video');
                video.id = 'result-video';
                video.controls = true;
                video.autoplay = true;
                video.loop = true;
                video.className = resultFinal ? resultFinal.className : 'w-full h-auto rounded-lg';
                video.style.maxWidth = '100%';
                container.appendChild(video);
            }
            video.src = url;
            video.style.display = 'block';
            video.classList.remove('hidden');
        } else {
            const video = document.getElementById('result-video');
            if (video) video.style.display = 'none';

            if (resultFinal) {
                resultFinal.classList.remove('hidden');
                resultFinal.style.display = 'block';
                resultFinal.src = url + '?t=' + new Date().getTime();
            }
        }
    }

    // --- API FUNCTIONS ---

    // Upload file to CDN storage
    async function uploadFile(file) {
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const uniqueId = generateNanoId();
        const fileName = uniqueId + '.' + fileExtension;
        
        // Step 1: Get signed URL
        const signedUrlResponse = await fetch(
            'https://api.chromastudio.ai/get-emd-upload-url?fileName=' + encodeURIComponent(fileName),
            { method: 'GET' }
        );
        
        if (!signedUrlResponse.ok) {
            throw new Error('Failed to get signed URL: ' + signedUrlResponse.statusText);
        }
        
        const signedUrl = await signedUrlResponse.text();
        
        // Step 2: PUT file
        const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        
        if (!uploadResponse.ok) {
            throw new Error('Failed to upload file: ' + uploadResponse.statusText);
        }
        
        // Step 3: Return download URL
        const downloadUrl = 'https://contents.maxstudio.ai/' + fileName;
        return downloadUrl;
    }

    // Submit generation job
    async function submitImageGenJob(imageUrl) {
        const isVideo = 'image-effects' === 'video-effects'; // Config check
        const endpoint = isVideo ? 'https://api.chromastudio.ai/video-gen' : 'https://api.chromastudio.ai/image-gen';
        
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'sec-ch-ua-platform': '"Windows"',
            'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
            'sec-ch-ua-mobile': '?0'
        };

        let body = {};
        if (isVideo) {
            body = {
                imageUrl: [imageUrl],
                effectId: EFFECT_ID,
                userId: USER_ID,
                removeWatermark: true,
                model: 'video-effects',
                isPrivate: true
            };
        } else {
            body = {
                model: MODEL,
                toolType: TOOL_TYPE,
                effectId: EFFECT_ID,
                imageUrl: imageUrl,
                userId: USER_ID,
                removeWatermark: true,
                isPrivate: true
            };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit job: ' + response.statusText);
        }
        
        const data = await response.json();
        return data;
    }

    // Poll job status
    const POLL_INTERVAL = 2000;
    const MAX_POLLS = 60;

    async function pollJobStatus(jobId) {
        const isVideo = 'image-effects' === 'video-effects';
        const baseUrl = isVideo ? 'https://api.chromastudio.ai/video-gen' : 'https://api.chromastudio.ai/image-gen';
        let polls = 0;
        
        while (polls < MAX_POLLS) {
            const response = await fetch(
                `${baseUrl}/${USER_ID}/${jobId}/status`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, text/plain, */*'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to check status: ' + response.statusText);
            }
            
            const data = await response.json();
            
            if (data.status === 'completed') {
                return data;
            }
            
            if (data.status === 'failed' || data.status === 'error') {
                throw new Error(data.error || 'Job processing failed');
            }
            
            updateStatus('PROCESSING... (' + (polls + 1) + ')');
            
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            polls++;
        }
        
        throw new Error('Job timed out');
    }

    // --- EVENT HANDLERS ---

    // Handle File Selection (Auto Upload)
    async function handleFileSelect(file) {
        if (!file) return;

        // Reset UI partially
        if (resultFinal) resultFinal.classList.add('hidden');
        if (resultPlaceholder) resultPlaceholder.classList.remove('hidden');
        const vid = document.getElementById('result-video');
        if (vid) vid.style.display = 'none';

        try {
            // Show preview immediately using local file for UX, but disable Generate until upload done
            const reader = new FileReader();
            reader.onload = (e) => {
                showPreview(e.target.result);
            };
            reader.readAsDataURL(file);

            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'UPLOADING...';
            }
            
            // Perform actual upload
            const uploadedUrl = await uploadFile(file);
            currentUploadedUrl = uploadedUrl;
            
            // Confirm upload success
            updateStatus('READY');
            
        } catch (error) {
            updateStatus('ERROR');
            showError(error.message);
            // Reset preview on failure
            if (previewImage) previewImage.classList.add('hidden');
            if (uploadZone) uploadZone.querySelector('.placeholder-content').classList.remove('hidden');
        }
    }

    // Handle Generate Click
    async function handleGenerate() {
        if (!currentUploadedUrl) {
            alert('Please upload an image first.');
            return;
        }
        
        try {
            showLoading();
            updateStatus('SUBMITTING JOB...');
            
            // 1. Submit
            const jobData = await submitImageGenJob(currentUploadedUrl);
            
            updateStatus('JOB QUEUED...');
            
            // 2. Poll
            const result = await pollJobStatus(jobData.jobId);
            
            // 3. Extract Result
            const resultItem = Array.isArray(result.result) ? result.result[0] : result.result;
            const resultUrl = resultItem?.mediaUrl || resultItem?.video || resultItem?.image;
            
            if (!resultUrl) {
                throw new Error('No image URL in response');
            }
            
            currentUploadedUrl = resultUrl; // For download logic if needed
            
            // 4. Show Result
            showResultMedia(resultUrl);
            showDownloadButton(resultUrl);
            
            updateStatus('COMPLETE');
            hideLoading();
            
        } catch (error) {
            hideLoading();
            updateStatus('ERROR');
            showError(error.message);
            if (resultPlaceholder) resultPlaceholder.classList.remove('hidden');
        }
    }

    // --- WIRING LISTENERS ---

    // File Input
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFileSelect(file);
        });
    }

    // Drag & Drop
    if (uploadZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        uploadZone.addEventListener('dragover', () => {
            uploadZone.classList.add('drag-over'); // Ensure CSS supports this or it does nothing, harmless
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });

        uploadZone.addEventListener('drop', (e) => {
            uploadZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect(file);
        });

        uploadZone.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }

    // Generate Button
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerate);
        generateBtn.disabled = true; // Disabled initially
    }

    // Reset Button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentUploadedUrl = null;
            if (fileInput) fileInput.value = '';
            if (previewImage) {
                previewImage.src = '';
                previewImage.classList.add('hidden');
            }
            if (uploadZone) {
                const ph = uploadZone.querySelector('.placeholder-content');
                if (ph) ph.classList.remove('hidden');
            }
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Generate';
            }
            if (resetBtn) resetBtn.disabled = true;
            if (downloadBtn) {
                downloadBtn.disabled = true;
                // Don't hide completely if layout depends on it, but prompt says reset UI
            }
            
            if (resultFinal) {
                resultFinal.classList.add('hidden');
                resultFinal.src = '';
            }
            const vid = document.getElementById('result-video');
            if (vid) vid.style.display = 'none';
            
            if (resultPlaceholder) resultPlaceholder.classList.remove('hidden');
            hideLoading();
        });
    }

    // Download Button - Robust Implementation
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = downloadBtn.dataset.url;
            if (!url) return;
            
            const originalText = downloadBtn.textContent;
            downloadBtn.textContent = 'Downloading...';
            downloadBtn.disabled = true;
            
            function downloadBlob(blob, filename) {
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            }
            
            function getExtension(url, contentType) {
                if (contentType) {
                    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
                    if (contentType.includes('png')) return 'png';
                    if (contentType.includes('webp')) return 'webp';
                    if (contentType.includes('mp4')) return 'mp4';
                    if (contentType.includes('webm')) return 'webm';
                }
                const match = url.match(/\.(jpe?g|png|webp|mp4|webm)/i);
                return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'png';
            }
            
            try {
                // STRATEGY 1: Proxy
                const proxyUrl = 'https://api.chromastudio.ai/download-proxy?url=' + encodeURIComponent(url);
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error('Proxy failed');
                
                const blob = await response.blob();
                const ext = getExtension(url, response.headers.get('content-type'));
                downloadBlob(blob, 'pixar_result_' + generateNanoId(8) + '.' + ext);
                
            } catch (proxyErr) {
                console.warn('Proxy download failed, trying direct:', proxyErr);
                
                // STRATEGY 2: Direct Fetch
                try {
                    const fetchUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
                    const response = await fetch(fetchUrl, { mode: 'cors' });
                    
                    if (response.ok) {
                        const blob = await response.blob();
                        const ext = getExtension(url, response.headers.get('content-type'));
                        downloadBlob(blob, 'pixar_result_' + generateNanoId(8) + '.' + ext);
                        return;
                    }
                    throw new Error('Direct fetch failed');
                } catch (fetchErr) {
                    console.warn('Direct fetch failed:', fetchErr);
                    
                    // STRATEGY 3: Fail Gracefully
                    alert('Download failed due to browser security restrictions. Please right-click the result image and select "Save Image As".');
                }
            } finally {
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            }
        });
    }

    // Initial state check
    if (fileInput && fileInput.value) {
        fileInput.value = ''; // Reset on load
    }
});