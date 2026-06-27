document.addEventListener("DOMContentLoaded", async () => {
    const searchContainer = document.querySelector(".search-container");
    const searchInput = document.querySelector(".search-input");

    if (searchContainer && searchInput) {
        // 1. Create a container element for the floating preview box
        const previewBox = document.createElement("div");
        previewBox.className = "search-preview-box";
        searchContainer.appendChild(previewBox);

        // Define your core structural website pages database mapping tracking rules
        let searchData = [
            { title: "Home Page", desc: "AECONIC Design and Build landing page workspace hub.", target: "webpage.html", keywords: ["home", "main", "aeconic", "landing"] },
            { title: "Our Story", desc: "Our journey, architectural philosophy, milestones, and shared core vision.", target: "about-story.html", keywords: ["story", "journey", "history", "vision", "about"] },
            { title: "Our Services", desc: "Professional architectural engineering solutions, drafting, and construction design models.", target: "about-services.html", keywords: ["service", "core", "integrity", "innovation", "excellence", "drafting", "engineering"] },
            { title: "Awards & Certification", desc: "Professional quality recognitions, structural credentials, and compliance standards.", target: "about-awards.html", keywords: ["award", "certification", "iso", "compliance", "accreditation"] },
            { title: "Careers", desc: "Join our expanding structural workspace team and review current openings.", target: "careers.html", keywords: ["career", "job", "hiring", "intern", "engineer", "architect", "draftsman"] },
            { title: "Contact Us", desc: "Reach out for project consultations via Email, Facebook, Instagram, or TikTok.", target: "contact.html", keywords: ["contact", "email", "facebook", "instagram", "tiktok", "inquire"] },
            { title: "News & Updates", desc: "Latest company announcements, updates, and structural milestones.", target: "news-updates.html", keywords: ["news", "update", "patch", "announcement"] },
            { title: "Blog Articles", desc: "Design trends, expert perspectives, technical advice, and project insights.", target: "blog-articles.html", keywords: ["blog", "article", "log", "technical", "insight"] },
            { title: "Upcoming Events", desc: " Technologie exhibitions, architectural showcases, sprints, and design panels.", target: "news-events.html", keywords: ["event", "exhibition", "sprint", "forum", "showcase"] }
        ];

        // 2. Fetch live data from MongoDB Atlas to dynamically expand search parameters
        try {
            const res = await fetch('/api/content');
            const liveDatabasePayload = await res.json();

            // Map and safely parse internal category elements
            const backendMappingConfigurations = [
                { databaseKey: 'projects', pageUrl: 'projects.html', hashPrefix: '#project' },
                { databaseKey: 'news', pageUrl: 'news-updates.html', hashPrefix: '#news' },
                { databaseKey: 'blogs', pageUrl: 'blog-articles.html', hashPrefix: '#blog' },
                { databaseKey: 'events', pageUrl: 'news-events.html', hashPrefix: '#event' },
                { databaseKey: 'careers', pageUrl: 'careers.html', hashPrefix: '#career' },
                { databaseKey: 'awards', pageUrl: 'about-awards.html', hashPrefix: '#award' },
                { databaseKey: 'story', pageUrl: 'about-story.html', hashPrefix: '#story' },
                { databaseKey: 'values', pageUrl: 'about-services.html', hashPrefix: '#service' } // Handles values category routing token safely
            ];

            backendMappingConfigurations.forEach(config => {
                if (liveDatabasePayload[config.databaseKey]) {
                    liveDatabasePayload[config.databaseKey].forEach(item => {
                        // Strip out HTML markup to deliver smooth, text-only search previews
                        let sanitizedTextSnippet = item.desc.replace(/<\/?[^>]+(>|$)/g, "");
                        
                        searchData.push({
                            title: item.title || `${config.databaseKey.charAt(0).toUpperCase() + config.databaseKey.slice(1)} Entry`,
                            desc: sanitizedTextSnippet.substring(0, 85) + "...",
                            target: `${config.pageUrl}${config.hashPrefix}${item.id}`,
                            keywords: [config.databaseKey, (item.title || "").toLowerCase()]
                        });
                    });
                }
            });
        } catch (error) {
            console.error("[SEARCH CORRELATION ENGINE] Failed initializing database search components:", error);
        }

        // 3. Listen to keyboard typing actions
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase().trim();
            previewBox.innerHTML = ""; // Clear old previews

            if (query === "") {
                previewBox.style.display = "none";
                return;
            }

            // Filter data matching what the user is typing by string queries or matching keyword index strings
            const matches = searchData.filter(item => 
                item.title.toLowerCase().includes(query) || 
                item.desc.toLowerCase().includes(query) ||
                item.keywords.some(keyword => query.includes(keyword) || keyword.includes(query))
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

        // 4. Close the preview box if the user clicks anywhere outside of it
        document.addEventListener("click", (event) => {
            if (!searchContainer.contains(event.target)) {
                previewBox.style.display = "none";
            }
        });
    }
});