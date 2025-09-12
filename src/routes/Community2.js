import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/Community2.css";
import { BsCamera } from "react-icons/bs";
import { RiImageAddFill } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";

const SouvenirCommunity = () => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editingPost = location.state?.post; // 수정 모드면 post 존재

  const [title, setTitle] = useState(editingPost?.title || "");
  const [content, setContent] = useState(editingPost?.content || "");
  const [photoSlots, setPhotoSlots] = useState(
    editingPost?.photos?.map((url) => ({ file: null, url })) || [null, null, null]
  );
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);

  const fileInputs = useRef([]);

  // 사진 업로드
  const handlePhotoUpload = (e, idx) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target.result;
        setPhotoSlots((prev) =>
          prev.map((p, i) => (i === idx ? { file, url } : p))
        );
        setSelectedPhotoIdx(idx);
      };
      reader.readAsDataURL(file);
    }
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

  // 등록/수정 버튼
  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력하세요.");
      return;
    }

    const saved = JSON.parse(localStorage.getItem("communityPosts")) || [];

    if (editingPost) {
      // 수정 모드
      const updatedPosts = saved.map((p) =>
        p.id === editingPost.id
          ? {
              ...p,
              title,
              content,
              photos: photoSlots.filter(Boolean).map((p) => p.url),
              date: new Date().toLocaleDateString(),
            }
          : p
      );
      localStorage.setItem("communityPosts", JSON.stringify(updatedPosts));
    } else {
      // 새 글 작성
      const newPost = {
        id: Date.now(),
        author: isLoggedIn?.local ? user?.name : "회원님",
        title,
        content,
        photos: photoSlots.filter(Boolean).map((p) => p.url),
        date: new Date().toLocaleDateString(),
        userImg: "",
      };
      localStorage.setItem("communityPosts", JSON.stringify([newPost, ...saved]));
    }

    navigate("/Community");
  };

  return (
    <div className="warp1">
      <div className="toptitle">
        <div className="titleleft" />
        <h2>Community</h2>
        <div className="titleright" />
      </div>

      <div id="community-content">
        <div className="community-content-l">
          <div
            className="insert-photo"
            style={{
              width: "100%",
              height: "525px",
              backgroundColor: "#5e472f",
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
              <p style={{ fontSize: "25px", color: "#fff" }}>
                사진을 첨부하세요{" "}
                <RiImageAddFill style={{ fontSize: "23px", color: "#fff" }} />
              </p>
            )}
          </div>

          <div
            className="sub-photo-box"
            style={{ display: "flex", gap: "10px", marginTop: "10px" }}
          >
            {photoSlots.map((slot, idx) => (
              <button
                key={idx}
                type="button"
                className="pm-item"
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "#5e472f",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  overflow: "hidden",
                }}
                onClick={() => fileInputs.current[idx]?.click()}
              >
                <input
                  type="file"
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
              style={{ width: "60px", height: "60px", borderRadius: "5px", color: "#fff"  }}
            >
              슬롯 추가
            </button>
            <button
              type="button"
              className="pm-item"
              onClick={handleRemoveSlot}
              style={{ width: "60px", height: "60px", borderRadius: "5px", color: "#fff"  }}
            >
              슬롯 삭제
            </button>
          </div>
        </div>

        <div className="community-content-r">
          <div className="meta-row">
            <div className="a_profile-img">
              <i className="fa-solid fa-user" aria-hidden="true"></i>
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
              style={{
                padding: "20px",
                width: "100%",
                boxSizing: "border-box",
              }}
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
