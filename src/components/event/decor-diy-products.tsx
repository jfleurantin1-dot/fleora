"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { MAX_DECOR_PRODUCTS, webUrl, type DecorProduct } from "@/lib/decor-products";

type Photo = {id:string;url:string;itemKey:string};
type Store = { products: Record<string,DecorProduct[]>; setProducts:(key:string,products:DecorProduct[])=>void };
const ProductsContext = createContext<Store | null>(null);
const field = "mt-1 w-full min-w-0 rounded-lg border border-plum-200 bg-white px-3 py-2.5 text-sm font-normal text-ink-900 outline-none focus:border-plum-600 focus:ring-2 focus:ring-plum-100";
const action = "rounded-lg bg-brand px-3 py-2.5 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-hover disabled:opacity-50 active:scale-[.98]";
const empty = ():DecorProduct => ({id:crypto.randomUUID(),url:"",name:"",retailer:"",quantity:1,price:"",currency:"USD",image:""});

export function DecorDiyProvider({initial,children}:{initial:Record<string,DecorProduct[]>;children:ReactNode}) {
  const [products,setProducts] = useState(initial);
  return <ProductsContext.Provider value={{products,setProducts:(key,items)=>setProducts(prev=>({...prev,[key]:items}))}}>{children}</ProductsContext.Provider>;
}

function Preview({src,name,className=""}:{src:string;name:string;className?:string}) {
  const [failed,setFailed] = useState(false);
  useEffect(()=>setFailed(false),[src]);
  return webUrl(src) && !failed ? <img src={src} alt={name || "Decor item"} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)} className={`h-full w-full object-contain ${className}`}/> : <div className="flex h-full min-h-24 items-center justify-center p-3 text-center text-xs text-ink-500">{src ? "Preview unavailable" : "Add a picture link"}</div>;
}

export function DecorDiyProducts({eventId,itemKey}:{eventId:string;itemKey:string}) {
  const store = useContext(ProductsContext)!;
  const products = store.products[itemKey] || [];
  // A blank link bar is displayed without creating a saved product.
  const [blankId] = useState(`new-${itemKey}`);
  const rows = products.length ? products : [{id:blankId,url:"",name:"",retailer:"",quantity:1,price:"",currency:"USD",image:""}];
  const [pending,setPending] = useState<string|null>(null);
  const [messages,setMessages] = useState<Record<string,string>>({});
  const [expanded,setExpanded] = useState<Record<string,boolean>>({});
  const current = useRef(rows); current.current=rows;
  function update(id:string,patch:Partial<DecorProduct>) {store.setProducts(itemKey,current.current.map(p=>p.id===id?{...p,...patch}:p));}
  async function fill(item:DecorProduct) {
    if (!webUrl(item.url)) {setMessages(m=>({...m,[item.id]:"Paste an https product link first."}));return;}
    setExpanded(e=>({...e,[item.id]:true}));setPending(item.id);setMessages(m=>({...m,[item.id]:"Looking up this item…"}));
    try {
      const response = await fetch("/api/decor-product",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId,url:item.url}),signal:AbortSignal.timeout(12000)});
      const data = await response.json();
      const latest=current.current.find(p=>p.id===item.id);
      if (!latest || latest.url!==item.url) return;
      const patch:Partial<DecorProduct>={};
      for(const key of ["name","retailer","price","image"] as const) if(!latest[key] && typeof data[key]==="string") patch[key]=data[key];
      if(!latest.price && data.price && data.currency) patch.currency=data.currency;
      update(item.id,patch);
      setMessages(m=>({...m,[item.id]:data.error || "Available details added. Check the picture and price before saving."}));
    } catch {setMessages(m=>({...m,[item.id]:"We couldn’t read that link. You can enter the details below."}));}
    finally {setPending(null);}
  }
  return <fieldset data-choice-details-for={itemKey} data-choice-value="diy" className="mt-4 rounded-xl border border-plum-100 bg-brand-soft p-4">
    <p className="text-sm font-semibold">Your DIY shopping ideas</p>
    <p className="mt-1 text-xs leading-relaxed text-ink-600">Start with a product link. Add the details you need and see the pictures together below.</p>
    <input type="hidden" name={`diy_products__${itemKey}`} value={JSON.stringify(products)}/>
    <div className="mt-3 space-y-4">{rows.map((item,index)=><div key={item.id} className="min-w-0 rounded-lg border border-plum-100 bg-white p-3">
      <label className="block text-xs font-semibold">Product link {index+1}<input aria-label={`Product link ${index+1}`} type="url" value={item.url} placeholder="https://www.amazon.com/…" maxLength={2048} onChange={e=>update(item.id,{url:e.target.value,name:"",retailer:"",price:"",image:""})} className={field}/></label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" disabled={!!pending || !item.url} onClick={()=>fill(item)} className={action}>{pending===item.id?"Finding details…":"Auto-fill details"}</button>
        <button type="button" onClick={()=>setExpanded(v=>({...v,[item.id]:!v[item.id]}))} className="px-2 py-2.5 text-xs font-semibold text-plum-700" aria-expanded={!!expanded[item.id]}>Edit details</button>
        {(products.length>0) && <button type="button" disabled={pending===item.id} onClick={()=>store.setProducts(itemKey,products.filter(p=>p.id!==item.id))} aria-label={`Remove item ${index+1}`} className="ml-auto px-2 py-2.5 text-xs text-ink-600">Remove</button>}
      </div>
      {messages[item.id] && <p role="status" className="mt-2 text-xs leading-relaxed text-ink-600">{messages[item.id]}</p>}
      {(expanded[item.id] || item.name || item.image || item.price) && <div className="mt-3 space-y-3 border-t border-plum-100 pt-3">
        <div className="flex items-start gap-3"><div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-brand-soft"><Preview src={item.image} name={item.name}/></div><label className="min-w-0 flex-1 text-xs font-semibold">Item name<input value={item.name} maxLength={200} onChange={e=>update(item.id,{name:e.target.value})} className={field}/></label></div>
        <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold">Quantity needed<input type="number" min="1" max="100000" step="1" value={item.quantity || ""} onChange={e=>update(item.id,{quantity:Number(e.target.value)})} className={field}/></label><label className="text-xs font-semibold">Unit price<input type="number" min="0" max="10000000" step="0.01" value={item.price} onChange={e=>update(item.id,{price:e.target.value})} placeholder="0.00" className={field}/></label></div>
        <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold">Website / store<input value={item.retailer} maxLength={100} placeholder="Amazon" onChange={e=>update(item.id,{retailer:e.target.value})} className={field}/></label><label className="text-xs font-semibold">Currency<input value={item.currency} maxLength={3} placeholder="USD" onChange={e=>update(item.id,{currency:e.target.value.toUpperCase()})} className={field}/></label></div>
        <label className="block text-xs font-semibold">Picture link<input type="url" value={item.image} maxLength={2048} placeholder="https://…/photo.jpg" onChange={e=>update(item.id,{image:e.target.value})} className={field}/></label>
        {item.price!=="" && <p className="text-sm font-semibold">Estimated total: {item.currency} {(Number(item.price)*item.quantity).toFixed(2)} <span className="block text-xs font-normal text-ink-500">Before shipping and tax. Price per item or pack you’re buying.</span></p>}
      </div>}
    </div>)}</div>
    <button type="button" disabled={products.length>=MAX_DECOR_PRODUCTS || !!pending} onClick={()=>store.setProducts(itemKey,[...rows,empty()])} className="mt-3 rounded-lg px-2 py-2.5 text-sm font-semibold text-plum-700">+ Add another link</button>
    <p className="mt-1 text-xs text-ink-500">Saved with your decor plan. Up to 20 items per element.</p>
  </fieldset>;
}

