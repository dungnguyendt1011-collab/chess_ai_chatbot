# Modern ChatGPT-like Chatbot Website

A modern, responsive ChatGPT-inspired chatbot interface built with React, TypeScript, and OpenAI's GPT API.

## Features

- 🎨 Modern glassmorphism design with smooth animations
- 🌙 Dark/Light mode toggle with system preference detection
- 💬 Real-time chat interface with typing indicators
- 📱 Fully responsive design (mobile & desktop)
- ⚡ Fast and optimized with Vite
- 🔒 Secure API key handling
- 💾 Message persistence in session
- 🎯 Error handling and loading states

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling and animations
- **Custom hooks** for state management

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **OpenAI API** integration
- **CORS** for cross-origin requests

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chatbot-website
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   Server will run on http://localhost:3001

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on http://localhost:5173

### Building for Production

1. **Build the backend**
   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx    # Main chat container
│   │   │   ├── MessageBubble.tsx    # Individual message component
│   │   │   ├── InputBox.tsx         # Message input with auto-resize
│   │   │   └── ThemeToggle.tsx      # Dark/light mode toggle
│   │   ├── hooks/
│   │   │   ├── useChat.ts           # Chat state management
│   │   │   └── useTheme.ts          # Theme management
│   │   ├── services/
│   │   │   └── api.ts               # API communication
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript definitions
│   │   └── App.tsx
│   └── package.json
├── backend/
│   ├── src/
│   │   └── server.ts                # Express server with OpenAI integration
│   ├── .env.example                 # Environment variables template
│   └── package.json
└── README.md
```

## API Endpoints

- `POST /api/chat` - Send message to GPT
- `GET /api/health` - Health check endpoint

## Environment Variables

### Backend (.env)
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

## Customization

### Styling
- Modify `tailwind.config.js` for custom animations and colors
- Edit component styles in individual `.tsx` files

### AI Model
- Change the GPT model in `backend/src/server.ts` (line with `model: 'gpt-3.5-turbo'`)
- Adjust `temperature` and `max_tokens` for different response styles

### Theme
- Customize colors in `tailwind.config.js`
- Modify theme detection logic in `useTheme.ts`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues and questions, please open an issue on GitHub.