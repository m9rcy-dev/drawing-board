import { useState, useEffect, useCallback } from "react";

interface WindowSize {
  width: number;
  height: number;
}

export const useWindowSize = (): WindowSize => {
  const getSize = (): WindowSize => ({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const [size, setSize] = useState<WindowSize>(getSize);

  const handleResize = useCallback(() => {
    setSize(getSize());
  }, []);

  useEffect(() => {
    let rafId: number;
    const debouncedResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleResize);
    };

    window.addEventListener("resize", debouncedResize, { passive: true });
    return () => {
      window.removeEventListener("resize", debouncedResize);
      cancelAnimationFrame(rafId);
    };
  }, [handleResize]);

  return size;
};
