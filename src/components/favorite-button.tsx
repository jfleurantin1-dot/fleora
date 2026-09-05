"use client";
import {useTransition} from "react";
import {HeartIcon} from "@/components/icons";
import {toggleFavorite} from "@/app/(app)/vendors/browse/actions";
export function FavoriteButton({vendorId,initial=false}:{vendorId:string;initial?:boolean}){const[pending,start]=useTransition();return <button type="button" disabled={pending} aria-label={initial?"Remove from saved vendors":"Save vendor"} onClick={(e)=>{e.preventDefault();e.stopPropagation();start(async()=>{await toggleFavorite(vendorId,!initial);location.reload();});}} className={`grid h-10 w-10 place-items-center rounded-full border backdrop-blur transition ${initial?"border-plum-200 bg-plum-500 text-white":"border-white/70 bg-white/90 text-plum-700 hover:bg-plum-50"}`}><HeartIcon size={18} fill={initial?"currentColor":"none"}/></button>}
