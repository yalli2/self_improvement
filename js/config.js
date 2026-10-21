/*
 * 마인드 리와이어 설정
 *
 * firebaseDatabaseURL 을 비워 두면 "데모 모드"로 동작합니다.
 *   - 결과가 이 브라우저(localStorage)에만 저장되고, 샘플 참가자 8명이 자동으로 채워집니다.
 *   - 같은 PC의 다른 탭끼리만 실시간으로 동기화됩니다.
 *
 * 수강생들과 진짜 실시간으로 결과를 공유하려면 (무료):
 *   1) https://console.firebase.google.com 에서 프로젝트 생성
 *   2) Build → Realtime Database → 데이터베이스 만들기
 *   3) 규칙(Rules) 탭을 README.md 의 "Firebase 규칙" 으로 교체 후 게시
 *   4) 아래 firebaseDatabaseURL 에 데이터베이스 주소를 붙여 넣고 커밋
 *      예) "https://my-project-default-rtdb.asia-southeast1.firebasedatabase.app"
 */
window.REWIRE_CONFIG = {
  firebaseDatabaseURL: "",
  // 데이터베이스 안에서 이 프로그램이 쓰는 최상위 폴더 이름 (다른 프로그램과 섞이지 않게 분리)
  root: "mind-rewire",
  pollSeconds: 4
};
