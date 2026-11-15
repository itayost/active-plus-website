"use client";

import { useEffect, useState } from "react";

function freshSwitchInHead() {
  const label = document.createElement("label");
  label.style.display = "none";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  label.appendChild(input);
  document.head.appendChild(label);
  label.click();
  label.remove();
}

function switchInBodyInput() {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.style.cssText = "position:fixed;bottom:0;left:0;width:40px;height:24px;opacity:0.01";
  document.body.appendChild(input);
  input.click();
  setTimeout(() => input.remove(), 300);
}

const box = "block w-full rounded-2xl border-2 border-slate-300 bg-white p-5 text-right text-lg font-semibold active:bg-slate-100";

export default function HapticsTest() {
  const [info, setInfo] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const note = (s: string) => setLog((l) => [`${new Date().toLocaleTimeString("he-IL")} ${s}`, ...l].slice(0, 8));

  useEffect(() => {
    setInfo(`${navigator.userAgent} | vibrate: ${typeof navigator.vibrate === "function" ? "יש" : "אין"}`);
  }, []);

  return (
    <main dir="rtl" className="mx-auto max-w-md space-y-4 p-5">
      <h1 className="text-2xl font-bold">בדיקת רטט באייפון</h1>
      <p className="text-slate-600">לחצו על כל אחד ותגידו לי באיזה הרגשתם רטט (מספר).</p>

      <label className={`${box} flex items-center justify-between`}>
        <span>1. מתג אמיתי (ללחוץ עליו ישירות)</span>
        <input type="checkbox" {...{ switch: "" }} onChange={() => note("1")} />
      </label>

      <button type="button" className={box} onClick={() => { freshSwitchInHead(); note("2"); }}>
        2. כפתור, מתג נסתר חדש (מה שיש עכשיו באתר)
      </button>

      <button type="button" className={box} onClick={() => { switchInBodyInput(); note("3"); }}>
        3. כפתור, מתג שקוף בתוך הדף
      </button>

      <label className={`${box} relative block`} onClick={() => note("4")}>
        4. כל הכפתור הוא מתג נסתר (הלחיצה עצמה על המתג)
        <input type="checkbox" {...{ switch: "" }} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>

      <div className="rounded-xl bg-slate-100 p-3 text-xs text-slate-600">
        <p>נלחץ: {log.join(" · ") || "עוד כלום"}</p>
        <p className="mt-2 break-all" dir="ltr">{info}</p>
      </div>
    </main>
  );
}
