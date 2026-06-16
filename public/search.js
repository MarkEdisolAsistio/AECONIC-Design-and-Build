document.addEventListener("DOMContentLoaded", () => {
    const searchContainer = document.querySelector(".search-container");
    const searchInput = document.querySelector(".search-input");

    if (searchContainer && searchInput) {
        // 1. Create a container element for the floating preview box
        const previewBox = document.createElement("div");
        previewBox.className = "search-preview-box";
        searchContainer.appendChild(previewBox);

        // Define your website search database matching your files
        const searchData = [
            { title: "Project 1: Sample", desc: "Integrated modular layouts and infrastructure setups.", target: "projects.html#project1", keywords: ["project", "one", "sample", "infrastructure"] },
            { title: "Project 2: Sample", desc: "Framework expansion and centralized system node structures.", target: "projects.html#project2", keywords: ["project", "two", "scaling", "automation"] },
            { title: "Project 3: Sample", desc: "Smart node distribution channels and cross-platform syncing.", target: "projects.html#project3", keywords: ["project", "three", "enterprise", "server"] },
            { title: "Our Story", desc: "Our journey, clear vision, layout design, and system engineering.", target: "about-story.html", keywords: ["story", "journey", "history", "vision"] },
            { title: "Our Core Values", desc: "Integrity, innovation, and delivering stable modular systems.", target: "about-values.html", keywords: ["value", "core", "integrity", "innovation", "excellence"] },
            { title: "Awards & Certification", desc: "Standard ISO validation and safety compliance accreditations.", target: "about-awards.html", keywords: ["award", "certification", "iso", "compliance"] },
            { title: "Careers", desc: "Reviewing candidacies for entry-level roles and full-stack interns.", target: "careers.html", keywords: ["career", "job", "hiring", "intern", "engineer"] },
            { title: "Contact Us", desc: "Get in touch via Email, Facebook, Instagram, or TikTok.", target: "contact.html", keywords: ["contact", "email", "facebook", "instagram", "tiktok"] },
            { title: "News & Updates", desc: "Latest patches, framework upgrades, and version logs.", target: "news-updates.html", keywords: ["news", "update", "patch", "runtime"] },
            { title: "Blog Articles", desc: "Technical breakdowns detailing data models and server protocols.", target: "blog-articles.html", keywords: ["blog", "article", "log", "technical"] },
            { title: "Upcoming Events", desc: "Technology exhibitions, code sprints, and panel forums.", target: "news-events.html", keywords: ["event", "exhibition", "sprint", "forum"] }
        ];

        // 2. Listen to keyboard typing actions
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase().trim();
            previewBox.innerHTML = ""; // Clear old previews

            if (query === "") {
                previewBox.style.display = "none";
                return;
            }

            // Filter data matching what the user is typing
            const matches = searchData.filter(item => 
                item.title.toLowerCase().includes(query) || 
                item.keywords.some(keyword => query.includes(keyword))
            );

            if (matches.length > 0) {
                previewBox.style.display = "block";
                
                // Keep only the top 4 most relevant results so it stays clean
                matches.slice(0, 4).forEach(match => {
                    const itemLink = document.createElement("a");
                    itemLink.href = match.target;
                    itemLink.className = "search-preview-item";
                    
                    itemLink.innerHTML = `
                        <span class="search-preview-title">${match.title}</span>
                        <span class="search-preview-desc">${match.desc}</span>
                    `;
                    
                    previewBox.appendChild(itemLink);
                });
            } else {
                // If nothing matches, show a subtle notification row
                previewBox.style.display = "block";
                previewBox.innerHTML = `<div class="search-no-results">No previews found</div>`;
            }
        });

        // 3. Close the preview box if the user clicks anywhere outside of it
        document.addEventListener("click", (event) => {
            if (!searchContainer.contains(event.target)) {
                previewBox.style.display = "none";
            }
        });
    }
});