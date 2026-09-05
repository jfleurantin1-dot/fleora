"use client";
import { useEffect, useState } from "react";
export function TimeGreeting({name}:{name:string}){
  const [greeting,setGreeting]=useState("Hello");
  useEffect(()=>{const h=new Date().getHours();setGreeting(h<12?"Good morning":h<17?"Good afternoon":"Good evening")},[]);
  return <>{greeting}, {name}</>;
}
