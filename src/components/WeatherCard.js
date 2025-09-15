// src/components/WeatherCard.jsx
import { useEffect, useMemo, useState } from "react";
import {
  TiWeatherSunny, TiWeatherCloudy, TiWeatherPartlySunny,
  TiWeatherDownpour, TiWeatherSnow,
} from "react-icons/ti";
import { WiFog, WiThunderstorm, WiShowers, WiSnowWind } from "react-icons/wi";

/* -------- OpenWeather 코드 기반 단순 매핑 -------- */
function mapByWeatherId(d) {
  const id   = Number(d?.weather?.[0]?.id ?? 0);
  const main = String(d?.weather?.[0]?.main ?? "").toLowerCase();

  if ((id >= 200 && id <= 232) || main === "thunderstorm")
    return { label: "번개/천둥", icon: <WiThunderstorm /> };
  if ((id >= 300 && id <= 321) || main === "drizzle")
    return { label: "소나기", icon: <WiShowers /> };
  if ((id >= 500 && id <= 531) || main === "rain") {
    if (id >= 520 && id <= 531) return { label: "소나기", icon: <WiShowers /> };
    return { label: "비 내림", icon: <TiWeatherDownpour /> };
  }
  if ((id >= 600 && id <= 622) || main === "snow") {
    if (id === 602 || id === 622) return { label: "폭설", icon: <WiSnowWind /> };
    return { label: "눈", icon: <TiWeatherSnow /> };
  }
  if (id >= 700 && id <= 781) return { label: "안개", icon: <WiFog /> };
  if (id === 800 || main === "clear") return { label: "맑음", icon: <TiWeatherSunny /> };
  if (id === 801 || id === 802) return { label: "구름 조금", icon: <TiWeatherPartlySunny /> };
  if (id === 803 || id === 804 || main === "clouds")
    return { label: "흐림", icon: <TiWeatherCloudy /> };
  return { label: "날씨 정보", icon: <TiWeatherSunny /> };
}

/* ---------------------- WeatherCard ---------------------- */
export default function WeatherCard({
  // props는 유지하지만, 지금은 고정 URL을 사용하므로 lat/lon/units는 무시됨
  lat = 37.3083993,
  lon = 126.8510591,
  units = "metric",
  lang = "kr",
  showTemp = true,
  showDesc = false,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ 요청한 고정 URL (https + units=metric + lang=kr)
  const url = useMemo(
    () =>
      "https://api.openweathermap.org/data/2.5/weather" +
      "?lat=37.3083993&lon=126.8510591" +
      "&appid=81519183286b627d1acbdfa99c4b8ad3" +
      "&units=metric&lang=kr",
    []
  );

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("[Weather] fetch failed:", e);
          setErr("날씨 불러오기 실패");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [url]);

  const mapped = data ? mapByWeatherId(data) : null;
  const temp = data?.main?.temp;
  const unitSymbol = "℃"; // 고정 URL이 metric이므로 섭씨 고정

  return (
    <div className="weather-card">
      <div className="weather-header">Today's weather</div>

      {loading ? (
        <div className="weather-body">불러오는 중…</div>
      ) : err ? (
        <div className="weather-body">{err}</div>
      ) : (
        <div className="weather-body" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", fontSize: 30 }}>
            {mapped?.icon}
          </span>
          <span className="weather-desc">
            {mapped?.label}
            {showDesc && data?.weather?.[0]?.description ? ` · ${data.weather[0].description}` : ""}
            {" \u00A0·\u00A0 "}
            {showTemp && typeof temp === "number" ? `${temp.toFixed(1)}${unitSymbol}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
