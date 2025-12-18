import { useEffect } from "react";
import { CHARACTERS } from "../constants/characters";
export const useImagePreloader = () => {
  useEffect(() => {
    const preloadImages = async () => {
      const allImages = CHARACTERS.map((c) => c.img);
      // Deduplicate
      const uniqueImages = [...new Set(allImages)];
      await Promise.all(
        uniqueImages.map((src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = reject;
          });
        }),
      );
    };
    // Fire and forget, don't block render
    preloadImages();
  }, []);
};
