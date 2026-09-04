import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      plum: {50:"#F8F4FC",100:"#F0E8F8",200:"#E2D2F1",300:"#CDB4E7",400:"#AD83D5",500:"#8E5BB8",600:"#724296",700:"#563174",800:"#43245F",900:"#32145F"},
      blush: {50:"#FCF8FB",100:"#F6EEF7",200:"#EEDFEF",300:"#E2CADF",400:"#CDA9C9",500:"#B58AAD"},
      champagne: {100:"#F5F1EC",300:"#E1D8CE",500:"#C8B8A8",600:"#A99888"},
      ivory: {50:"#FCFBFD",100:"#F8F5FA",200:"#F1ECF5"},
      ink: {300:"#B6AFC0",400:"#958D9F",500:"#7C7487",600:"#625B6D",700:"#4C4557",800:"#352F40",900:"#211B2B"},
    },
    fontFamily: { sans:["var(--font-inter)","Inter","ui-sans-serif","system-ui","sans-serif"], display:["var(--font-dm-serif)","DM Serif Display","Georgia","serif"] },
    boxShadow: { fleora:"0 6px 22px rgba(50,20,95,.055)", lift:"0 14px 36px rgba(50,20,95,.10)" },
  }}, plugins: []
};
export default config;
