# AI Daily Intelligence V1 UI Design Spec

> 상태: 승인 목업 기반 V1 디자인 정본  
> 기준일: 2026-08-14 (Asia/Seoul)  
> 적용 범위: Today, News Detail, Opportunities, Trends, Saved

## Product Visual Identity

AI Daily Intelligence는 `AI Newsroom + Research + Intelligence Dashboard`다. 첫 1~3분 안에 중요한 변화를 파악할 수 있는 높은 정보 밀도, 명확한 근거 접근성, 차분한 편집 디자인을 우선한다. 대형 마케팅 Hero, 사진 중심 포털, 모든 요소의 카드화, 과도한 gradient·glow를 피한다.

## 참고 우선순위와 목업 사용 규칙

UI 판단 순서는 최신 사용자 요구사항 → 최신 승인 목업 → 이 문서 → V1 제품 요구사항 → Newsio 철학 → 기존 구현이다. 2026-08-14 승인 목업의 desktop/mobile Event Detail을 정보 hierarchy, 밀도, 콘텐츠 순서와 반응형 변화의 기준으로 삼는다. Newsio에서는 사진·텍스트 균형, 중요도에 따른 크기 차이, newsroom 정보 밀도만 참고한다.

## Typography

- 기본 폰트: Pretendard 계열과 시스템 sans-serif fallback
- Desktop Page H1: 32~36px, News Detail H1: 32~38px
- Mobile Page/Detail H1: 26~30px
- 대표 뉴스: desktop 24~28px, mobile 21~24px
- 일반 뉴스: desktop 17~20px, mobile 16~18px
- Section Heading: desktop 20~24px, mobile 18~21px
- 본문: 14~16px, line-height 1.65~1.8
- kicker와 metadata: 10~12px

긴 제목은 balanced wrapping, 조밀한 line-height와 최대 읽기 폭으로 첫 viewport 점유를 제한한다.

## Layout

- 전역 콘텐츠 최대 폭: 약 1152px(`max-w-6xl`)
- Header: 52px 높이, 얇은 하단 border, desktop active underline
- News Detail은 본문 중심이며 Source용 대형 우측 column을 만들지 않는다.
- whitespace, divider, subtle background와 필요한 곳의 얇은 border를 혼합한다.
- 기본 radius는 6~12px이며 pill은 상태·필터처럼 의미가 있는 경우에만 쓴다.

## Desktop

- Event Header는 text-first이며 대표 이미지가 있을 때만 제한된 보조 column을 사용한다.
- 사용자 Action은 콘텐츠 아래 한 줄 toolbar다.
- 원문 상세는 기사 본문형 disclosure다.
- AI 분석은 3열 × 최대 2행 compact card grid다.
- 사업 기회는 압축된 highlight panel이다.
- 관련 자료는 페이지 하단 compact row list다.

## Tablet

- 768px 전후에서 header menu는 mobile menu로 전환할 수 있다.
- News Detail은 한 열, 분석 카드는 2열을 기본으로 한다.
- Opportunity 상세는 2열, Source는 compact row를 유지한다.

## Mobile

390px 기준 순서는 Event Header → 이미지/원문 CTA → 사용자 Action → 원문 상세 → AI 분석 → 사업 기회 → 관련 자료다.

- H1은 26~30px 범위에서 긴 제목을 자연스럽게 줄바꿈한다.
- Action은 5등분 compact toolbar다.
- 원문 상세는 접힌 상태로 시작한다.
- AI 분석은 native `details/summary` accordion이다.
- Source는 icon, 제목, publisher, authority, verification을 두 줄 안에서 읽는 compact list다.
- 가로 overflow와 고정 UI의 본문 겹침을 허용하지 않는다.

## Images

- 검증 가능한 원문 또는 공식 출처 이미지에만 대표 이미지 사용
- 이미지가 없으면 공간을 예약하지 않음
- 일반 Event와 Source에는 큰 이미지 사용 금지
- YouTube에만 필요한 경우 작은 thumbnail 허용
- AI 생성 이미지를 뉴스 대표 이미지로 사용하지 않음
- attribution과 원문 연결 유지

## Card Usage

- 원문 상세: article/disclosure
- AI 분석: compact card
- 사업 기회: highlight panel
- Source: divider 기반 list
- Today 일반 뉴스: list
- 관리 dashboard처럼 모든 요소를 rounded card로 만들지 않음

## AI Analysis Cards

표시 순서는 사실, 해석, 신호, 전망/추정, 왜 중요한가, 앞으로의 전망이다. 각 항목은 icon, text label과 subtle accent로 구분한다. Desktop은 grid, mobile은 keyboard 접근 가능한 accordion을 사용한다. UI에는 Event AI 평가 수치를 노출하지 않고 S/A/B 중요도만 표시한다.

## Original Content Section

- 기본 label: `원문 기반 상세 요약`
- 전문 재사용이 확인된 공식 문서·공개 라이선스만 `원문 번역` 사용
- 일반 언론은 전문 복제나 전체 번역 대신 보유한 출처 기반 사실을 재구성
- 기본 접힘, 약 1/3 preview, gradient fade, `자세히 보기 ↓`
- 펼침 후 전체 허용 콘텐츠와 `접기 ↑`
- 데이터가 없으면 `원문 내용 미확보` 표시, 내용 생성 금지

현재 V1은 DB 필드를 추가하지 않고 기존 `one_line_summary`와 정규화된 FACT로 상세 요약을 구성한다. 향후 권리 상태와 상세 콘텐츠가 upstream에서 생성될 때만 persistent field를 재검토한다.

## Opportunity