export function DecorCollage({photos,initialActive,initialDiy}:{photos:Photo[];initialActive:string[];initialDiy:string[]}) {
  const {products} = useContext(ProductsContext)!;
  const marker=useRef<HTMLElement>(null);
  const [active,setActive]=useState(initialActive), [diy,setDiy]=useState(initialDiy);
  const [localPhotos,setLocalPhotos]=useState(photos);
  useEffect(()=>setLocalPhotos(photos),[photos]);
  useEffect(()=>{
    const form=marker.current?.closest("form");if(!form)return;
    const sync=()=>{const skip=form.querySelector<HTMLInputElement>('input[name="no_decor"]')?.checked;const keys=skip?[]:Array.from(form.querySelectorAll<HTMLInputElement>('input[name^="selected__"]:checked')).map(i=>i.name.replace("selected__",""));setActive(keys);setDiy(keys.filter(key=>form.querySelector<HTMLInputElement>(`input[name="choice__${key}"]:checked`)?.value==="diy"));};
    const photoUpdate=(e:Event)=>{const detail=(e as CustomEvent).detail;setLocalPhotos(prev=>[...prev.filter(p=>p.itemKey!==detail.itemKey),...detail.photos.map((p:Photo)=>({...p,itemKey:detail.itemKey}))]);};
    form.addEventListener("change",sync);form.addEventListener("decor-photos-updated",photoUpdate);sync();
    return()=>{form.removeEventListener("change",sync);form.removeEventListener("decor-photos-updated",photoUpdate);};
  },[]);
  const images=[...Object.entries(products).filter(([key])=>diy.includes(key)).flatMap(([,items])=>items.filter(p=>webUrl(p.image)).map(p=>({id:p.id,url:p.image,name:p.name || p.retailer || "DIY decor",link:webUrl(p.url)}))),...localPhotos.filter(p=>active.includes(p.itemKey)).map(p=>({id:p.id,url:p.url,name:"Decor inspiration",link:""}))];
  return <section ref={marker} className="rounded-xl border border-plum-100 bg-brand-soft p-5 sm:p-7" aria-label="Decor collage"><p className="fleora-kicker">The whole look</p><h2 className="mt-1 text-2xl font-medium">Your decor collage.</h2><p className="mt-2 text-sm text-ink-600">Your DIY item pictures and inspiration, all together. Changes appear here as you plan.</p>
    {images.length ? <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{images.map(p=><figure key={p.id} className="overflow-hidden rounded-xl bg-white p-2"><div className="aspect-square overflow-hidden rounded-lg"><Preview src={p.url} name={p.name}/></div><figcaption className="px-1 py-2 text-xs font-medium">{p.link?<a href={p.link} target="_blank" rel="noopener noreferrer" className="hover:underline">{p.name}</a>:p.name}</figcaption></figure>)}</div>:<div className="mt-5 rounded-lg border border-dashed border-plum-200 bg-white p-8 text-center text-sm text-ink-500">Add an item picture or upload inspiration to start your collage.</div>}
  </section>;
}
