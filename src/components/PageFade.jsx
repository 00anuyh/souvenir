import { useLocation } from "react-router-dom";

export default function PageFade({ children }) {
  const { pathname } = useLocation();
  // pathname을 key로 주면 라우트 변경 때마다 animate
  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  );
}