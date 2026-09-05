import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconBase({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return <IconBase {...props}><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></IconBase>;
}
export function SearchIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></IconBase>;
}
export function CalendarIcon(props: IconProps) {
  return <IconBase {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></IconBase>;
}
export function MessageIcon(props: IconProps) {
  return <IconBase {...props}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.6V7a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4z"/></IconBase>;
}
export function UserIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></IconBase>;
}
export function SparkleIcon(props: IconProps) {
  return <IconBase {...props}><path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3z"/><path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7z"/></IconBase>;
}
export function ChevronRightIcon(props: IconProps) {
  return <IconBase {...props}><path d="m9 18 6-6-6-6"/></IconBase>;
}
export function MapPinIcon(props: IconProps) {
  return <IconBase {...props}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></IconBase>;
}
export function UsersIcon(props: IconProps) {
  return <IconBase {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></IconBase>;
}
export function WalletIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12"/><path d="M20 11h-5a2 2 0 0 0 0 4h5"/></IconBase>;
}
export function CheckIcon(props: IconProps) {
  return <IconBase {...props}><path d="m5 12 4 4L19 6"/></IconBase>;
}
export function StoreIcon(props: IconProps) {
  return <IconBase {...props}><path d="M3 9h18l-2-5H5L3 9Z"/><path d="M5 9v11h14V9M9 20v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></IconBase>;
}
export function HeartIcon(props: IconProps) {
  return <IconBase {...props}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></IconBase>;
}
export function ArrowLeftIcon(props: IconProps) {
  return <IconBase {...props}><path d="m15 18-6-6 6-6"/></IconBase>;
}
export function BuildingIcon(props: IconProps){return <IconBase {...props}><path d="M4 21V7l8-4 8 4v14"/><path d="M8 10h2m4 0h2M8 14h2m4 0h2M9 21v-3h6v3"/></IconBase>}
export function ChairIcon(props: IconProps){return <IconBase {...props}><path d="M7 12V6a3 3 0 0 1 6 0v6M5 12h12v4H5zM7 16v5m8-5v5"/></IconBase>}
export function UtensilsIcon(props: IconProps){return <IconBase {...props}><path d="M6 3v8m-3-8v5a3 3 0 0 0 6 0V3M6 11v10M15 3v18M15 3c4 2 4 8 0 10"/></IconBase>}
export function CakeIcon(props: IconProps){return <IconBase {...props}><path d="M4 11h16v10H4zM7 11V8h10v3M12 8V5M10 4c.7-1.3 1.3-1.3 2 0s1.3 1.3 2 0"/><path d="M4 15c2 1.5 4 1.5 6 0 2 1.5 4 1.5 6 0 1.3 1 2.7 1.2 4 .5"/></IconBase>}
export function CameraIcon(props: IconProps){return <IconBase {...props}><path d="M4 7h4l1.5-2h5L16 7h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/></IconBase>}
export function MusicIcon(props: IconProps){return <IconBase {...props}><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></IconBase>}
export function CardIcon(props: IconProps){return <IconBase {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h6"/></IconBase>}
export function BeautyIcon(props: IconProps){return <IconBase {...props}><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8z"/></IconBase>}
export function BellIcon(props: IconProps){return <IconBase {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></IconBase>}
export function PlusIcon(props: IconProps){return <IconBase {...props}><path d="M12 5v14M5 12h14"/></IconBase>}
export function FlowerIcon(props: IconProps){return <IconBase {...props}><path d="M12 11c-3-1-5-3-4.5-5.2C8 3.8 10.2 4 12 7c1.8-3 4-3.2 4.5-1.2C17 8 15 10 12 11Z"/><path d="M12 11c3-1 5 .2 5.2 2.3.2 2-2 3-5.2 1.2-3.2 1.8-5.4.8-5.2-1.2C7 11.2 9 10 12 11Z"/><path d="M12 14.5V21"/></IconBase>}
export function BalloonIcon(props: IconProps){return <IconBase {...props}><ellipse cx="9" cy="8" rx="4" ry="5"/><ellipse cx="16.5" cy="9.5" rx="3.5" ry="4.5"/><path d="m9 13-1 2h2l-1-2Zm7.5 1-1 2h2l-1-2ZM9 15c0 3 4 2 4 6m3.5-5c0 2-2 2-2 5"/></IconBase>}
export function CocktailIcon(props: IconProps){return <IconBase {...props}><path d="M4 4h16l-8 9-8-9Z"/><path d="M12 13v7m-4 0h8M7 7h10"/></IconBase>}
export function VideoIcon(props: IconProps){return <IconBase {...props}><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></IconBase>}
export function PhoneCameraIcon(props: IconProps){return <IconBase {...props}><rect x="6" y="2" width="12" height="20" rx="2"/><circle cx="12" cy="11" r="3"/><path d="M10 5h4m-2 14h.01"/></IconBase>}
export function SignIcon(props: IconProps){return <IconBase {...props}><path d="M5 4h14v10H5zM12 14v7M8 21h8"/><path d="M8 8h8"/></IconBase>}
export function SofaIcon(props: IconProps){return <IconBase {...props}><path d="M5 12V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4"/><path d="M4 11a2 2 0 0 0-2 2v5h20v-5a2 2 0 0 0-2-2M6 18v3m12-3v3"/></IconBase>}
export function TableIcon(props: IconProps){return <IconBase {...props}><path d="M3 8h18v5H3zM6 13v8m12-8v8"/></IconBase>}
export function TentIcon(props: IconProps){return <IconBase {...props}><path d="M3 20 12 4l9 16H3Z"/><path d="m12 4 3 16m-6 0 3-8 3 8"/></IconBase>}
export function TruckIcon(props: IconProps){return <IconBase {...props}><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></IconBase>}
export function ChefHatIcon(props: IconProps){return <IconBase {...props}><path d="M7 11a4 4 0 1 1 2-7 4 4 0 0 1 6 0 4 4 0 1 1 2 7v8H7v-8Z"/><path d="M7 15h10"/></IconBase>}
export function CookieIcon(props: IconProps){return <IconBase {...props}><path d="M20 13a8 8 0 1 1-9-9 4 4 0 0 0 5 5 4 4 0 0 0 4 4Z"/><path d="M8 10h.01M11 16h.01M6 15h.01"/></IconBase>}
export function ImageFrameIcon(props: IconProps){return <IconBase {...props}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m4 17 5-5 4 4 2-2 5 5"/></IconBase>}
export function GiftIcon(props: IconProps){return <IconBase {...props}><path d="M3 10h18v11H3zM2 6h20v4H2zM12 6v15"/><path d="M12 6c-4 0-5-1.5-4-3 1-1.4 3.5 0 4 3Zm0 0c4 0 5-1.5 4-3-1-1.4-3.5 0-4 3Z"/></IconBase>}
export function PaintIcon(props: IconProps){return <IconBase {...props}><path d="M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h3a5 5 0 0 0 5-5c0-3-4-5-9-5Z"/><path d="M7 9h.01M9 6h.01M15 6h.01"/></IconBase>}
export function MicrophoneIcon(props: IconProps){return <IconBase {...props}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8"/></IconBase>}
export function PenIcon(props: IconProps){return <IconBase {...props}><path d="m4 20 4-1 11-11-3-3L5 16l-1 4ZM14 7l3 3"/></IconBase>}
export function MakeupIcon(props: IconProps){return <IconBase {...props}><path d="M8 3h5v9H8zM7 12h7v9H7zM17 4l2 2-4 7-2-2 4-7Z"/></IconBase>}
