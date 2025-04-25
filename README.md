# Nature Nexus

## Overview

Nature Nexus connects urban dwellers with the biodiversity around them by simplifying species identification and observation. This app helps users document and share wildlife sightings in cities, creating valuable data for conservation efforts while building community around urban nature appreciation. Key features include:

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

- **Frontend**: React Native, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL
- **AI Integration**: TensorFlow Lite, Vision API
- **Mapping**: Mapbox, Leaflet
- **Authentication**: OAuth 2.0, JWT

---

## Usage

Example:

1. Open the app on your mobile device or visit `https://naturenexus.app/`.
2. Sign in or sign up to access personalized features, or;
3. Browse local biodiversity data without signing in.
4. Take a photo of a species you've encountered to identify and document it.

---

## Project Structure

```
nature-nexus/
├── assets/
│   ├── icons/
│   ├── species-samples/
│   └── app-images/
├── components/
│   ├── core/
│   ├── maps/
│   ├── camera/
│   └── species/
├── screens/
│   ├── Home.js
│   ├── Identify.js
│   ├── Map.js
│   ├── Quests.js
│   ├── Profile.js
│   └── Settings.js
├── services/
│   ├── api.js
│   ├── auth.js
│   ├── visionAI.js
│   └── location.js
├── database/
│   ├── schema.sql
│   └── migrations/
├── README.md
└── .gitignore
```

---

## Contributors

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

## Resources

- Species database initial seed from Global Biodiversity Information Facility (GBIF)
- AI model trained on iNaturalist dataset

## Contact

- Ben Le - lechiben@gmail.com
- Mason Young - masonyoung1997@gmail.com
- Quinn Desforge Major - QuinnDesforgeMajor@gmail.com (Professional)
- Andrei Chepakovich - andreichepakovich@gmail.com

## Acknowledgements

- <a href="https://www.gbif.org/">Global Biodiversity Information Facility</a>
- <a href="https://www.inaturalist.org/">iNaturalist</a>
- <a href="https://www.tensorflow.org/">TensorFlow</a>
