import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (hash) return; // #anchor 이동은 브라우저 기본 동작 유지
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname, key, hash]);
  return null;
}