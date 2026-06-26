// 1. Load environment variables first
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose'); 
const { SitemapStream, streamToPromise } = require('sitemap'); // Added for sitemap generation
const { Readable } = require('stream');                     // Added for streaming pipeline utilities

const app = express();
const PORT = process.env.PORT || 5500;

// ========================================================
// MONGODB CONNECTION SETUPS
// ========================================================

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is missing in your environment config!");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("🚀 Connected smoothly to Cloud MongoDB Atlas!"))
  .catch(err => console.error("❌ Database connection error:", err));

// Create a single flexible schema to hold all your website sections
const ContentSchema = new mongoose.Schema({
    category: { type: String, required: true, index: true }, // 'projects', 'news', 'blogs', 'story', 'values', etc.
    id: { type: Number, required: true, unique: true },      // Keeps compatibility with your existing frontend code
    title: { type: String, default: '' },                   // Removed strict required flag constraint for flexible empty entries
    desc: { type: String, required: true },
    itemDate: { type: String, default: '' },
    videoPath: { type: String, default: '' }
}, { timestamps: true });

const Content = mongoose.model('Content', ContentSchema);

// Create a schema specifically for Newsletter Subscribers
const SubscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true }
}, { timestamps: true });

const Subscriber = mongoose.model('Subscriber', SubscriberSchema);

// Ensure the local upload folder exists for heavy files
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Disk Storage Engine to stream heavy files straight to your uploads folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 1500 * 1024 * 1024, // 1.5GB limit for standalone video uploads
        fieldSize: 100 * 1024 * 1024  // 100MB limit for text fields containing embedded base64 data strings
    } 
});

// ========================================================
// SECURITY & PAYLOAD PARSING MIDDLEWARE
// ========================================================

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use(session({
    secret: 'super-secret-admin-key',
    secret: 'super-secret-admin-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    res.redirect('/admin-login');
}

// ========================================================
// DYNAMIC LIVE SITEMAP ROUTE (.XML GENERATOR)
// ========================================================

app.get('/sitemap.xml', async (req, res) => {
    try {
        // Base static files mapping architecture
        const links = [
            { url: '/', changefreq: 'daily', priority: 1.0 },
            { url: '/projects.html', changefreq: 'weekly', priority: 0.8 },
            { url: '/news-updates.html', changefreq: 'weekly', priority: 0.7 },
            { url: '/blog-articles.html', changefreq: 'weekly', priority: 0.7 },
            { url: '/news-events.html', changefreq: 'weekly', priority: 0.6 },
            { url: '/careers.html', changefreq: 'monthly', priority: 0.5 },
            { url: '/contact.html', changefreq: 'monthly', priority: 0.5 },
            { url: '/about-story.html', changefreq: 'monthly', priority: 0.5 },
            { url: '/about-services.html', changefreq: 'monthly', priority: 0.5 },
            { url: '/about-awards.html', changefreq: 'monthly', priority: 0.5 }
        ];

        // Fetch dynamic items from MongoDB to append internal track locations if needed
        const dynamicItems = await Content.find({});
        dynamicItems.forEach(item => {
            // Determines routing mapping depending on schema categories
            let targetPage = '';
            if (item.category === 'projects') targetPage = '/projects.html';
            else if (item.category === 'news') targetPage = '/news-updates.html';
            else if (item.category === 'blogs') targetPage = '/blog-articles.html';
            else if (item.category === 'events') targetPage = '/news-events.html';

            if (targetPage) {
                links.push({
                    url: `${targetPage}#project${item.id}`,
                    changefreq: 'weekly',
                    priority: 0.7
                });
            }
        });

        const stream = new SitemapStream({ hostname: 'https://aeconic-design-and-build.onrender.com' });
        
        res.header('Content-Type', 'application/xml');
        
        const xmlBuffer = await streamToPromise(Readable.from(links).pipe(stream));
        res.send(xmlBuffer.toString());

    } catch (error) {
        console.error("❌ Sitemap generation failed:", error);
        res.status(500).end();
    }
});

// Serve static assets after custom endpoints to avoid wildcard hijacking routing errors
app.use(express.static(path.join(__dirname, 'public')));

// ========================================================
// AUTHENTICATION CHANNELS
// ========================================================

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password123') {
        req.session.isAdmin = true;
        return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Unauthorized verification failure' });
});

app.get('/admin-logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin-login');
});

// ========================================================
// NEWSLETTER SUBSCRIPTION ROUTE
// ========================================================

