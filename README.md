# Orkhon Valley Cultural Landscape App

A Next.js web application showcasing the UNESCO World Heritage Site of Orkhon Valley with AR/VR virtual tours powered by Unity and AI-guided experiences.

## Features

- 🏛️ **Heritage Sites**: Explore 32+ archaeological and cultural sites
- 🗺️ **Interactive Map**: Leaflet-based map with marker clustering
- 🚌 **Virtual Tours**: Dual-mode tours (Classic & VR/AR)
- 🤖 **AI Guide**: OpenAI-powered virtual tour guide
- 🌐 **Multilingual**: Mongolian and English support
- 📱 **Responsive**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS + CSS Modules
- **Maps**: Leaflet + React Leaflet
- **Animations**: Framer Motion
- **3D/AR**: Unity WebGL (react-unity-webgl)

### Backend
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **AI**: OpenAI GPT-3.5 Turbo
- **Hosting**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase account
- OpenAI API key
- Unity 2022 LTS (for VR/AR development)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd orkhon-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:
- Firebase configuration
- OpenAI API key
- Cloudinary credentials (optional)

4. **Set up Firebase**

Follow the [Firebase Setup Guide](./docs/FIREBASE_SETUP.md) to:
- Create Firebase project
- Enable Firestore and Storage
- Get service account credentials

5. **Migrate data to Firebase**

```bash
# Dry run (preview without writing)
node scripts/migrate-to-firebase.js --dry-run

# Execute migration
node scripts/migrate-to-firebase.js

# Verify migration
node scripts/migrate-to-firebase.js --verify
```

6. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
orkhon-app/
├── app/
│   ├── api/              # API routes
│   │   ├── sites/        # Sites data endpoint
│   │   └── ai-guide/     # AI guide endpoint
│   ├── data/             # Static data
│   ├── map/              # Map page
│   ├── sites/            # Sites listing page
│   ├── tours/            # Tours page (Classic + VR/AR)
│   └── info/             # Info page
├── components/
│   ├── VirtualTour.js    # Classic tour component
│   └── UnityPlayer.js    # Unity WebGL player
├── lib/
│   ├── firebase.js       # Firebase client config
│   └── firebase-admin.js # Firebase admin config
├── scripts/
│   └── migrate-to-firebase.js  # Data migration
└── public/
    └── unity-build/      # Unity WebGL build files
```

## Unity VR/AR Setup

For setting up the Unity project for AR/VR tours, see [UNITY_SETUP.md](./UNITY_SETUP.md)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features Guide

### Classic Virtual Tour

Navigate through heritage sites with:
- High-resolution images
- Detailed descriptions (Mongolian & English)
- Keyboard shortcuts (Arrow keys, I, ESC)
- Progress tracking

### VR/AR Tour (Beta)

Unity-powered immersive experience with:
- 360° panoramic images
- AR information overlays
- Interactive map
- AI-powered virtual guide

### AI Virtual Guide

Ask questions about any heritage site:
- Context-aware responses
- Multilingual support
- Response caching for performance
- Powered by OpenAI GPT-3.5

## API Endpoints

### GET /api/sites
Fetch all heritage sites
```javascript
// Query parameters
?category=Хөшөө дурсгал  // Filter by category
?limit=10                 // Limit results
```

### POST /api/ai-guide
Get AI-powered site explanations
```javascript
{
  "siteId": 1,
  "question": "Tell me about this site",  // Optional
  "language": "mn"  // 'mn' or 'en'
}
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- AWS Amplify
- Google Cloud Run
- Self-hosted

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license here]

## Acknowledgments

- UNESCO World Heritage Centre
- Orkhon Valley World Heritage Site Administration
- Firebase & OpenAI for infrastructure
- Unity Technologies for AR/VR platform

## Support

For issues or questions:
- Create an issue on GitHub
- Contact: [your-email@example.com]
