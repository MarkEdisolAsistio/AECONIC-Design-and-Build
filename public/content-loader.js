document.addEventListener("DOMContentLoaded", async () => {
    // Fetch your dynamic content from your server
    const response = await fetch('/api/content');
    const data = await response.json();

    // Reusable utility function to cleanly look for and build video player DOM nodes
    function createVideoPlayer(videoPath) {
        if (!videoPath) return '';
        return `
            <div style="margin-top:20px; background:#000; border-radius:8px; overflow:hidden;">
                <video src="${videoPath}" controls style="width:100%; display:block; max-height:500px;"></video>
            </div>`;
    }

    // Helper function to convert raw 'YYYY-MM-DD' values into a clean formatted text date stamp
    function formatDateString(rawDateStr) {
        if (!rawDateStr) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const dateObj = new Date(rawDateStr);
        return `<p class="item-post-date" style="font-size: 13px; color: #6b7280; font-style: italic; margin-top: -5px; margin-bottom: 15px; text-align: left;">Published: ${dateObj.toLocaleDateString('en-US', options)}</p>`;
    }

    // Capture the primary layout mounting box area injected across your public pages
    const mainContainer = document.querySelector(".content-container");

    // ========================================================
    // 0. DYNAMIC HOMEPAGE MOUNT ROUTE VALIDATOR
    // ========================================================
    const homeDynamicBox = document.querySelector(".home-projects-dynamic-box");
    if (homeDynamicBox && data.projects) {
        homeDynamicBox.innerHTML = ""; 

        const topThreeHomeProjects = [...data.projects].reverse().slice(0, 3);

        topThreeHomeProjects.forEach(project => {
            const projectCardLink = document.createElement("a");
            projectCardLink.href = `projects.html#project${project.id}`;
            projectCardLink.className = "preview-item";
            
            let cleanString = project.desc.replace(/<\/?[^>]+(>|$)/g, "");
            const imgTagMatch = project.desc.match(/<img[^>]+src="([^">]+)"/);
            let thumbnailStyle = '';
            
            if (imgTagMatch && imgTagMatch[1]) {
                thumbnailStyle = `background-image: url('${imgTagMatch[1]}'); background-size: cover; background-position: center;`;
            } else {
                thumbnailStyle = `background-color: #1c1917;`; 
            }

            projectCardLink.innerHTML = `
                <div class="preview-thumbnail" style="${thumbnailStyle}"></div>
                <div class="preview-text">
                    <span class="preview-title" style="font-weight: bold; color: #1c1917; font-size: 16px; margin-top: 4px; display: block;">${project.title}</span>
                    <span class="preview-desc" style="color: #57534e; font-size: 13px; margin-top: 4px; display: block; line-height: 1.4;">${cleanString.substring(0, 75)}...</span>
                </div>
            `;
            homeDynamicBox.appendChild(projectCardLink);
        });
    }

    if (mainContainer) {
        const currentPath = window.location.pathname;

        const heading = mainContainer.querySelector("h1");
        const subHeading = mainContainer.querySelector(".page-subtitle"); 
        
        function setupMainHeader() {
            mainContainer.innerHTML = "";
            if (heading) mainContainer.appendChild(heading);
            if (subHeading) mainContainer.appendChild(subHeading);
        }

        // Logic for specific pages - Updated route and layout key match fields for Services tracking
        const pageRoutes = [
            { path: "projects.html", key: "projects", class: "project-section", idPrefix: "project" },
            { path: "about-story.html", key: "story", class: "project-section", idPrefix: "story" },
            { path: "about-services.html", key: "services", class: "project-section", idPrefix: "service" },
            { path: "about-awards.html", key: "awards", class: "award-section", idPrefix: "award" },
            { path: "news-updates.html", key: "news", class: "news-section", idPrefix: "news" },
            { path: "blog-articles.html", key: "blogs", class: "blog-section", idPrefix: "blog" },
            { path: "news-events.html", key: "events", class: "event-section", idPrefix: "event" },
            { path: "careers.html", key: "careers", class: "career-section", idPrefix: "career" }
        ];

        const route = pageRoutes.find(r => currentPath.includes(r.path));

        if (route && data[route.key]) {
            setupMainHeader();
            
            // Check if there is a target layout grid wrapper on the page template
            const gridTarget = document.querySelector('.services-feed-grid');
            
            [...data[route.key]].reverse().forEach(item => {
                const article = document.createElement("article");
                article.id = `${route.idPrefix}${item.id}`;
                article.className = route.class;

                article.innerHTML = `
                    <h2>${item.title}</h2>
                    ${formatDateString(item.itemDate)}
                    <div class="rich-content-view" style="margin-top:15px; font-family: inherit; line-height:1.6; text-align: left;">
                        ${item.desc}
                    </div>
                    ${createVideoPlayer(item.videoPath)}
                `;
                
                // If the feed grid exists, drop it there; otherwise drop inside the main container natively
                if (gridTarget) {
                    gridTarget.appendChild(article);
                } else {
                    mainContainer.appendChild(article);
                }
            });
        }
    }

    // ========================================================
    // HORIZONTAL NAVIGATION DROPDOWN MENU MODULE
    // ========================================================
    const previewMenu = document.querySelector(".project-preview-menu");
    if (previewMenu && data.projects) {
        previewMenu.innerHTML = ""; 
        const itemsWrapper = document.createElement("div");
        itemsWrapper.className = "dropdown-items-container";
        const latestThreeProjects = [...data.projects].reverse().slice(0, 3);

        latestThreeProjects.forEach(project => {
            const previewLink = document.createElement("a");
            previewLink.href = `projects.html#project${project.id}`;
            previewLink.className = "preview-item";
            let cleanString = project.desc.replace(/<\/?[^>]+(>|$)/g, "");
            const imgTagMatch = project.desc.match(/<img[^>]+src="([^">]+)"/);
            let thumbnailStyle = imgTagMatch ? `background-image: url('${imgTagMatch[1]}');` : '';

            previewLink.innerHTML = `
                <div class="preview-thumbnail" style="${thumbnailStyle}"></div>
                <div class="preview-text">
                    <span class="preview-title">${project.title}</span>
                    <span class="preview-desc">${cleanString.substring(0, 60)}...</span>
                </div>
            `;
            itemsWrapper.appendChild(previewLink);
        });

        previewMenu.appendChild(itemsWrapper);
        previewMenu.innerHTML += `<div class="dropdown-footer"><a href="projects.html" class="see-more-btn">See More Projects →</a></div>`;
    }

    // ========================================================
    // NEWSLETTER AJAX FORM SUBMISSION MODULE
    // ========================================================
    const newsletterForm = document.getElementById("newsletterForm");
    
    if (newsletterForm) {
        const successMessage = document.getElementById("newsletterSuccess");
        const submitBtn = document.getElementById("newsletterBtn");

        newsletterForm.addEventListener("submit", async function(event) {
            event.preventDefault(); 
            
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = "Sending...";
            submitBtn.disabled = true;

            const emailValue = document.getElementById("newsletterEmail").value;

            try {
                const fetchResponse = await fetch(newsletterForm.action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailValue })
                });

                if (fetchResponse.ok) {
                    successMessage.style.display = "block";
                    newsletterForm.reset();
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                    setTimeout(() => { successMessage.style.display = "none"; }, 5000);
                } else {
                    alert("Oops! There was a problem saving your email.");
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                alert("Network error. Please make sure the server is running.");
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});