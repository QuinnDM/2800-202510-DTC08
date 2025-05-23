# Nature Nexus

## Overview

Nature Nexus connects urban dwellers with the biodiversity around them by simplifying species identification and observation. This app helps users document and share wildlife sightings in cities, creating valuable data for conservation efforts while building community around urban nature appreciation. 

Key features include:

- AI-powered photo identification
- Seasonal biodiversity heatmaps
- Species checklist quests
- Community observation feed
- Data export for researchers

Nature Nexus addresses the disconnect between urban residents and their natural surroundings. The current goal for this app is to make urban biodiversity documentation accessible and engaging for everyone. Nature Nexus is developed with a modern tech stack optimized for mobile and web use.

---

## Features

- AI-assisted species identification
- User observation gallery and personal stats
- Seasonal heatmaps of biodiversity
- Species checklist quests
  - Seasonal collections
  - Location-based challenges
  - Taxonomy-focused lists
- Community verification system
- Data visualization dashboard
- Research data export options

---

## Technologies Used

- **Frontend**: Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, Cloudinary
- **AI Integration**:  Google Cloud Vision API, Gemini API
- **Mapping**: JAWP
- **Authentication**: OAuth 2.0, JWT

---

## Usage

### The required installs:
a. Language(s):

      Node.js (v18 or later recommended)

      npm (comes with Node.js)

b. IDEs:

      Visual Studio Code (recommended)

      Any other code editor of your choice

c. Database(s):

      MongoDB (local installation or MongoDB Atlas cloud instance)

d. Other software:

      Git for version control

      Cloudinary account for image uploads (recommended for production)

### 3rd party APIs and frameworks:
      Google Cloud Vision API (for AI-powered species identification)

      Gemini API (for advanced AI features, if enabled)

      Tailwind CSS (already included in the repo)

      JAWP (for mapping; already included)

      Express, Mongoose, Passport, and other npm dependencies (installed via npm install)

### API keys requirement
      Google Cloud Vision API key

      Gemini API key (if using Gemini features)

      MongoDB connection string (local or Atlas)

      Cloudinary API credentials (for image uploads)

- Create a .env file in the root directory and add your keys as follows:

```
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GOOGLE_CLOUD_VISION_API_KEY=your_google_api_key
GEMINI_API_KEY=your_gemini_api_key
SESSION_SECRET=your_session_secret
```
### command line instructions:

Step 1: Clone the repository:

  git clone https://github.com/yourusername/nature-nexus.git
  cd nature-nexus

Step 2: Install dependencies:

  npm install express mongoose cors dotenv mongodb bcrypt ejs express-session session-file-store multer cloudinary cookie-parser passport passport-google-oauth20

Step 3: Set up your .env file with the required API keys and credentials (see above).

Step 4: Install MongoDB (if running locally) and ensure it is running.

Step 5: Set up Cloudinary for image hosting.

Step 6: Start the development server:

  npm run dev
  or
  node server.js

---

## Project Structure

```
nature-nexus/
├── models/
│   ├── dailyFeature.js
│   ├── sighting.js
│   └── user.js
├── node_modules/
├── public/
│   ├── css/
│   │   └── explore.css
│   ├── images/
│   │   ├── autumnbird.avif
│   │   ├── bird1.avif
│   │   ├── bird1.jpg
│   │   ├── bird2.avif
│   │   ├── bird2.jpg
│   │   ├── bird3.avif
│   │   ├── bird3.jpg
│   │   ├── bird4.avif
│   │   ├── bird4.jpg
│   │   ├── bird5.avif
│   │   ├── bird5.jpg
│   │   ├── birdsnow.avif
│   │   ├── favicon.ico
│   │   ├── logo.png
│   │   ├── marker-icon-blue.png
│   │   ├── marker-icon-green.png
│   │   ├── satellite.png
│   │   ├── springbird.avif
│   │   ├── streetmap.png
│   │   ├── summerbird.avif
│   │   └── winterbird.avif
│   └── scripts/
│       └── explore.js
├── routes/
│   ├── articles.js
│   ├── auth.js
│   ├── collections.js
│   ├── explore.js
│   ├── identify.js
│   └── settings.js
├── uploads/
├── views/
│   ├── articles/
│   ├── components/
│   ├── partials/
│   ├── about.ejs
│   ├── collection.ejs
│   ├── explore.ejs
│   ├── forgot-password.ejs
│   ├── identity.ejs
│   ├── index.ejs
│   ├── login.ejs
│   ├── reset-password.ejs
│   └── settings.ejs
├── .env
├── .gitignore
├── nodemon.json
├── package-lock.json
├── package.json
├── passport-config.js
├── README.md
├── server.js
└── tailwind.config.js
```

---

## About Us
Team Name: DTC-08
Team Members:
- Hi, my name is **Ben Le**. I'm excited about this project because it combines my passion for technology and urban ecology. Fun fact: I've documented over 150 bird species in my city neighborhood.
- **Mason** - Environmental science student with a focus on urban ecosystems. Fun fact: I maintain a native plant garden on my apartment balcony.
- **Andrei** - Full-stack developer with experience in AI-powered applications. Fun fact: I once spotted a rare hawk species during my morning commute.
- Hi my name is **Quinn**. I am looking forward to connecting people with urban nature! Fun Fact: I organize neighborhood bioblitzes every spring.

## Limitations and Future Work

### Limitations

- Currently, the app's AI identification works best for common species
- Species database is focused primarily on North American urban fauna and flora
- User verification system requires expert review for uncommon species
- Limited functionality in offline mode

### Future Work

- Expand species database to include more regions globally
- Implement augmented reality features for in-field learning
- Add citizen science project integration with research institutions
- Create educational modules for schools and community groups
- Develop an offline mode with full functionality
- Add social features for community challenges and group documentation events

---

## Contact

- Ben Le - lechiben@gmail.com
- Mason Young - masonyoung1997@gmail.com
- Quinn Desforge Major - QuinnDesforgeMajor@gmail.com
- Andrei Chepakovich - andreichepakovich@gmail.com
