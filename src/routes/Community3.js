import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  IoHeartOutline,
  IoPricetagOutline,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import "../css/Community3.css";
import postsData from "../data/CommunityData.json";
import { useAuth } from "../context/AuthContext"; // AuthContext에서 로그인 정보

const Community3 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  const savedPosts = JSON.parse(localStorage.getItem("communityPosts")) || [];
  const allPosts = [...savedPosts, ...postsData];

  const post = allPosts.find((p) => String(p.id) === String(id));

  const photos =
    post?.photos && post.photos.length > 0
      ? post.photos
      : post?.image
      ? [post.image]
      : [];
  const [mainPhoto, setMainPhoto] = useState(photos[0] || "");

  if (!post) return <p>글을 찾을 수 없습니다.</p>;

  // 수정 버튼 클릭
  const handleEdit = () => {
    if (!isLoggedIn?.local) {
      const goLogin = window.confirm(
        "로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?"
      );
      if (goLogin) navigate("/Login");
      return;
    }
    if (user?.name !== post.author) {
      alert("본인 글만 수정할 수 있습니다.");
      return;
    }
    navigate("/Community2", { state: { post } });
  };

  // 삭제 버튼 클릭
  const handleDelete = () => {
    if (!isLoggedIn?.local) {
      const goLogin = window.confirm(
        "로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?"
      );
      if (goLogin) navigate("/Login");
      return;
    }
    if (user?.name !== post.author) {
      alert("본인 글만 삭제할 수 있습니다.");
      return;
    }
    if (window.confirm("정말 삭제하시겠습니까?")) {
      const newPosts = savedPosts.filter((p) => p.id !== post.id);
      localStorage.setItem("communityPosts", JSON.stringify(newPosts));
      navigate("/Community");
    }
  };

  return (
    <div className="warp1">
      <div className="toptitle">
        <div className="titleleft" />
        <h2>Community</h2>
        <div className="titleright" />
      </div>

      <div className="community3-Box">
        <div className="comdetail_community-content-l">
          <div className="insert-photo">
            {mainPhoto ? <img src={mainPhoto} alt="photo" style={{
                    objectFit: "contain",
                    objectPosition: "center"
                  }}/> : <p>사진 없음</p>}
          </div>
          <div className="sub-photo-box">
            <ul>
              {photos.map((p, idx) => (
                <li key={idx} onClick={() => setMainPhoto(p)} >
                  <img src={p} alt={`photo${idx}`} style={{
                    objectFit: "contain",
                    objectPosition: "center"
                  }}/>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="comdetail_community-content-r">
          <div className="meta-row">
            <div className="a_profile-img">
              <i className="fa-solid fa-user" aria-hidden="true"></i>
            </div>
            <p className="detail-name">{post.author || post.user}</p>

            <div className="meta-actions">
              {/* 로그인 상태 && 본인 글일 경우만 수정/삭제 버튼 표시 */}
              {isLoggedIn?.local && user?.name === post.author && (
                <>
                  <div className="meta-action" onClick={handleEdit}>
                    <FaRegEdit style={{ fontSize: "20px" }} />
                    <span className="detail-editor">수정</span>
                  </div>
                  <div className="meta-action" onClick={handleDelete}>
                    <FaRegTrashAlt style={{ fontSize: "20px" }} />
                    <span className="detail-editor">삭제</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="comdetail_community-content-text">
            <p>{post.content || post.text}</p>
          </div>

          <div className="like-tag-mes">
            <div role="button" tabIndex={0}>
              <IoHeartOutline className="ltm-icon" aria-hidden="true" />
              <span className="ltm-num">20</span>
            </div>
            <div role="button" tabIndex={0}>
              <IoPricetagOutline className="ltm-icon" aria-hidden="true" />
              <span className="ltm-num">20</span>
            </div>
            <div role="button" tabIndex={0}>
              <IoChatbubbleEllipsesOutline
                className="ltm-icon"
                aria-hidden="true"
              />
              <span className="ltm-num">20</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community3;
