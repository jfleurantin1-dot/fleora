import {
  BeautyIcon, BuildingIcon, CakeIcon, CameraIcon, CardIcon, ChairIcon, ChefHatIcon,
  CocktailIcon, CookieIcon, FlowerIcon, GiftIcon, ImageFrameIcon, MakeupIcon, MusicIcon,
  PaintIcon, PhoneCameraIcon, SignIcon, SofaIcon, TableIcon, TentIcon, TruckIcon,
  UtensilsIcon, VideoIcon, BalloonIcon, MicrophoneIcon, PenIcon
} from "@/components/icons";
import type { ComponentType, SVGProps } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & {size?:number}>;
const icons: Record<string, IconComponent> = {
  venue: BuildingIcon, event_styling: PaintIcon, balloons: BalloonIcon, backdrops: ImageFrameIcon,
  florals: FlowerIcon, flower_walls: FlowerIcon, props: GiftIcon, signage: SignIcon,
  chairs: ChairIcon, tables: TableIcon, linens: TableIcon, lounge_furniture: SofaIcon, tents: TentIcon,
  dinnerware: UtensilsIcon, specialty_rentals: GiftIcon, private_chef: ChefHatIcon, catering: ChefHatIcon,
  charcuterie: UtensilsIcon, bartender: CocktailIcon, mobile_bar: CocktailIcon, food_truck: TruckIcon,
  cake: CakeIcon, cupcakes: CakeIcon, cookies: CookieIcon, cake_pops: CakeIcon, sweet_treats: CookieIcon,
  photography: CameraIcon, videography: VideoIcon, content_creator: PhoneCameraIcon, photobooth: CameraIcon,
  dj: MusicIcon, musician: MusicIcon, kids_entertainment: MicrophoneIcon, face_painter: PaintIcon,
  stationery: CardIcon, calligraphy: PenIcon, hair: BeautyIcon, makeup: MakeupIcon,
};
export function CategoryIcon({category,size=26,className}:{category:string;size?:number;className?:string}){
  const Icon=icons[category] ?? CardIcon;
  return <Icon size={size} className={className}/>;
}