AI 분석 뒤에 배치한다. Event에 구조화된 기회가 있으면 핵심 기회, 문제, 고객, 2주 MVP, 점수를 압축한다. 현재 자유 텍스트만 있으면 해당 내용과 전체 사업 기회 페이지 동선만 제공하고 정보를 추정하지 않는다. 기회가 없으면 영역을 렌더링하지 않는다.

## Sources

- 페이지 하단 compact list
- 한 행에 type, title, publisher, authority, verification, date, 외부 링크 표시
- 한국어 type/authority/verification label 사용
- 5개 이상이고 실제 category가 둘 이상일 때만 compact filter 표시
- Source가 적으면 빈 filter category를 만들지 않음
- YouTube만 작은 thumbnail 허용

## Information Density

섹션 간격은 desktop 32~40px, mobile 28~36px다. padding은 12~24px 범위에서 콘텐츠 성격에 맞춘다. 대형 빈 공간보다 divider와 짧은 metadata row를 활용한다.

## Colors

- 기본: white, slate-50~950
- primary accent: blue-600/700
- 중요도 S: red, A: amber, B: blue
- 분석 accent: blue, indigo, teal, violet, amber, emerald의 낮은 채도 배경
- 상태는 icon·text label을 함께 사용해 색상 의존을 피한다.

## Interaction

- 모든 interactive element에 keyboard focus ring 제공
- 원문 disclosure는 `aria-expanded`, `aria-controls` 사용
- 모바일 분석은 native details semantics 사용
- 외부 링크는 새 창, `noopener noreferrer`, ↗ 표시
- hover는 배경·border의 작은 변화만 사용

## Login UX

로그인은 선택 기능이다. 최초 진입 redirect, 자동 modal, full-screen gate를 금지한다. Header에 작은 진입점을 두고 개인 기능 요청 때만 로그인으로 이동한다. 기존 PKCE와 same-origin return-path 검증을 유지한다.

## Korean Content

- UI label은 한국어 기본
- `title_ko`, 한국어 summary·analysis가 있으면 우선 표시
- 기업, 모델, 기술 고유명사는 원문 유지 가능
- legacy 영어는 일괄 번역하거나 Git archive를 수정하지 않고 fallback 허용
- Source taxonomy와 검증 상태도 한국어 label 사용

## Responsive Rules

Mobile-first 한 열 구조에서 `md` 분석 2열, `lg` 분석 3열과 Today 보조 column을 적용한다. 대표 이미지와 Source thumbnail이 없어도 grid가 무너지지 않아야 한다. 390px, tablet, desktop 순으로 실제 콘텐츠를 검증한다.

## Accessibility

- semantic heading과 landmark 유지
- icon 의미에 accessible name 제공
- 상태를 색상만으로 표현하지 않음
- focus-visible ring과 충분한 touch target 제공
- disclosure/accordion 상태를 assistive technology에 노출
- 390px 가로 overflow 금지

## UI 변경 검증 순서

1. 최신 요구사항과 이 문서 확인
2. 최신 승인 목업과 현재 Preview 확인
3. 구현
4. Desktop, Tablet, Mobile 390px 주요 화면 확인
5. interaction·overflow·console 확인
6. test, lint, typecheck, build
7. Preview 재배포 후 실제 URL 확인

## Today Page — 2026-08-14 승인 목업

Today는 마케팅 Hero가 아니라 `오늘의 인사이트 → 핵심 Event → 기회·신호·자료`를 한 화면에서 훑는 newsroom dashboard다.

### Desktop

- 전역 폭은 최대 1320px이며, header와 본문 축을 맞춘다.
- 상단은 인사이트 설명과 실제 당일 집계 4개를 나란히 둔다. 전일 데이터가 없으면 증감 수치를 만들지 않는다.
- 핵심 뉴스는 briefing 순서와 importance를 보존한다. 첫 Event를 lead story로, 나머지 최대 4개를 compact secondary list로 표시한다.
- 검증 가능한 대표 이미지가 있을 때만 lead/secondary 이미지 영역을 렌더링하며, 이미지가 없으면 텍스트 column이 전체 폭을 사용한다.
- 하단은 사업 기회 레이더, 트렌딩 시그널, 도구/오픈소스/논문을 3열로 배치한다. 실제 시계열이 없는 signal에는 sparkline이나 상승률을 만들지 않는다.
- 전역 검색 기능이 V1 범위에 없으므로 header 검색 모양의 진입점은 검색 결과를 가장 가까이 대체하는 `핵심 뉴스` section 이동으로 명확한 accessible name을 제공한다.

### Mobile

- 인사이트는 연한 blue/slate 정보 카드로 압축하고 4개 metric panel은 숨긴다.
- lead Event 다음에 secondary Event를 한 열로 쌓고, 개인 action은 5등분 icon toolbar로 제공한다.
- 고정 하단 navigation은 오늘, 뉴스, 트렌드, 저장됨, 로그인/로그아웃을 제공한다. body에 동일 높이의 하단 여백을 둬 콘텐츠를 가리지 않는다.
- 로그인하지 않은 사용자의 뉴스 열람을 방해하지 않으며, 개인 action을 누를 때만 `/login?next=/`로 이동한다.

### Data Rules

- metric은 현재 briefing의 Event, Trend Signal, Opportunity, URL 기준 중복 제거 Resource 개수만 사용한다.
- Source 수는 현재 Event에 연결된 실제 Source 합계다.
- 점수, 반응 수, 전일 대비, 대표 이미지, 검증 완료 수가 projection에 없으면 표시하거나 추정하지 않는다.
- legacy 영어 제목·요약은 승인된 fallback 정책에 따라 그대로 표시한다.
