# Chatbot UI Clone

This project is a Next.js-based Chatbot UI.

## Prerequisites

- Node.js (Latest LTS recommended)
- `npm` (packaged with Node.js)

## Getting Started

### 1. Install Dependencies

Install the project dependencies using `npm`. Note that legacy peer dependencies are required due to some package version conflicts.

```bash
npm install --legacy-peer-deps
```

### 2. Run Development Server

To start the development server locally:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 3. Build for Production

To build the application for production deployment:

```bash
npm run build
```

### 4. Start Production Server

After building, you can start the production server:

```bash
npm run start
```

## Troubleshooting

### Styles/CSS Issues
If you encounter issues with styles not loading:
- Ensure `postcss.config.js` and `tailwind.config.js` are configured correctly (CommonJS format).
- Try clearing the Next.js cache: `rm -rf .next` and restarting the server.
