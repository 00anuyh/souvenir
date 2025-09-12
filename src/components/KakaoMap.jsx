import { useEffect, useRef } from "react";

const loadKakao = (() => {
  let promise;
  return () => {
    if (typeof window !== "undefined" && window.kakao?.maps) {
      return Promise.resolve(window.kakao);
    }
    if (promise) return promise;

    const src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=b51d92069252b58778a750cf57874813&libraries=services&autoload=false`;

    promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => {
        if (!window.kakao?.maps) {
          reject(new Error("[KakaoMap] kakao.maps 가 없습니다."));
          return;
        }
        window.kakao.maps.load(() => resolve(window.kakao));
      };
      script.onerror = () => reject(new Error("[KakaoMap] Kakao SDK 로드 실패"));
      document.head.appendChild(script);
    });

    return promise;
  };
})();

function KakaoMap({
  address,
  lat,
  lng,
  level = 3,
  markerTitle = "젠컴 퓨터아카데미+안산교육센터", // ★ 기본 타이틀
  className = "",
  style = { width: "100%", height: 360 },
}) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // ★ 보내준 이미지(구글 링크) 좌표를 기본값으로 지정
  const DEFAULT_LAT = 37.3083993;
  const DEFAULT_LNG = 126.8510591;

  useEffect(() => {
    let mounted = true;
    let ro, io;

    loadKakao().then((kakao) => {
      if (!mounted || !boxRef.current || !kakao?.maps) return;

      const ensureMap = () => {
        const w = boxRef.current.offsetWidth;
        const h = boxRef.current.offsetHeight;
        if (w < 10 || h < 10) return;

        if (!mapRef.current) {
          const center = new kakao.maps.LatLng(
            lat ?? DEFAULT_LAT,    // ★ 기본: 37.3083993
            lng ?? DEFAULT_LNG     // ★ 기본: 126.8510591
          );
          mapRef.current = new kakao.maps.Map(boxRef.current, { center, level });
        }

        const map = mapRef.current;

        const putMarker = (pos) => {
          if (markerRef.current) markerRef.current.setMap(null);
          markerRef.current = new kakao.maps.Marker({ position: pos, map, title: markerTitle });
          map.setCenter(pos);
        };

        if (lat != null && lng != null) {
          // 위도/경도가 명시되면 그 위치로
          putMarker(new kakao.maps.LatLng(lat, lng));
        } else if (address) {
          // 주소가 있으면 지오코딩
          const geocoder = new kakao.maps.services.Geocoder();
          geocoder.addressSearch(address, (result, status) => {
            if (!mounted) return;
            if (status === kakao.maps.services.Status.OK && result?.[0]) {
              const pos = new kakao.maps.LatLng(result[0].y, result[0].x);
              putMarker(pos);
              setTimeout(() => map.relayout(), 0);
            } else {
              console.warn("[KakaoMap] 지오코딩 실패:", status, address);
              // ★ 지오코딩 실패 시에도 기본 좌표로
              putMarker(new kakao.maps.LatLng(DEFAULT_LAT, DEFAULT_LNG));
            }
          });
        } else {
          // ★ 주소/좌표 둘 다 없으면 기본 좌표로
          putMarker(new kakao.maps.LatLng(DEFAULT_LAT, DEFAULT_LNG));
        }

        setTimeout(() => map.relayout(), 0);
        setTimeout(() => map.relayout(), 300);
      };

      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => e.isIntersecting && ensureMap());
      });
      io.observe(boxRef.current);

      ro = new ResizeObserver(() => {
        if (!mapRef.current) ensureMap();
        else mapRef.current.relayout();
      });
      ro.observe(boxRef.current);

      ensureMap();
      const onResize = () => ensureMap();
      window.addEventListener("resize", onResize);

      return () => window.removeEventListener("resize", onResize);
    });

    return () => {
      mounted = false;
      ro?.disconnect();
      io?.disconnect();
    };
  }, [address, lat, lng, level, markerTitle]);

  return <div ref={boxRef} className={className} style={style} />;
}

export default KakaoMap;
export { KakaoMap };
