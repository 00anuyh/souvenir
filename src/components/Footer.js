import '../css/footer.css'

const Footer = () => {
    return (
        <footer>
            <div id="footerwrap">
                {/* 상단 고객센터 */}
                <div id="topfoo">
                    <div className="foocenter">
                        <p className="footitle">고객센터 &gt;</p>
                        <p className="foophone">1670-1234</p>
                        <p className="footime">운영시간 : 09:00 ~ 18:00</p>
                    </div>
                    <div className="foosocial">
                        <span className="foocircle"><img src='https://00anuyh.github.io/SouvenirImg/sns_logo1.png' alt='sns_logo1'></img></span>
                        <span className="foocircle"><img src='https://00anuyh.github.io/SouvenirImg/sns_logo2.png' alt='sns_logo2'></img></span>
                        <span className="foocircle"><img src='https://00anuyh.github.io/SouvenirImg/sns_logo3.png' alt='sns_logo3'></img></span>
                        <span className="foocircle"><img src='https://00anuyh.github.io/SouvenirImg/sns_logo4.png' alt='sns_logo4'></img></span>
                    </div>
                </div>

                {/* 중단 공지사항 + 가이드 메뉴 */}
                <div id="middlefoo">
                    <div className="foonotice">
                        <h4>NOTICE</h4>
                        <p>[공지] 택배 없는 날 및 휴무일로 인한 배송 지연 안내</p>
                        <p>기상악화로 인한 배송 지연 양해 안내</p>
                        <p>[공지] 서비스 점검 안내</p>
                    </div>

                    <div className="guidemenu">
                        <ul>
                            <li className="guidetitle">자주찾는메뉴</li>
                            <li>로그인 / 회원가입</li>
                            <li>장바구니</li>
                            <li>주문조회</li>
                            <li>마이페이지</li>
                        </ul>
                        <ul>
                            <li className="guidetitle">고객센터</li>
                            <li>공지사항</li>
                            <li>FAQ</li>
                            <li>고객의 소리</li>
                        </ul>
                        <ul>
                            <li className="guidetitle">교환 / 반품</li>
                            <li>1:1 문의</li>
                            <li>입점 및 제휴 문의</li>
                            <li>상품 Q&A내역</li>
                        </ul>
                    </div>
                </div>

                {/* 하단 회사정보 */}
                <div id="bottomfoo">
                    <div className="bottommenu">
                        <a href="#none">회사소개</a> |
                        <a href="#none">인재채용</a> |
                        <a href="#none">이용약관</a> |
                        <a href="#none">개인정보취급방침</a> |
                        <a href="#none">이용안내</a> |
                        <a href="#none">대량구매문의</a>
                    </div>
                    <div className="bottomtext">
                        <p>Copyright 2025. Souvenir, Co., Ltd. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}


export default Footer;