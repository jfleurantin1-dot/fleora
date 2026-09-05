import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      plum: {50:"#F8F4FC",100:"#F0E8F8",200:"#E2D2F1",300:"#CDB4E7",400:"#AD83D5",500:"#8E5BB8",600:"#724296",700:"#563174",800:"#43245F",900:"#32145F"},
      blush: {50:"#FFF8F9",100:"#FBEDEF",200:"#F3DDE2",300:"#EBCFD5",400:"#DCAEB8",500:"#C98798"},
      sage: {50:"#F7F9F5",100:"#EEF2EA",200:"#DDE5D8",300:"#C9D3C3",400:"#AEBDA6",500:"#8FA184",600:"#708267",700:"#56644F"},
      champagne: {100:"#F5F1EC",300:"#E1D8CE",500:"#C8B8A8",600:"#A99888"},
      ivory: {50:"#FCFAF7",100:"#F8F4EE",200:"#F0E9DF"},
      ink: {300:"#B6AFC0",400:"#958D9F",500:"#7C7487",600:"#625B6D",700:"#4C4557",800:"#352F40",900:"#211B2B"},
    },
    fontFamily: { sans:["var(--font-inter)","Inter","ui-sans-serif","system-ui","sans-serif"], display:["var(--font-dm-serif)","DM Serif Display","Georgia","serif"] },
    boxShadow: { fleora:"0 6px 22px rgba(50,20,95,.055)", lift:"0 14px 36px rgba(50,20,95,.10)" },
  }}, plugins: []
};
export default config;
