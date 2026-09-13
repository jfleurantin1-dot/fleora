import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      brand: { DEFAULT:"#DFCCFF", hover:"#D0B6F8", soft:"#F5F0FF", ink:"#171827" },
      plum: {50:"#F5F0FF",100:"#EDE3FC",200:"#DFCCFF",300:"#CDB4E7",400:"#AD83D5",500:"#8E5BB8",600:"#724296",700:"#563174",800:"#43245F",900:"#32145F"},
      blush: {50:"#FFF8F9",100:"#FBEDEF",200:"#F3DDE2",300:"#EBCFD5",400:"#DCAEB8",500:"#C98798"},
      sage: {50:"#F7F9F5",100:"#EEF2EA",200:"#DDE5D8",300:"#C9D3C3",400:"#AEBDA6",500:"#8FA184",600:"#708267",700:"#56644F"},
      champagne: {100:"#F5F1EC",300:"#E1D8CE",500:"#C8B8A8",600:"#A99888"},
      ivory: {50:"#FFFFFF",100:"#F5F0FF",200:"#EDE3FC"},
      ink: {300:"#777482",400:"#6D6978",500:"#625E6D",600:"#5B5B6A",700:"#424250",800:"#292936",900:"#171827"},
    },
    fontFamily: { sans:["var(--font-inter)","Inter","ui-sans-serif","system-ui","sans-serif"], display:["var(--font-inter)","Inter","ui-sans-serif","system-ui","sans-serif"], serif:["var(--font-inter)","Inter","ui-sans-serif","system-ui","sans-serif"] },
    boxShadow: { fleora:"0 2px 10px rgba(23,24,39,.035)", lift:"0 6px 20px rgba(23,24,39,.07)" },
  }}, plugins: []
};
export default config;
