import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

import { grantSignupBonusOnce } from "../utils/rewards";
import { setSession } from "../utils/localStorage";

/* 외부 SDK 로더(중복 로드 방지) */
function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    if (id && document.getElementById(id)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    if (id) s.id = id;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

function mkUid(provider, profile = {}) {
  // Google: profile.sub (OIDC), profile.email
  // Kakao: res.id (숫자)
  // Naver: naver.user.id
  const sub = profile.sub || profile.id || profile.userId || "";
  const email = profile.email || "";
  if (sub) return `${provider}:${sub}`;
  if (email) return `${provider}:${email}`;
  // 최후 fallback
  return `${provider}:${Date.now()}`;
}

const SocialLogin = ({ onNaverReady }) => {
  const navigate = useNavigate();
  const { isLoggedIn, login, /* logout, */ setNaverInstance } = useAuth();
  const [isNaverInitialized, setIsNaverInitialized] = useState(false);

  /* SDK 자동 로드 + Kakao init */
  useEffect(() => {
    (async () => {
      try {
        await loadScript("https://accounts.google.com/gsi/client", "gsi-client");
        await loadScript("https://developers.kakao.com/sdk/js/kakao.js", "kakao-sdk");
        await loadScript("https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js", "naver-sdk");

        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(process.env.REACT_APP_KAKAO_JS_KEY || "dae52436cd93e2bc97a81580021ae5ea");
          console.log("Kakao SDK 초기화 완료");
        }
        setIsNaverInitialized(false); // 네이버 버튼 초기화 트리거
      } catch (e) {
        console.error("소셜 SDK 로드 실패:", e);
      }
    })();
  }, []);

  /* 네이버 버튼 초기화 (SDK가 #naverIdLogin 안에 a 태그/iframe 생성) */
  useEffect(() => {
    if (isNaverInitialized) return;
    if (!window.naver?.LoginWithNaverId) return;

    const el = document.getElementById("naverIdLogin");
    if (!el) return;
    el.innerHTML = ""; // 초기화

    const naver = new window.naver.LoginWithNaverId({
      clientId: process.env.REACT_APP_NAVER_CLIENT_ID || "THhrZojVhV58FwpUn3Se",
      callbackUrl: process.env.REACT_APP_NAVER_CALLBACK_URL || "https://00anuyh.github.io/souvenir/login",
      isPopup: false,
      loginButton: { color: "green", type: 3, height: 56 },
    });

    naver.init();
    setIsNaverInitialized(true);

    // 상위(Context)/부모에 인스턴스 공유
    setNaverInstance?.(naver);
    onNaverReady?.(naver);

    naver.getLoginStatus((status) => {
      if (status) {
        const nickname =
          naver?.user?.nickname ??
          naver?.user?.name ??
          naver?.user?.getNickName?.() ??
          "";
        login("naver", { name: nickname });
        navigate("/", { replace: true });
      }
    });
  }, [isNaverInitialized, login, onNaverReady, setNaverInstance, navigate]);

  const someoneElseLoggedIn = () =>
    (isLoggedIn?.google || isLoggedIn?.kakao || isLoggedIn?.naver);

  const handleNaverClick = () => {
    const a = document.querySelector('#naverIdLogin a, #naverIdLogin iframe');
    if (a) {
      const anchor = document.querySelector('#naverIdLogin a');
      if (anchor) anchor.click();
      else a.click();
    } else {
      alert("네이버 버튼이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  /* 구글: Token Flow로 userinfo에서 이름 가져오기 */
  const googleLogin = () => {
    if (someoneElseLoggedIn()) return alert("이미 다른 계정으로 로그인 중입니다.");
    if (!window.google?.accounts?.oauth2) return alert("구글 SDK 미로드");

    const clientId = process.env.REACT_APP_OAUTH_CLIENT;
    if (!clientId) return alert("구글 client_id(.env REACT_APP_OAUTH_CLIENT)가 필요합니다.");

   const tokenClient = window.google.accounts.oauth2.initTokenClient({
  client_id: clientId,
  scope: "openid email profile",
  callback: async (tokenResponse) => {
    try {
      const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const profile = await r.json();

      const uid = mkUid("google", profile); // ★ uid 생성
      const name =
        profile.name ||
        profile.given_name ||
        (profile.email ? profile.email.split("@")[0] : "Google 사용자");

      setSession(uid);               // ★ 세션 저장
      grantSignupBonusOnce(uid);     // ★ 최초 1회만 쿠폰+적립금 지급

      login("google", { uid, name, email: profile.email });
      navigate("/", { replace: true });
    } catch (err) {
      console.error("구글 userinfo 실패:", err);
      // 최소 정보로 uid 생성 (fallback)
      const uid = mkUid("google", { sub: "", email: "" });
      setSession(uid);
      grantSignupBonusOnce(uid);

      login("google", { uid, name: "Google 사용자" });
      navigate("/", { replace: true });
    }
  },
});

    // ★ 실제 토큰 요청
    tokenClient.requestAccessToken({ prompt: "consent" });
  };

  /* 카카오 */
  const kakaoLogin = () => {
    if (someoneElseLoggedIn()) return alert("이미 다른 계정으로 로그인 중입니다.");
    if (!window.Kakao?.Auth) return alert("카카오 SDK 미로드");

    window.Kakao.Auth.login({
      scope: "profile_nickname",
      success: () => {
       window.Kakao.API.request({
  url: "/v2/user/me",
  success: (res) => {
    console.log("카카오 응답:", res);

    const profile = { id: res?.id, email: res?.kakao_account?.email };
    const uid = mkUid("kakao", profile); // ★ uid 생성

    const nickname =
      res?.kakao_account?.profile?.nickname ??
      res?.properties?.nickname ??
      "Kakao 사용자";

    setSession(uid);               // ★ 세션 저장
    grantSignupBonusOnce(uid);     // ★ 최초 1회만 지급

    login("kakao", { uid, name: nickname, email: profile.email });
    navigate("/", { replace: true });
  },
  fail: (err) => alert("카카오 정보 요청 실패: " + JSON.stringify(err)),
});
      },
      fail: (err) => alert("카카오 로그인 실패: " + JSON.stringify(err)),
    });
  };

  return (
    <div className="simple-login">
      <div className="socialtitle">
        <div className="socialleft" />
        <h4 className="socialLogin">간편로그인</h4>
        <div className="socialright" />
      </div>

      <div className="sns-row">
        {/* 구글 */}
        <button className="sns google" aria-label="구글 로그인" onClick={googleLogin}>
          <img className="sns-img" src="https://00anuyh.github.io/SouvenirImg/google_btn.png" alt="google" />
        </button>

        {/* 카카오 */}
        <button className="sns kakao" aria-label="카카오 로그인" onClick={kakaoLogin}>
          <img className="sns-img" src="https://00anuyh.github.io/SouvenirImg/kakao_btn.png" alt="kakao" />
        </button>

        {/* 네이버: SDK 버튼 투명 + 이미지 스킨 */}
        <div className="naver-wrap" aria-label="네이버 로그인">
          <div id="naverIdLogin" className="naver-sdk-btn" />
          <img
            className="sns-img"
            src="https://00anuyh.github.io/SouvenirImg/naver_btn.png"
            alt="naver"
            onClick={handleNaverClick}
          />
        </div>
      </div>
    </div>
  );
};

export default SocialLogin;