# bump

AI-powered support for women from conception through postpartum — your personalized wellness companion.

## 🚀 Project Overview

**bump** is a web app designed to support women at every stage of their motherhood journey (TTC, pregnant, postpartum). With voice/chat interaction, personalized health tracking, daily check-ins, and real-time red flag detection, bump combines empathetic AI with practical tools to empower and reassure new and expecting mothers.

### Built at CalHacks by:
- King
- Eben
- Dee (6' 7")
- Timi

---

## 🧩 Features

- **Stage Selection:** Choose between Trying to Conceive (TTC), Pregnant, or Postpartum for a tailored experience.
- **Daily Check-ins:** Track mood, hydration, and symptoms — adapted to your stage.
- **Voice & Chat Interface:** Natural conversation with the assistant powered by Vapi and Claude/Gemini.
- **Personalized Health Tips:** Claude or Gemini provides daily/weekly advice for your journey.
- **Red Flag Detection:** E.g., “I’m bleeding” triggers an Orkes workflow for emergency support.
- **Affirmations:** Daily emotional nudges or audio affirmations.
- **Progress Dashboard:** Visualize hydration, mood, and engagement history.
- **Admin/Provider (Future):** Trends and risks for care providers.

---

## 🛠️ Tech Stack & Tools

### AI & Voice
- **Claude 4 / Gemini:** Empathetic LLM for advice, tips, and chat.
- **Vapi:** Voice API for natural, hands-free conversations.
- **Orkes:** Workflow engine for red flag routing and scheduling.
- **Unify:** Agent state management.
- **Groq:** Fast AI inference.

### Frontend
- **React.js + Vite**
- **Tailwind CSS**
- **React Router, Axios**
- **Framer Motion (micro-animations)**
- **Vercel or Netlify** for deployment

### Backend / Infra
- **Node.js + Express**
- **Firebase** (auth, real-time DB for logs)
- **Supabase** (alternative to Firebase)
- **GitHub** for version control

---

## 🗂️ Repository Structure

```md
bump/
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   └── public/
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── workflows/
├── api-integrations/
│   ├── claude/
│   ├── vapi/
│   ├── unify/
│   └── orkes/
├── database/
│   └── userLogs.schema.json
├── .env.example
├── README.md
└── devpost-submission.md
```


---

## 🧑‍💻 Architecture

### Frontend
- Built with React, Vite, and Tailwind CSS.
- Key pages: Landing, Signup (stage select), Dashboard, Logs, Chatbot.
- Componentized for layout, dashboards, chat, and logging.
- State management includes trimester, mood, symptoms, and more.
- Axios for API calls, Framer Motion for UI polish.

### Backend
- Node.js + Express server.
- Auth via Firebase; user data and logs stored securely.
- REST APIs for logs, tasks, chat (Claude/Gemini), and alerts (Orkes).
- Modular services for each AI/workflow provider.

### AI/Integration Flows
- **Voice chat:** Vapi handles speech; Claude/Gemini respond with empathetic, context-aware advice.
- **Red flag detection:** Orkes workflow triggered on symptom logs (e.g., bleeding).
- **Affirmations/tips:** Generated daily via Claude/Gemini.

---

## 🎨 Wireframes (Text)

1. **Landing Page:** Welcome + CTA.
2. **Onboarding:** Stage selector (TTC, Pregnant, Postpartum), due date, email.
3. **Dashboard:** Progress bar, daily tasks/tips, affirmation, logs.
4. **Logs:** Daily/weekly health logs, red flag triggers.
5. **Chatbot:** Week summary, real-time chat/voice.
6. **Alerts:** Emergency routing for symptoms.
7. **Admin (future):** Trends and risk detection.

---

## 🚦 Hackathon Timeline (36h MVP)

- H1–3: Ideation, roles, repo
- H4–7: Stage selector, check-in UI
- H8–12: Claude/Gemini + Vapi integration
- H13–18: Orkes red flag flow
- H19–24: Voice/chat, test flows
- H25–30: Affirmations, polish UI
- H31–33: Deploy
- H34–36: Demo/pitch/Devpost

---

## 🏁 Getting Started

### Prerequisites

- Node.js, npm, Firebase/Supabase keys, Vapi/Claude API keys

### Installation

```bash
git clone https://github.com/kingigbozuruike/calhacks.git
cd calhacks
# Backend
cd backend
npm install
# Frontend
cd ../frontend
npm install
```

### Running Locally
```bash
# Backend
cd backend
npm start

# Frontend
cd ../frontend
npm run dev
```

Then open http://localhost:3000
