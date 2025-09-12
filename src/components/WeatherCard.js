// src/components/WeatherCard.jsx
import { useEffect, useState, useMemo } from "react";
// 네가 원하는 아이콘 세트 (ti)
import {
  TiWeatherCloudy,        // 흐림
  TiWeatherPartlySunny,   // 맑음 / 구름 조금
  TiWeatherWindyCloudy,   // 바람
  TiWeatherDownpour,      // 비
  TiWeatherSnow,          // 눈
} from "react-icons/ti";
// 없던 타입은 보완 (wi)
import {
  WiFog,                  // 안개
  WiThunderstorm,         // 번개/천둥
  WiShowers,              // 소나기
  WiSnowWind,             // 폭설
} from "react-icons/wi";

/* ---------- OpenWeather → 10가지 표현 + 아이콘(React 요소) ---------- */
function mapWeatherToTen(data) {
  const id = Number(data?.weather?.[0]?.id ?? 0);
  const wind = Number(data?.wind?.speed ?? 0);
  const snow1h = Number(data?.snow?.["1h"] ?? 0);

  // 바람(우선 판정)
  if (wind >= 8) return view("바람", <TiWeatherWindyCloudy />);

  // 번개/천둥
  if (id >= 200 && id < 300) return view("번개/천둥", <WiThunderstorm />);

  // 소나기 (이슬비 + 샤워 레인)
  if ((id >= 300 && id < 322) || [520, 521, 522, 531].includes(id))
    return view("소나기", <WiShowers />);

  // 비
  if (id >= 500 && id < 600) return view("비", <TiWeatherDownpour />);

  // 눈/폭설
  if (id >= 600 && id < 700) {
    if (snow1h > 2.5 || id === 622 || id === 602)
      return view("폭설", <WiSnowWind />);
    return view("눈", <TiWeatherSnow />);
  }

  // 안개/연무
  if (id >= 700 && id < 800) return view("안개", <WiFog />);

  // 맑음/구름
  if (id === 800) return view("맑음", <TiWeatherPartlySunny />);
  if (id > 800) {
    if (id === 801 || id === 802) return view("구름 조금", <TiWeatherPartlySunny />);
    return view("흐림", <TiWeatherCloudy />);
  }

  // 기본값
  return view("흐림", <TiWeatherCloudy />);
}

function view(labelKo, iconEl) {
  return { labelKo, iconEl };
}

/* ---------- WeatherCard 컴포넌트 ---------- */
export default function WeatherCard({
  lat = 37.5665,
  lon = 126.9780,
 
}) {
  const [data, setData] = useState(null);
  const [temp, setTemp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const API_KEY = process.env.REACT_APP_OPENWEATHER_KEY;

  const url = useMemo(
    () =>
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}` +
      `&appid=${API_KEY}&units=metric&lang=kr`,
    [lat, lon, API_KEY]
  );

  useEffect(() => {
    if (!API_KEY) {
      setErr("API 키 없음(.env: REACT_APP_OPENWEATHER_KEY)");
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

  const v = data ? mapWeatherToTen(data) : null;

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
            {v?.iconEl}
          </span>
           <span className="weather-desc">{v?.labelKo}</span>
          {/* {temp !== null && <span className="weather-temp">{temp}℃</span>}  */}
        </div>
      )}
    </div>
  );
}
