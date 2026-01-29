# Library - Personal Book Collection Manager

A beautiful, mobile-first book tracking application with an editorial/art deco design aesthetic.

## Features

### Core Functionality
- **📚 Book Collection Management** - Add, edit, and delete books from your personal library
- **📱 Barcode Scanning** - Scan ISBN barcodes using your mobile camera to quickly add books
- **🔍 Fuzzy Search** - Find books quickly with intelligent search across titles, authors, ISBN, and publishers
- **👥 Author Grouping** - Books are automatically organized by author with visual separation
- **💾 Auto-Save** - All changes are automatically saved to localStorage

### Data Management
- **📤 Export** - Download your entire library as JSON for backup
- **📥 Import** - Restore your library from a JSON backup file
- **🧪 Test Data** - Load sample books for testing and demonstration

### Design
- **🎨 Editorial/Art Deco Aesthetic** - Custom color palette with vintage library catalog influences
  - Jungle Green (#00a676)
  - Terracotta Clay (#a76d60)
  - Bright Snow (#f9f9f9)
  - Royal Gold (#ffe45e)
  - Jet Black (#232c33)
- **📱 Mobile-First** - Responsive design optimized for phone, tablet, and desktop
- **📲 PWA Support** - Install as an app on your mobile device for offline access

### Book Information
Each book can include:
- Title and Author (required)
- ISBN
- Cover image
- Publication year
- Publisher
- Page count
- Date added (auto-generated)

## Technology Stack

- **Frontend**: React + Vite
- **Styling**: CSS with custom design system
- **Barcode Scanning**: html5-qrcode
- **Search**: Fuse.js for fuzzy matching
- **Data**: Google Books API for ISBN lookup
- **Storage**: Browser localStorage
- **PWA**: Web App Manifest

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage

1. **Adding Books**
   - Click "Add Book" to manually enter book details
   - Click "Scan Barcode" to use your camera to scan ISBN barcodes
   - Use "Auto-fill" in the add book form to fetch details from Google Books API

2. **Managing Books**
   - Click the pencil icon (✏️) to edit a book
   - Click the trash icon (🗑️) to delete a book
   - Use the search bar to filter your collection

3. **Data Management**
   - Click "Export Library" to download your collection as JSON
   - Click "Import Library" to restore from a backup file
   - Use "Load Test Data" to populate with sample books for testing
   - Use "Clear All Books" to remove all books from your library

## Deployment

### Frontend (Vercel)
Connect your GitHub repo and deploy automatically, or use Netlify/GitHub Pages.

### Firebase Setup (One-time)

```bash
# Set Google Books API key (stored in Secret Manager)
firebase functions:secrets:set GOOGLE_BOOKS_API_KEY
```

### Firebase Deployment

```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# Deploy multiple
firebase deploy --only functions,firestore:rules
```

### Local Development with Emulators

```bash
# Start all emulators (Firestore, Auth, Storage, Functions)
firebase emulators:start

# Run app against emulators
VITE_USE_EMULATOR=true npm run dev
```

Emulator UI: http://localhost:4000

## Project Structure

```
library-app/
├── src/
│   ├── components/
│   │   ├── AddBookModal.jsx/css
│   │   ├── EditBookModal.jsx
│   │   ├── BarcodeScannerModal.jsx/css
│   │   ├── BookCard.jsx/css
│   │   └── BookList.jsx/css
│   ├── utils/
│   │   ├── testData.js
│   │   └── uuid.js
│   ├── App.jsx/css
│   ├── index.css
│   └── main.jsx
├── public/
│   └── manifest.json
├── index.html
└── package.json
```

## Future Enhancements

Potential features for future development:
- Multiple collections (e.g., "Read", "To Read", "Wishlist")
- Reading progress tracking
- Book ratings and reviews
- Custom tags and categories
- Sort by different criteria (title, date added, rating)
- Dark mode toggle
- Cloud sync across devices
- Share collection with friends

## License

ISC
