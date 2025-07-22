// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          light: '#ffffff',
          dark: '#1e1e2f', // like ChatGPT
        },
        surface: {
          light: '#f5f5f5',
          dark: '#2a2a3c',
        },
        primary: {
          DEFAULT: '#7c3aed', // violet
          hover: '#9a6bff',
        },
        text: {
          light: '#1a1a1a',
          dark: '#e5e5e5',
        },
      },
    },
  },
  plugins: [],
};

export default config;
