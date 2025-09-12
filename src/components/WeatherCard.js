// src/components/WeatherCard.jsx
import { useEffect, useMemo, useState } from "react";
import {
  TiWeatherSunny, //맑음 
  TiWeatherCloudy,        // 흐림
  TiWeatherPartlySunny,   //  구름 조금
  TiWeatherWindyCloudy,   // 바람
  TiWeatherDownpour,      // 비 내림
  TiWeatherSnow,          // 눈
} from "react-icons/ti";

import {
  WiFog, // 안개
  WiThunderstorm, // 번개/천둥 
  WiShowers, // 소나기 
  WiSnowWind, // 폭설 
} from "react-icons/wi";


/* ------------------ 매핑 로직: OpenWeather id → {label, icon} ------------------ */
// 우선순위: 번개/비/소나기/눈(강수) > 구름/맑음 > 바람(강풍 표시용 부가조건)
function mapWeatherToIcon(data) {
  const id = Number(data?.weather?.[0]?.id ?? 0);
  const snow1h = Number(data?.snow?.["1h"] ?? 0);
  const rain1h = Number(data?.rain?.["1h"] ?? 0);
  const rain3h = Number(data?.rain?.["3h"] ?? 0);

  // 번개/천둥
  if (id >= 200 && id <= 232) return { label: "번개/천둥", icon: <WiThunderstorm /> };

  // 소나기/이슬비
  if ((id >= 300 && id <= 321) || (id >= 520 && id <= 531)) {
    return { label: "소나기", icon: <WiShowers /> };
  }

  // 비
  if ((id >= 500 && id <= 504) || id === 511 || rain1h > 0 || rain3h > 0) {
    return { label: "비 내림", icon: <TiWeatherDownpour /> };
  }

  // 눈/폭설
  if (id >= 600 && id <= 622) {
    if (snow1h > 2.5 || id === 602 || id === 622) {
      return { label: "폭설", icon: <WiSnowWind /> };
    }
    return { label: "눈", icon: <TiWeatherSnow /> };
  }

  // 안개/연무
  if (id >= 700 && id <= 781) return { label: "안개", icon: <WiFog /> };

  // 맑음/구름
  if (id === 800) return { label: "맑음", icon: <TiWeatherSunny /> };
  if (id === 801) return { label: "구름 조금", icon: <TiWeatherPartlySunny /> };
  if (id === 802) return { label: "구름 많음", icon: <TiWeatherPartlySunny /> };
  if (id === 803) return { label: "대체로 흐림", icon: <TiWeatherCloudy /> };
  if (id === 804) return { label: "흐림", icon: <TiWeatherCloudy /> };

  return { label: "흐림", icon: <TiWeatherCloudy /> };
}

/* ------------------ WeatherCard 컴포넌트 ------------------ */
export default function WeatherCard({
  lat = 37.5665,
  lon = 126.9780,
  showTemp = true,     // 온도 표시
  showDesc = false,    // OpenWeather 원문 설명(description) 같이 표시할지
}) {
  const [data, setData] = useState(null);
  const [temp, setTemp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const API_KEY = process.env.REACT_APP_OPENWEATHER_KEY;

  const url = useMemo(() =>
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}` +
    `&appid=${API_KEY}&units=metric&lang=kr`, [lat, lon, API_KEY]
  );
  useEffect(() => {
    if (data) {
      console.log("Weather Debug:", data.weather?.[0]);
      // 예: { id: 801, main: "Clouds", description: "대체로 흐림", icon: "02d" }
    }
  }, [data]);

  useEffect(() => {
    if (!API_KEY) {
      setErr("API 키 없음 (.env에 REACT_APP_OPENWEATHER_KEY)");
      setLoading(false);
      return;
    }


    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
        setTemp(Number(json?.main?.temp ?? 0).toFixed(1));
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setErr("날씨 불러오기 실패");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [url, API_KEY]);

  const v = data ? mapWeatherToIcon(data) : null;

  return (
    <div className="weather-card">
      <div className="weather-header">Today's weather</div>

      {loading ? (
        <div className="weather-body">불러오는 중…</div>
      ) : err ? (
        <div className="weather-body">{err}</div>
      ) : (
        <div className="weather-body" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", fontSize: 24 }}>
            {v?.icon}
          </span>
          <span className="weather-desc">
            {/* {showTemp && temp !== null ? `${temp}℃ ` : ""} */}
            {v?.label}
            {showDesc && data?.weather?.[0]?.description ? ` · ${data.weather[0].description}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
