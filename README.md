# Bitonto Level Crossing Monitor

A real-time mobile web application that monitors and visualizes the status of level crossings in Bitonto, Italy.

![Bitonto Crossing Monitor](https://via.placeholder.com/800x400?text=Bitonto+Crossing+Monitor)
_(Replace with actual screenshot)_

## 🚀 Features

- **Real-Time Status**: Displays estimated crossing status (Open, Closed, Warning) based on live train movements.
- **Dual-Station Monitoring**: Tracks trains at both **Bitonto Centrale** and **Bitonto SS. Medici** for maximum accuracy.
- **Live Updates**: Polls data every 5 seconds without page refreshes.
- **Mobile-First Design**: elegant, dark-themed UI optimized for smartphones.
- **Resilient**: Handles API failures gracefully and clearly communicates data staleness.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/) + React Testing Library

## 🚂 Data Source & Methodology

This application does not use physical sensors on the tracks. Instead, it approximates the crossing status by analyzing real-time train arrival and departure boards from **Ferrotramviaria**:

- **CLOSED**: A train is departing or arriving within **5 minutes**.
- **WARNING**: A train is approaching (arriving within **5-12 minutes**).
- **OPEN**: No trains detected within the next 12 minutes.

> **Disclaimer**: This tool is for informational purposes only. Always obey physical signals and gates at the crossing.

## 📦 Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/bitonto-crossing.git
   cd bitonto-crossing
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or the port shown in terminal).

## 🧪 Testing

Run the full unit test suite:

```bash
npm test
# or
npx vitest run
```

## 🚀 Deployment

This project is optimized for deployment on [Vercel](https://vercel.com/new).

1. Push your code to GitHub.
2. Import the project into Vercel.
3. Deploy! (No environment variables required for basic functionality).

## 📄 License

Made with love from [Tarantino.io](https://tarantino.io).
