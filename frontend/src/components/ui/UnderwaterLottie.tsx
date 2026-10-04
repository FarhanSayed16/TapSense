"use client";

import { useCallback, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { DotLottie } from "@lottiefiles/dotlottie-react";

/**
 * Full-bleed underwater scene for the login hero.
 * Uses `layout.fit = cover` so the animation owns the whole panel.
 */
export function UnderwaterLottie() {
  const [ready, setReady] = useState(false);

  const dotLottieRefCallback = useCallback((dotLottie: DotLottie | null) => {
    if (!dotLottie) return;
    dotLottie.addEventListener("load", () => setReady(true));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Soft placeholder while .lottie boots */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-[#0a2740] via-[#0d3a58] to-[#14506e] transition-opacity duration-700 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      />
      <DotLottieReact
        src="/underwater.lottie"
        loop
        autoplay
        backgroundColor="transparent"
        dotLottieRefCallback={dotLottieRefCallback}
        className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: "100%", height: "100%" }}
        layout={{
          fit: "cover",
          // Slightly above true center so coral/fish fill both top and bottom.
          align: [0.5, 0.42],
        }}
        renderConfig={{
          autoResize: true,
        }}
      />
    </div>
  );
}
