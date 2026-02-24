import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0f8',
          100: '#cce1f1',
          200: '#99c3e3',
          300: '#66a5d5',
          400: '#3387c7',
          500: '#003F87', // Bondi Deep Blue (main) - Belize Flag Blue
          600: '#00326d',
          700: '#002653',
          800: '#00193a',
          900: '#000d20',
        },
        accent: {
          50: '#fce8ea',
          100: '#f9d1d5',
          200: '#f3a3ab',
          300: '#ed7581',
          400: '#e74757',
          500: '#CE1126', // Philippine Red - Belize Flag Red
          600: '#a50e1e',
          700: '#7c0b17',
          800: '#52070f',
          900: '#290408',
        },
        success: {
          50: '#fce8ea',
          100: '#f9d1d5',
          200: '#f3a3ab',
          300: '#ed7581',
          400: '#e74757',
          500: '#CE1126', // Belize Flag Red
          600: '#a50e1e',
          700: '#7c0b17',
          800: '#52070f',
          900: '#290408',
        },
        yellow: {
          50: '#fffce8',
          100: '#fff9d1',
          200: '#fff3a3',
          300: '#ffed75',
          400: '#ffe747',
          500: '#FFD83C', // Bright Sun Yellow - Belize Flag Yellow
          600: '#ccad30',
          700: '#998224',
          800: '#665718',
          900: '#332b0c',
        },
        verified: {
          50: '#e8f9ee',
          100: '#d1f3dd',
          200: '#a3e7bb',
          300: '#75db99',
          400: '#47cf77',
          500: '#16ac4b',
          600: '#128a3c',
          700: '#0e682d',
          800: '#0a461e',
          900: '#06240f',
        },
        sky: {
          50: '#f0f9fc',
          100: '#e1f3f9',
          200: '#c3e7f3',
          300: '#a5dbed',
          400: '#87cfe7',
          500: '#9DD7FF', // Splashy Blue (Light Blue) - Belize Flag Light Blue
          600: '#7eacc2',
          700: '#5e8192',
          800: '#3f5661',
          900: '#1f2b31',
        },
      },
    },
  },
  plugins: [],
};
export default config;
