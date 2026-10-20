AI Daily Intelligence · 2026-10-21 KST

[전체 보고서](https://github.com/Alliesy/ai-daily-intelligence/blob/main/reports/2026/2026-10-21.md) · [날짜별 데이터](https://github.com/Alliesy/ai-daily-intelligence/blob/main/data/daily/2026/2026-10-21.json)

뉴스 3개 · 사업 아이디어 0개 · 구축 후보 없음

이번 호는 개인이 직접 설정하거나 써볼 수 있는 변화 2건과, AI 대화 공유의 개인정보 위험 1건을 다룹니다.

### AI 대화를 잠가도 저장된 내용까지 사라지는 것은 아닙니다

ChatGPT의 새 잠금 기능은 다른 사람의 눈에 대화가 보이지 않게 하지만, 보관 기간과 학습 설정은 바꾸지 않습니다. Meta가 Muse 공유를 중단한 뒤에도 대화 제목이 들어간 주소 흔적은 DNS 기록에 남았습니다. 민감한 대화를 다룰 때는 화면에서 숨기기, 서비스에서 삭제하기, 공유 링크 끊기를 서로 다른 일로 봐야 합니다.

### ChatGPT, 민감한 대화를 PIN으로 숨기는 기능을 내놓았습니다

대화를 일반 기록과 검색에서 가리고 PIN이나 생체 인증으로 열 수 있습니다. 화면 노출은 줄지만 삭제·암호화·학습 제외가 되는 것은 아닙니다.

OpenAI가 10월 20일 ChatGPT에 Locked Chats를 공개했습니다. 선택한 대화는 일반 대화 기록과 고정 목록, 검색에서 빠지고 4자리 계정 PIN으로 열 수 있습니다. 지원하는 휴대전화에서는 Face ID·Touch ID·기기 잠금도 쓸 수 있습니다.

무료·Go·Plus·Pro와 Business·Enterprise·Edu에 단계적으로 배포됩니다. 웹과 iOS·Android, 새 macOS·Windows 앱이 대상이라 메뉴가 아직 보이지 않는 계정도 있을 수 있습니다. Codex 대화와 로컬 Work 대화, Healthcare에서는 지원되지 않습니다.

이 기능은 누군가 화면이나 기기를 볼 때 대화를 가리는 용도입니다. 종단간 암호화나 별도 보안 금고가 생기는 것은 아니고, OpenAI의 보관 기간과 모델 개선 설정도 그대로입니다. PIN을 잊어 재설정하면 모든 잠금 대화와 관련 파일이 영구 삭제될 수 있으니 삭제와 잠금을 같은 기능으로 생각하면 안 됩니다.

하나만 기억한다면: 대화를 안 보이게 하는 것과 서비스에서 지우는 것은 다른 일입니다.

앞으로 볼 건: 잠금 뒤 기존 Memory가 어디에 남는지, 회사 계정의 관리자·컴플라이언스 접근이 어떻게 적용되는지 확인할 필요가 있습니다.

지금 확인할 것: 잠글 대화가 있다면 먼저 Settings의 Data Controls와 Memory 설정을 확인하고, PIN을 안전한 곳에 보관한 뒤 한 개의 덜 민감한 대화로 시험하세요.

더 궁금하다면: [OpenAI](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) · [OpenAI](https://help.openai.com/en/articles/20001411-using-locked-chats-in-chatgpt) · [TechCrunch](https://techcrunch.com/2026/10/20/chatgpt-now-lets-you-lock-your-chats/) · [Android Authority](https://www.androidauthority.com/chatgpt-rolls-out-locked-chats-3725766/)

### Meta, 쉽게 찾아낼 수 있던 Muse 대화 공유를 중단했습니다

Muse가 만든 공유 주소가 공개 DNS 기록에서 6,800개 넘게 발견됐습니다. 기능은 멈췄지만 제목이 들어간 주소 흔적은 기록에 남았습니다.

보안 회사 Claroc은 Meta의 AI 에이전트 Muse가 만든 공유 주소를 공개 DNS 기록에서 6,800개 넘게 찾아냈다고 밝혔습니다. 링크를 받은 사람만 볼 수 있다고 생각하기 쉬웠지만, 대화 제목과 임의 ID가 주소의 호스트명에 들어가 링크를 받지 않은 사람도 찾아낼 수 있었습니다.

연구진은 수백 개를 표본으로 열어 봤고, 일부에서 대출 신청서·매출 검토·직원 일정 같은 민감한 내용을 확인했습니다. 전체 6,800개가 민감하거나 악용됐다는 뜻은 아니며, 연구진도 실제 오용 증거는 없다고 밝혔습니다.

Meta는 10월 20일 공유 기능을 중단했습니다. 연구진이 다시 확인한 40개 페이지는 더 이상 열리지 않았지만, 제목이 포함된 호스트명은 수동 DNS 기록에 남아 있다고 했습니다. Muse는 미국·캐나다 중심 서비스라 한국 독자의 직접 사용 변화는 제한적이지만, 다른 AI에서도 공유 링크를 비공개 보관함처럼 취급해서는 안 된다는 사례입니다.

하나만 기억한다면: AI 대화를 공유하면 내용뿐 아니라 제목과 주소도 외부에 남을 수 있습니다.

앞으로 볼 건: Meta가 공유 주소에서 제목을 제거하는지, 로그인·만료 기능을 추가하는지, 기존 이용자에게 어떤 통지를 하는지 확인해야 합니다.

지금 확인할 것: 어떤 AI에서든 이미 만든 공유 링크를 점검하고, 개인정보·계약·재무 내용이 있다면 링크를 삭제하거나 공유를 해제하세요.

더 궁금하다면: [Claroc Research Team](https://blog.claroc.io/ghostshares-muse-passive-dns/) · [The Verge](https://www.theverge.com/tech/1014627/meta-muse-ai-sharing-ai-chats) · [Ars Technica](https://arstechnica.com/security/2026/10/meta-muse-exposes-users-personal-and-business-secrets-when-they-share-conversations/) · [Meta](https://ai.meta.com/muse/)

### Lightroom 모바일, 단체사진에서 감은 눈을 AI로 고칩니다

감은 눈을 자동으로 찾아 한 번에 보정하는 Open Eyes가 추가됐습니다. Adobe는 무료라고 안내하지만 독립 매체는 무료판에서 두 번 뒤 구독 화면이 나온다고 확인했습니다.

Adobe가 모바일 Lightroom의 Quick Actions에 Open Eyes를 추가했습니다. 앱이 사진에서 감은 눈을 찾으면 보정 버튼을 보여 주고, 생성형 AI로 눈을 뜬 결과를 만듭니다. 개인 사진과 단체사진 모두 대상입니다.

같은 사람의 다른 사진이 Lightroom 라이브러리에 있으면 눈 색과 모양, 크기를 맞추는 데 참고할 수 있습니다. 얼굴 전체를 바꾸기보다 필요한 눈 주변만 고친다는 설명이지만, 실제 결과가 원래 표정과 자연스럽게 맞는지는 사진마다 직접 확인해야 합니다.

가격 안내에는 주의가 필요합니다. Adobe 발표는 이 기능을 무료라고 표현했지만, DPReview는 무료판에서 두 번 사용한 뒤 AI 또는 Creative Cloud 구독 안내가 나왔다고 전했습니다. 한국 계정의 정확한 무료 횟수와 iOS·Android별 배포 상태는 이번 조사에서 확정하지 못했습니다.

하나만 기억한다면: 한 번 눌러 고칠 수 있어도 생성된 얼굴이 원래 사람과 같은지는 직접 봐야 합니다.

앞으로 볼 건: 한국 계정의 무료 사용 횟수, 여러 사람이 있는 사진에서 잘못된 눈을 고르는지, 수정 표시·원본 보존이 쉬운지 확인해야 합니다.

지금 확인할 것: 원본을 복사한 뒤 한 장으로 시험하고, 확대해서 눈동자 방향과 표정이 자연스러운지 확인한 다음 공유하세요.

더 궁금하다면: [Adobe](https://blog.adobe.com/en/publish/2026/10/19/give-your-photos-a-second-chance-with-open-eyes-in-lightroom-on-mobile) · [Adobe Korea](https://www.adobe.com/kr/products/photoshop-lightroom/mobile.html) · [DPReview](https://www.dpreview.com/news/adobe-adds-easy-ai-eye-generation-to-lightroom-mobile/) · [The Verge](https://www.theverge.com/tech/1014246/adobe-lightroom-mobile-ai-quick-action-open-eyes-closed-blink-repair)

### 오늘의 활용법

대화 보호 목적을 세 가지로 나누기

옆 사람에게 안 보이게 할지, 서비스에서 지울지, 학습에서 제외할지와 공유 링크를 끊을지를 각각 확인합니다.

예시 요청: “이 대화에는 개인정보가 있어. 화면에서 숨기기, 삭제하기, 학습 제외하기, 공유 링크 해제하기를 각각 어디서 설정하는지 구분해서 알려줘. 확인되지 않은 메뉴는 추측하지 마.”

### 더 읽고 볼 자료

최신 발표와 구분한 배경 자료입니다.

- Paper · [개인 AI 도구를 고를 때 신뢰와 개인정보가 실제 선택에 미치는 영향](https://arxiv.org/abs/2607.15134) — 2026-07-16. 미국 성인 AI 사용자 1,999명의 선택을 분석한 연구입니다. 이용자가 개인정보를 걱정하면서도 설정을 잘 몰라 행동하지 못한다는 결과가 오늘의 잠금·공유 뉴스와 맞닿아 있습니다.

- GitHub · [nanoMuse — 직접 운영할 수 있는 오픈소스 개인 에이전트](https://github.com/nano-muse/nanoMuse) — 2026-09-25 최초 공개; 2026-10-21 조회. 대화·기억·승인 구조를 공개한 개인 에이전트입니다. 다양한 기기용 설치 파일이 있지만 아직 빠르게 변하는 프로젝트이므로 중요한 계정과 연결하기 전 문서·권한·서명을 확인해야 합니다.

- YouTube · [OpenAI Academy — ChatGPT에 넣지 말아야 할 정보와 재확인 방법](https://www.youtube.com/watch?v=dfAZbuAQxi8) — 2026-09. ChatGPT를 쓰면서 무엇을 공유하지 말아야 하는지 설명하는 입문 영상입니다. 제품 제공자의 교육 자료이므로 독립적인 개인정보 평가로 보지는 않습니다.

- Blog · [Meta가 설명한 Muse의 권한·자격 증명 보호 구조](https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse) — 2026-09. Muse가 읽기·쓰기 권한과 자격 증명을 어떻게 나눈다고 설계했는지 볼 수 있습니다. 오늘 드러난 공유 주소 문제를 독립 검증하는 글이 아니라 제작사의 설계 설명이라는 한계도 함께 봐야 합니다.

### 확인 범위

이번에는 별도 사업 아이디어를 제안하지 않습니다. AI 공유 링크 점검 수요는 확인했지만 공개 DNS·민감 대화를 다루는 법률·윤리·보안 게이트와 플랫폼 수정에 따른 대체 위험이 남았습니다.

ChatGPT Locked Chats는 한국 계정별 배포 시점과 PIN 분실 경험을 직접 시험하지 않았습니다. 잠금은 삭제나 학습 제외가 아니며, PIN 재설정은 잠금 대화와 관련 파일을 영구 삭제할 수 있습니다.

Muse의 6,800개는 공개 DNS에서 발견된 공유 호스트명 수입니다. 민감 대화나 피해자 수로 계산하지 않았고 실제 오용 증거도 확인되지 않았습니다. Meta의 별도 공식 공지, 이용자 통지와 기존 주소 완전 삭제 여부는 확인하지 못했습니다.

Lightroom의 무료 범위는 Adobe의 “무료” 설명과 DPReview가 시험한 “무료판 두 번”이 달랐습니다. 한국 계정의 정확한 무료 횟수와 다양한 얼굴·조명에서의 품질은 확인하지 못했습니다.

Paper는 arXiv 초록까지만, YouTube는 제목·채널·연결된 OpenAI Academy 페이지까지만 확인했습니다. 논문 전문과 전체 영상은 검토하지 않았습니다.
