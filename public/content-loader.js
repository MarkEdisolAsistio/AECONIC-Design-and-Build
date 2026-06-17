document.addEventListener("DOMContentLoaded", async () => {
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
    // 0. DYNAMIC HOMEPAGE MOUNT ROUTE VALIDATOR (index.html / webpage.html / root)
    // ========================================================
    const homeDynamicBox = document.querySelector(".home-projects-dynamic-box");
    if (homeDynamicBox && data.projects) {
        homeDynamicBox.innerHTML = ""; 

        // Take the top 3 latest database array entries exactly like the navbar dropdown layout matrix
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
                thumbnailStyle = `background-color: #1c1917;`; // Flat dark fallback block if no asset image exists
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

        // --- PRESERVATION SYSTEM ---
        const heading = mainContainer.querySelector("h1");
        const subHeading = mainContainer.querySelector(".page-subtitle"); 
        
        function setupMainHeader() {
            mainContainer.innerHTML = "";
            if (heading) mainContainer.appendChild(heading);
            if (subHeading) mainContainer.appendChild(subHeading);
        }

        // ========================================================
        // 1. PROJECTS WEBPAGE (projects.html)
        // ========================================================
        if (currentPath.includes("projects.html") && data.projects) {
            setupMainHeader();

            [...data.projects].reverse().forEach(project => {
                const article = document.createElement("article");
                article.id = `project${project.id}`;
                article.className = "project-section";

                article.innerHTML = `
                    <h2>${project.title}</h2>
                    ${formatDateString(project.itemDate)}
                    <div class="rich-content-view" style="margin-top:15px; font-family: inherit; line-height:1.6; text-align: left;">
                        ${project.desc}
                    </div>
                    ${createVideoPlayer(project.videoPath)}
                `;
                mainContainer.appendChild(article);
            });
        }

        // ========================================================
        // 2. OUR STORY WEBPAGE (about-story.html) - MULTIPLE CONTENT FEEDS LIST MATCH
        // ========================================================
        else if (currentPath.includes("about-story.html") && data.story) {
            setupMainHeader();

            [...data.story].reverse().forEach(storyItem => {
                const article = document.createElement("article");
                article.id = `story${storyItem.id}`;
                article.className = "project-section"; 

                article.innerHTML = `
                    <h2>${storyItem.title}</h2>
                    ${formatDateString(storyItem.itemDate)}
                    <div class="rich-content-view" style="margin-top:15px; font-family: inherit; line-height:1.6; text-align: left;">
                        ${storyItem.desc}
                    </div>
                    ${createVideoPlayer(storyItem.videoPath)}
                `;
                mainContainer.appendChild(article);
            });
        }

        // ========================================================
        // 3. CORE VALUES WEBPAGE (about-values.html) - MULTIPLE CONTENT FEEDS LIST MATCH
        // ========================================================
        else if (currentPath.includes("about-values.html") && data.values) {
            setupMainHeader();

            [...data.values].reverse().forEach(valueItem => {
                const article = document.createElement("article");
                article.id = `value${valueItem.id}`;
                article.className = "project-section"; 

                article.innerHTML = `
                    <h2>${valueItem.title}</h2>
                    ${formatDateString(valueItem.itemDate)}
                    <div class="rich-content-view" style="margin-top:15px; font-family: inherit; line-height:1.6; text-align: left;">
                        ${valueItem.desc}
                    </div>
                    ${createVideoPlayer(valueItem.videoPath)}
                `;
                mainContainer.appendChild(article);
            });
        }

        // ========================================================
        // 4. AWARDS WEBPAGE (about-awards.html)
        // ========================================================
        else if (currentPath.includes("about-awards.html") && data.awards) {
            setupMainHeader();

            [...data.awards].reverse().forEach(award => {
                const article = document.createElement("article");
                article.id = `award${award.id}`;
                article.className = "award-section";

                article.innerHTML = `
                    <h2>${award.title}</h2>
                    ${formatDateString(award.itemDate)}
                    <div class="rich-content-view" style="margin-top:15px; font-family: inherit; line-height:1.6; text-align: left;">
                        ${award.desc}
                    </div>
                    ${createVideoPlayer(award.videoPath)}
                `;
                mainContainer.appendChild(article);
            });
        }

        // ========================================================
        // 5. NEWS & UPDATES WEBPAGE (news-updates.html)
        // ========================================================
        else if (currentPath.includes("news-updates.html") && data.news) {
            setupMainHeader();

            [...data.news].reverse().forEach(newsItem => {
                const article = document.createElement("article");
                article.id = `news${newsItem.id}`;
                article.className = "news-section";

                article.innerHTML = `
                    <h2>${newsItem.title}</h2>
                    ${formatDateString(newsItem.itemDate)}
                    <div class="rich-content-view" style="margin-top:15px; font-family: inherit; line-height:1.6; text-align: left;">
                        ${newsItem.desc}
                    </div>
                    ${createVideoPlayer(newsItem.videoPath)}
                `;
                mainContainer.appendChild(article);
            });
        }

        // ========================================================
        // 6. BLOG ARTICLES WEBPAGE (blog-articles.html)
        // ========================================================
        else if (currentPath.includes("blog-articles.html") && data.blogs) {
            setupMainHeader();

            [...data.blogs].reverse().forEach(blog => {
                const article = document.createElement("article");
                article.id = `blog${blog.id}`;
                article.className = "blog-section";

                article.innerHTML = `
                    <h2>${blog.title}</h2>
                    ${formatDateString(blog.itemDate)}
                    <div class="rich-content-view" style="margin-top:15px; font-family: inherit; line-height:1.6; text-align: left;">
                        ${blog.desc}
                    </div>
                    ${createVideoPlayer(blog.videoPath)}
                `;
                mainContainer.appendChild(article);
            });
        }

        // ========================================================
        // 7. EVENTS WEBPAGE (news-events.html)
        // ========================================================
        else if (currentPath.includes("news-events.html") && data.events) {
            setupMainHeader();

            [...data.events].reverse().forEach(event => {
                const article = document.createElement("article");
                article.id = `event${event.id}`;
                article.className = "event-section";

                article.innerHTML = `
                    <h2>${event.title}</h2>
                    ${formatDateString(event.itemDate)}
                    <div class="rich-content-view" style="margin-top:15px; font-family: inherit; line-height:1.6; text-align: left;">
                        ${event.desc}
                    </div>
                    ${createVideoPlayer(event.videoPath)}
                `;
                mainContainer.appendChild(article);
            });
        }

        // ========================================================
        // 8. CAREERS WEBPAGE (careers.html)
        // ========================================================
        else if (currentPath.includes("careers.html") && data.careers) {
            setupMainHeader();

            [...data.careers].reverse().forEach(career => {
                const article = document.createElement("article");
                article.id = `career${career.id}`;
                article.className = "career-section";

                article.innerHTML = `
                    <h2>${career.title}</h2>
                    ${formatDateString(career.itemDate)}
                    <div class="rich-content-view" style="margin-top:15px; font-family: inherit; line-height:1.6; text-align: left;">
                        ${career.desc}
                    </div>
                    ${createVideoPlayer(career.videoPath)}
                `;
                mainContainer.appendChild(article);
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
            let thumbnailStyle = '';
            
            if (imgTagMatch && imgTagMatch[1]) {
                thumbnailStyle = `background-image: url('${imgTagMatch[1]}');`;
            }

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

        const footerDiv = document.createElement("div");
        footerDiv.className = "dropdown-footer";
        footerDiv.innerHTML = `<a href="projects.html" class="see-more-btn">See More Projects →</a>`;
        previewMenu.appendChild(footerDiv);
    }
});