app.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required." });
        }

        // Check if email already exists to prevent duplicate entries from crashing the server
        const existingSubscriber = await Subscriber.findOne({ email: email });
        if (existingSubscriber) {
            return res.status(200).json({ success: true, message: "Already subscribed!" });
        }

        // Save new email to MongoDB
        const newSubscriber = new Subscriber({ email: email });
        await newSubscriber.save();

        console.log(`✅ New subscriber saved to DB: ${email}`);
        res.status(200).json({ success: true, message: "Successfully subscribed!" });

    } catch (error) {
        console.error("❌ Subscription error:", error);
        res.status(500).json({ success: false, message: "Server error saving subscription." });
    }
});

// ========================================================
// DYNAMIC DATA MANAGEMENT API CHANNELS (REFACTORED FOR MONGO)
// ========================================================

// Fetch all content organized by categories to feed your frontend layout map
app.get('/api/content', async (req, res) => {
    try {
        const allItems = await Content.find({});
        
        // Structure the database output to look exactly like your old data.json layout map
        const structuredData = {
            projects: [], news: [], blogs: [], events: [], careers: [], awards: [], story: [], values: [], services: []
        };

        allItems.forEach(item => {
            if (structuredData[item.category]) {
                structuredData[item.category].push({
                    id: item.id,
                    title: item.title || '',
                    desc: item.desc,
                    itemDate: item.itemDate,
                    videoPath: item.videoPath
                });
            }
        });

        // Insert a default sample object if projects array is completely empty (retaining your old file logic)
        if (structuredData.projects.length === 0) {
            structuredData.projects.push({ id: 1, title: 'Project 1: Sample only', desc: '<p>Initial rolling infrastructure layout configurations.</p>', itemDate: '2026-06-16', videoPath: '' });
        }

        res.json(structuredData);
    } catch (error) {
        console.error("[ERROR] Failed fetching data from MongoDB:", error);
        res.status(500).json({ error: "Internal Database Server Error" });
    }
});

// Add or Edit Item
app.post('/api/content/:category', requireAdmin, upload.single('heavyVideo'), async (req, res) => {
    const { category } = req.params;
    if (!req.body) req.body = {};

    const { id, title, desc, itemDate } = req.body;
    
    // Core body validator: Dynamic toggle skip title check if handling story or values templates
    if (!desc || (!title && category !== 'story' && category !== 'values' && category !== 'services')) {
        return res.status(400).json({ success: false, error: 'Required text fields are missing.' });
    }

    const validCategories = ['projects', 'news', 'blogs', 'events', 'careers', 'awards', 'story', 'values', 'services'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ success: false, error: 'Invalid data category mapping token.' });
    }

    let videoPath = '';
    if (req.file) {
        videoPath = '/uploads/' + req.file.filename;
    }

    try {
        // EDIT MODE: If a numerical ID tracking parameter exists
        if (id && id.trim() !== '') {
            const targetId = parseInt(id);
            const updateFields = { title: title || '', desc, itemDate: itemDate || '' };
            if (req.file) {
                updateFields.videoPath = videoPath;
            }

            const updatedItem = await Content.findOneAndUpdate(
                { id: targetId, category: category },
                { $set: updateFields },
                { new: true }
            );

            if (updatedItem) {
                return res.json({ success: true, item: updatedItem });
            }
        }

        // ADD MODE: Create a brand new document store record
        const newItem = new Content({
            id: Date.now(), // Keeps your front-end timeline generation logic safe
            category,
            title: title || '',
            desc,
            itemDate: itemDate || '',
            videoPath: videoPath
        });

        await newItem.save();
        res.json({ success: true, item: newItem });

    } catch (error) {
        console.error("[ERROR] Failed manipulating database entries:", error);
        res.status(500).json({ success: false, error: "Database transaction failure." });
    }
});

// Delete Item
app.delete('/api/content/:category/:id', requireAdmin, async (req, res) => {
    const { category, id } = req.params;
    
    try {
        const targetId = parseInt(id);
        const deletionResult = await Content.deleteOne({ id: targetId, category: category });
        
        if (deletionResult.deletedCount > 0) {
            return res.json({ success: true });
        }
        res.status(404).json({ error: 'Target record could not be found.' });
    } catch (error) {
        console.error("[ERROR] Deletion transactional failure:", error);
        res.status(500).json({ error: 'Database removal failure.' });
    }
});

// ========================================================
// ROUTE VIEWS & RE-ROUTING GATEWAYS
// ========================================================

app.get('/admin-login', (req, res) => res.sendFile(path.join(__dirname, 'public/admin-login.html')));
app.get('/admin-dashboard', requireAdmin, (req, res) => res.sendFile(path.join(__dirname, 'public/admin-dashboard.html')));
app.get(/.*$/, (req, res) => res.sendFile(path.join(__dirname, 'public/webpage.html')));

app.listen(PORT, () => console.log(`\n==================================================\n[SUCCESS] Node Server Engine initialized flawlessly.\n[PERSISTENCE] Cloud MongoDB Atlas Active.\n[PORT] Running on system distribution track: ${PORT}\n==================================================`));