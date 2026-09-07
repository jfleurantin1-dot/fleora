"use client";
import { useEffect, useRef } from "react";

export function ChapterInteractions({ skipName, hasExistingData = false }: { skipName: string; hasExistingData?: boolean }) {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = marker.current?.closest("form");
    if (!form) return;
    const selectedInputs = () => Array.from(form.querySelectorAll<HTMLInputElement>('input[name^="selected__"]'));
    const skip = () => form.querySelector<HTMLInputElement>(`input[name="${skipName}"]`);
    const hasPlanningData = () => hasExistingData || selectedInputs().some(i => i.checked) || Array.from(form.querySelectorAll<HTMLTextAreaElement>("textarea")).some(t => t.value.trim().length > 0);
    const sync = () => {
      const skipChecked = Boolean(skip()?.checked);
      for (const input of selectedInputs()) {
        const key = input.name.replace("selected__", "");
        document.querySelectorAll<HTMLElement>(`[data-plan-details-for="${key}"]`).forEach((el) => el.hidden = skipChecked || !input.checked);
        document.querySelectorAll<HTMLElement>(`[data-choice-details-for="${key}"]`).forEach((el) => {
          const wanted = el.dataset.choiceValue;
          const radio = form.querySelector<HTMLInputElement>(`input[name="choice__${key}"]:checked`);
          el.hidden = skipChecked || !input.checked || radio?.value !== wanted;
        });
      }
      document.querySelectorAll<HTMLElement>(`[data-skip-message-for="${skipName}"]`).forEach((el)=>el.hidden=!skipChecked);
    };
    const onChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.name === skipName && target.checked) {
        if (hasPlanningData()) {
          const ok = window.confirm("Are you sure? When you save, all planning selections and chapter details you entered here will be erased. Existing bookings, quotes, payments and messages will NOT be cancelled or deleted.");
          if (!ok) { target.checked = false; sync(); return; }
        }
        selectedInputs().forEach((i) => { i.checked = false; });
      }
      if (target.name.startsWith("selected__") && target.checked) { const s=skip(); if(s) s.checked=false; }
      sync();
    };
    form.addEventListener("change", onChange);
    sync();
    return () => form.removeEventListener("change", onChange);
  }, [skipName, hasExistingData]);
  return <span ref={marker} className="hidden" aria-hidden="true" />;
}
