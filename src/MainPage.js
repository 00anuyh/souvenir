import React from "react";

/* 스와이퍼 */
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

/* 아이콘 */
import { IoMdCart, IoMdHeart, IoMdPhotos, IoIosClock, IoMdHeartEmpty } from "react-icons/io";
import { GiCardboardBoxClosed } from "react-icons/gi";
import { RiDiscountPercentFill, RiTruckFill } from "react-icons/ri";
import { BsFillHouseHeartFill } from "react-icons/bs";
import { TiArrowRightThick } from "react-icons/ti";

/* css */
import "./MainPage.css";

/* 컴포넌트 */
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function MainPage() {
  return (
    <div className="mainwarp">
        <Header />
      {/* 메인배너 */}
      <main id="mainban">
        <div className="banner">
          <ul className="banul">
            <li><a href="#none"><img src={process.env.PUBLIC_URL + "/img/banner1.png"} alt="bannerimg" /></a></li>
            <li><a href="#none"><img src={process.env.PUBLIC_URL + "/img/banner2.png"} alt="bannerimg" /></a></li>
            <li><a href="#none"><img src={process.env.PUBLIC_URL + "/img/banner3.png"} alt="bannerimg" /></a></li>
          </ul>
        </div>

        <div className="myinpo">
          <div className="myinpotop">
            <p><span>임재형</span> 님 반갑습니다</p>
          </div>
          <div className="myinpobottom">
            <ul className="myinpoul">
              <li className="ban2slide ban2img1" />
              <li className="ban2slide ban2img2" />
              <li className="ban2slide ban2img3" />
            </ul>
          </div>
        </div>
      </main>

      {/* 서브메뉴 */}
      <div id="subnav">
        <ul id="menu3">
          <li><a href="#none"><IoMdCart /></a>장바구니</li>
          <li><a href="#none"><IoMdHeart /></a>즐겨찾기</li>
          <li><a href="#none"><IoMdPhotos /></a>커뮤니티</li>
          <li><a href="#none"><GiCardboardBoxClosed /></a>살림살이</li>
          <li><a href="#none"><IoIosClock /></a>당일특가</li>
          <li><a href="#none"><RiDiscountPercentFill /></a>할인품목</li>
          <li><a href="#none"><RiTruckFill /></a>배송문의</li>
          <li><a href="#none"><BsFillHouseHeartFill /></a>리모델링</li>
        </ul>
      </div>

      {/* 섹션 (1) */}
      <section id="mainsec1">
        <h3>Editor's Pick !</h3>
        <div className="sec1">
          <ul className="sec1ul">
            <li className="sec1img num1"><a href="#none"><p>Shop Now <TiArrowRightThick /></p></a></li>
            <li className="sec1img num2"><a href="#none"><p>Shop Now <TiArrowRightThick /></p></a></li>
            <li className="sec1li">
              <span>편안한 순간을 밝혀주는 에디터의 픽</span>
              <p>
                은은한 조명으로 어느 공간에서도 <br />
                잘 어울리는 디자인 입니다. <br />
                단순히 공간을 밝히는 데 그치지 않고, <br />
                공간에 따스함과 편안함을 불어넣어줍니다.
              </p>
            </li>
            <li className="sec1li">
              <span>이 소품들이 전하는 감성</span>
              <p>
                공간을 밝히는 것만이 아니라, <br />
                당신의 하루 끝에 따스함을 더합니다.<br />
                빛이 머무는 공간을 은은하게 <br />
                채워줍니다.
              </p>
            </li>
            <li className="sec1img num3"><a href="#none"><p>Shop Now <TiArrowRightThick /></p></a></li>
            <li className="sec1img num4"><a href="#none"><p>Shop Now <TiArrowRightThick /></p></a></li>
          </ul>
          <div className="sec1ban">
            <a href="#none" className="sec1img num5">
              <p>Shop Now <TiArrowRightThick /></p>
            </a>
          </div>
        </div>
      </section>

      {/* 섹션 (2) */}
      <section id="mainsec2">
        <h3>BEST</h3>
        <div className="sec2">
          <div className="sec2Slide sec2img1">
            <p><span>상품명</span> <br /> 상품가격</p>
            <p><IoMdHeartEmpty className="IoMdHeartEmpty" /></p>
          </div>
          <div className="sec2Slide sec2img2">
            <p><span>상품명</span> <br /> 상품가격</p>
            <p><IoMdHeartEmpty className="IoMdHeartEmpty" /></p>
          </div>
          <div className="sec2Slide sec2img3">
            <p><span>상품명</span> <br /> 상품가격</p>
            <p><IoMdHeartEmpty className="IoMdHeartEmpty" /></p>
          </div>
          <div className="sec2Slide sec2img4">
            <p><span>상품명</span> <br /> 상품가격</p>
            <p><IoMdHeartEmpty className="IoMdHeartEmpty" /></p>
          </div>
          <div className="sec2Slide sec2img5">
            <p><span>상품명</span> <br /> 상품가격</p>
            <p><IoMdHeartEmpty className="IoMdHeartEmpty" /></p>
          </div>
        </div>
        <div className="sec2more">
            <a href="#none">
                <img src="/img/more.png" alt="sec2img" />
            </a>
        </div>
      </section>

      {/* 섹션 (3) - Community (Swiper) */}
      <div id="mainsec3">
        <h3>Community</h3>
        <div className="sec3">
          <Swiper
            className="mySwiper Community-swiper"
            modules={[Navigation, Autoplay]}
            slidesPerView={4.8}
            spaceBetween={30}
            loop
            speed={600}
            autoplay={{ delay: 1500, disableOnInteraction: false }}
            navigation
          >
            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
              <SwiperSlide key={n}>
                <div className="sec3card">
                  <div className={`sec3bg sec3bg${n}`}>
                    <a href="#none">글 보러가기</a>
                  </div>
                  <div className="card-text">
                    <p className="sec3tag">진**님의 글</p>
                    <p className="sec3date">2025.01.01</p>
                    <p className="sec3title">독특하게 앞쪽에 절개 디자인이 들어가서 은은하게 돋보이는 것 같아요</p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* 마지막 섹션 - End Swiper */}
      <section id="mainsec4">
        <div className="sec4 full-bleed">
          <Swiper
            className="mySwiper end-swiper"
            modules={[Pagination, Autoplay]}
            slidesPerView={1}
            loop
            speed={800}
            autoplay={{ delay: 1500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
          >
            <SwiperSlide>
              <div className="sec4img1">
                <span>Elevate Your Everyday</span>
                <p>Where Comfort Meets Timeless Design</p>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="sec4img2">
                <span>Coming Soon</span>
                <p>Wrapped in Warmth, Styled for Life</p>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="sec4img3">
                <span>The Art of Giving</span>
                <p>Thoughtful Pieces for Every Home</p>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </section>

      {/* 푸터 */}
      <Footer />
        
    </div>
  );
}
