// src/routes/Community2.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/Community2.css";
import { BsCamera } from "react-icons/bs";
import { RiImageAddFill } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";

import { getProfilePic } from "../utils/profilePic";
import { SESSION_KEY } from "../utils/localStorage";

const SouvenirCommunity = () => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editingPost = location.state?.post; // 수정 모드면 post 존재

  // 제목/내용
  const [title, setTitle] = useState(editingPost?.title || "");
  const [content, setContent] = useState(editingPost?.content || "");

  // 사진 슬롯 (최대 4개, 기본 3개 노출)
  const [photoSlots, setPhotoSlots] = useState(
    editingPost?.photos?.map((url) => ({ file: null, url })) || [null, null, null]
  );
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const fileInputs = useRef([]);

  // ✅ 로그인 uid + 프로필(읽기 전용 스냅샷)
  const [uid, setUid] = useState(null);
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      setUid(s?.username ?? s?.userid ?? null);
    } catch {
      setUid(null);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    setProfilePic(uid ? getProfilePic(uid) : null);
  }, [uid]);

  // 사진 업로드
  const handlePhotoUpload = (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target.result;
      setPhotoSlots((prev) => prev.map((p, i) => (i === idx ? { file, url } : p)));
      setSelectedPhotoIdx(idx);
    };
    reader.readAsDataURL(file);
  };

  // 슬롯 추가/삭제
  const handleAddSlot = () => {
    setPhotoSlots((prev) => (prev.length >= 4 ? prev : [...prev, null]));
  };
  const handleRemoveSlot = () => {
    setPhotoSlots((prev) => {
      if (prev.length <= 3) return prev;
      if (selectedPhotoIdx >= prev.length - 1) setSelectedPhotoIdx(null);
      fileInputs.current = fileInputs.current.slice(0, prev.length - 1);
      return prev.slice(0, -1);
    });
  };

  // 등록/수정
  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력하세요.");
      return;
    }

    const saved = JSON.parse(localStorage.getItem("communityPosts")) || [];
    const photoUrls = photoSlots.filter(Boolean).map((p) => p.url);
    const snapshotImg = profilePic || (uid ? getProfilePic(uid) : "") || "";

    if (editingPost) {
      // 수정 모드: 기존 글의 userImg 유지하되, 최신 스냅샷이 있으면 업데이트
      const updatedPosts = saved.map((p) =>
        p.id === editingPost.id
          ? {
              ...p,
              title,
              content,
              photos: photoUrls,
              date: new Date().toLocaleDateString(),
              userImg: snapshotImg || p.userImg || "",
            }
          : p
      );
      localStorage.setItem("communityPosts", JSON.stringify(updatedPosts));
    } else {
      // 새 글 작성: 작성 시점의 프로필 이미지 스냅샷 저장
      const newPost = {
        id: Date.now(),
        author: isLoggedIn?.local ? user?.name : "회원님",
        title,
        content,
        photos: photoUrls,
        date: new Date().toLocaleDateString(),
        userImg: snapshotImg,
        authorId: uid || null, // (선택) 작성자 식별 보관
      };
      localStorage.setItem("communityPosts", JSON.stringify([newPost, ...saved]));
    }

    navigate("/Community");
  };

  return (
    <div className="warp1" style={{ width: "100%", margin: "0 auto", height: "100vh"  }}>
      <div className="toptitle">
        <div className="titleleft" />
        <h2>Community</h2>
        <div className="titleright" />
      </div>

      <div id="community-content">
        {/* 좌측: 사진 업로드 영역 */}
        <div className="community-content-l">
          <div
            className="insert-photo2"
            style={{
              width: "100%",
              height: "525px",
              border: "1px solid #06301a",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {selectedPhotoIdx !== null && photoSlots[selectedPhotoIdx] ? (
              <img
                src={photoSlots[selectedPhotoIdx].url}
                alt={`업로드${selectedPhotoIdx}`}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <p style={{ fontSize: "25px", color: "#06301a" }}>
                사진을 첨부하세요{" "}
                <RiImageAddFill style={{ fontSize: "23px", color: "#06301a" }} />
              </p>
            )}
          </div>

          <div className="sub-photo-box" style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            {photoSlots.map((slot, idx) => (
              <button
                key={idx}
                type="button"
                className="pm-item"
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "#06301a",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  overflow: "hidden",
                }}
                onClick={() => fileInputs.current[idx]?.click()}
              >
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={(el) => (fileInputs.current[idx] = el)}
                  onChange={(e) => handlePhotoUpload(e, idx)}
                />
                {slot ? (
                  <img
                    src={slot.url}
                    alt={`slot${idx}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: "25px", color: "#fff" }}>+</span>
                )}
              </button>
            ))}

            <button
              type="button"
              className="pm-item"
              onClick={handleAddSlot}
              style={{ width: "60px", height: "60px", borderRadius: "5px", color: "#fff" }}
            >
              추가
            </button>
            <button
              type="button"
              className="pm-item"
              onClick={handleRemoveSlot}
              style={{ width: "60px", height: "60px", borderRadius: "5px", color: "#fff" }}
            >
              삭제
            </button>
          </div>
        </div>

        {/* 우측: 메타 + 폼 */}
        <div className="community-content-r">
          <div className="meta-row">
            <div
              className={`a_profile-img ${profilePic ? "has-img" : "is-empty"}`}
              style={profilePic ? { backgroundImage: `url(${profilePic})` } : undefined}
              title="프로필 사진은 마이페이지에서 변경할 수 있어요."
              aria-hidden="true"
            >
              {!profilePic && <i className="fa-solid fa-user" aria-hidden="true" />}
            </div>

            <p className="detail-name">
              {isLoggedIn?.local ? `${user?.name}님` : "회원님"}
            </p>

            <div className="meta-actions">
              <button
                className="attach-btn"
                type="button"
                onClick={() => fileInputs.current[0]?.click()}
              >
                <BsCamera style={{ fontSize: "25px", color: "#06301a" }} />
                <span>사진첨부하기</span>
              </button>
            </div>
          </div>

          <div className="community-content-title">
            <input
              type="text"
              placeholder="제목을 입력하세요."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ paddingLeft: "10px" }}
            />
          </div>

          <div className="community-content-text">
            <textarea
              placeholder="내용을 입력하세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              style={{ padding: "20px", width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <button className="text-submit" onClick={handleSubmit}>
            <p>{editingPost ? "수정하기" : "등록하기"}</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SouvenirCommunity;
