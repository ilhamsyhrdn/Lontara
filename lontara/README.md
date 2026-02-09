# 📧 Lontara - AI-Powered Email Classification System

> Intelligent email management system with machine learning-powered categorization and Gmail integration.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-blue?logo=react)](https://reactjs.org/)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.22-orange?logo=tensorflow)](https://www.tensorflow.org/js)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://www.mongodb.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16-2D3748?logo=prisma)](https://www.prisma.io/)

## ✨ Features

- 🤖 **AI-Powered Classification** - Automatic email categorization using TensorFlow.js
- 📬 **Gmail Integration** - OAuth2 authentication and real-time email synchronization
- 📊 **Interactive Dashboard** - Real-time analytics and email statistics with Material-UI charts
- 🔐 **Secure Authentication** - JWT-based auth system with role-based access control
- 📄 **PDF Processing** - Extract and classify content from PDF attachments
- 🎯 **Smart Categorization** - Automatically sort emails into categories (Urgent, Important, Normal, Spam)
- 📧 **Email Management** - Compose, draft, and send emails directly from the platform
- 👥 **User Management** - Admin panel for user activation and management

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5** - React framework with App Router
- **React 19.1** - UI library
- **Material-UI (MUI)** - Component library
- **TailwindCSS 4** - Utility-first CSS
- **Axios** - HTTP client

### Backend
- **Next.js API Routes** - Serverless API
- **Prisma 6** - Database ORM
- **MongoDB** - NoSQL database
- **JWT** - Authentication
- **Nodemailer** - Email sending

### Machine Learning
- **TensorFlow.js** - Neural network for email classification
- **Natural** - NLP library
- **Compromise** - Text processing
- **PDF-Parse** - PDF text extraction

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- Gmail account with App Password
- Google Cloud OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lontara.git
   cd lontara
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. **Setup Prisma**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed admin user (optional)**
   ```bash
   node backend/src/scripts/seedAdmin.js
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📦 Project Structure

```
lontara/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   └── hooks/        # Custom React hooks
│   ├── lib/              # Utility libraries
│   └── services/         # API client services
├── backend/
│   └── src/
│       ├── config/       # Configuration files
│       ├── middlewares/  # Express middlewares
│       ├── models/       # ML models & training data
│       ├── routes/       # API routes (legacy)
│       ├── scripts/      # Utility scripts
│       └── services/     # Business logic
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## 🎯 Key Features Explained

### Machine Learning Classification

The system uses a custom-trained neural network to classify emails into categories:
- **Urgent** - Time-sensitive emails requiring immediate attention
- **Important** - High-priority emails
- **Normal** - Regular correspondence
- **Spam** - Unwanted or suspicious emails

### Gmail Integration

- OAuth2 authentication for secure access
- Real-time email fetching and synchronization
- Send emails directly through Gmail API
- Attachment handling and processing

### Dashboard Analytics

- Email distribution charts
- Category-based filtering
- Recent email activity
- User statistics

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm test             # Run tests
npm run vercel-build # Build for Vercel deployment
```

## 🌐 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- TensorFlow.js for bringing ML to the browser
- Material-UI for beautiful components

---

Made with ❤️ using Next.js, React, and TensorFlow.js
