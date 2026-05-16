# Monthly Closing Dashboard Desktop (Electron)

로컬 PC에서 실행되는 Electron 기반 "Monthly 결산 대시보드 자동 생성 및 메일 발송" 예시 프로젝트입니다.

## 1) 전체 아키텍처

### 시스템 구성(텍스트 다이어그램)
1. **Renderer(UI)**: 기준월 선택, 인터페이스 선택, 미리보기/승인, 메일 발송 트리거.
2. **Main Process(Application Orchestrator)**: IPC 수신, ERP/Chat/LLM/Template/Email 서비스 호출, DB 기록.
3. **ERP Adapter Layer**: RFC/REST/Mock를 동일 인터페이스로 제공.
4. **Chat Adapter Layer**: API/File/Clipboard/Mock 수집 후 표준화.
5. **LLM 2-Step**:
   - Step1 Chat 분석 → `supportRequests`
   - Step2 Dashboard 요약 → `executiveSummary`, `riskAlerts`, `actionItems` 등
6. **Template Engine(Handlebars)**: JSON → HTML Dashboard.
7. **Local Persistence(SQLite + files)**: 원천데이터, 분석결과, 이력 저장.
8. **Mailer(Nodemailer)**: 테스트/실발송, 승인 후 전송.

### Main/Renderer 역할 분리
- **Main**: 외부 연동, Credential 접근, 로깅, DB, 파일 저장, 메일 발송.
- **Renderer**: 입력/조회/미리보기 전용. 민감정보 직접 접근 금지.

### 보안 구조
- `.env` + OS Secure Storage(확장 가능)로 비밀값 보관.
- Preload의 최소 IPC만 노출.
- LLM 송신 전 마스킹 + 최소 데이터 전송.
- 자동발송 기본 OFF.

### 장애 Fallback
- ERP 실패: Mock ERP 또는 수기/파일 import fallback.
- Chat API 실패: 파일 업로드/Clipboard fallback.
- LLM Schema 실패: 재시도 → 실패 시 rule-based 축약 보고서 생성.

## 2) 기능 목록

### MVP
- 기준월 선택
- ERP(Adapter: RFC/REST/Mock) 조회
- Chat(Adapter: API/File/Clipboard/Mock) 수집/필터
- LLM 2단계 분석 + JSON Schema 검증
- KPI 계산, HTML 대시보드 생성/미리보기
- 승인 후 이메일 발송
- 로그/이력 로컬 저장

### 2차 개선
- 다국어 보고서
- 권한기반 마스킹 정책
- 배치 예약 생성/발송
- 첨부(PDF/CSV) 자동 생성

### 확장
- SAP BTP 이벤트 연계
- Teams/Jira 연동
- 온프레미스 LLM 추론 엔진 교체

## 3) 권장 폴더 구조

```text
closingdashboard/
├─ main.js
├─ preload.js
├─ package.json
├─ .env.example
├─ db/
│  └─ schema.sql
├─ renderer/
│  ├─ index.html
│  └─ app.js
├─ services/
│  ├─ erpService.js
│  ├─ chatService.js
│  ├─ llmService.js
│  ├─ emailService.js
│  ├─ importService.js
│  ├─ templateService.js
│  ├─ maskingService.js
│  └─ metricsService.js
├─ templates/
│  └─ dashboard.hbs
├─ schemas/
│  ├─ supportRequests.schema.json
│  └─ dashboardSummary.schema.json
├─ samples/
│  ├─ erp-close-status.json
│  ├─ chat-messages.json
│  ├─ support-requests.json
│  ├─ dashboard-input.json
│  └─ dashboard-summary.json
└─ logs/
```

## 4) 데이터 모델(핵심 필드)

> 상세 DDL은 `db/schema.sql` 참고.

- Company: `company_code`, `company_name`, `timezone`, `is_active`
- ClosingSchedule: `closing_month`, `start_date`, `target_end_at`, `current_stage`, `overall_status`
- ClosingResult: `company_code`, `target_completed_at`, `actual_completed_at`, `is_completed`, `is_delayed`, `delay_minutes`
- ClosingHistory: `company_code`, `closing_month`, `completed_at`, `delay_minutes`
- ModuleClosingStatus: `company_code`, `module_code`, `status`, `error_count`
- ClosingIssue: `issue_id`, `company_code`, `module_code`, `severity`, `status`, `owner`, `due_date`, `exec_report_required`
- ChatChannel: `channel_id`, `channel_name`, `source_system`
- ChatMessage: `message_id`, `thread_id`, `sender_name`, `sender_role`, `timestamp`, `text`, `related_company_code`, `related_module`
- ChatThread: `thread_id`, `channel_id`, `started_at`, `last_message_at`
- SupportRequest: 요청/응답/상태/병목/의사결정필요/임원보고필요
- MonthlyChange: 변화 유형/중요도/요약
- DashboardGenerationHistory: 생성 버전, 입력 해시, html 파일 경로
- EmailRecipientGroup / EmailRecipient
- EmailSendHistory
- InterfaceLog: ERP/Chat API 호출 메타
- LlmAnalysisLog: prompt 버전, schema검증 결과, 토큰량

## 5) ERP Interface 설계

- RFC: `node-rfc`로 `Z_RFC_GET_MONTHLY_CLOSE_STATUS`, `...HISTORY`, `...ISSUES` 호출
- REST: OData/REST API + Bearer token
- Mock: `samples/erp-close-status.json` 반환
- 표준화 JSON: `closingMonth`, `companies[]`, `issues[]`, `moduleStatuses[]`, `history[]`
- 실패 fallback: RFC 실패→REST→Mock→수기 import 순서
- 호출 로그: endpoint/rfcName, requestId, durationMs, success, errorMessage

## 6) Chat Interface 설계

- API: 기간/채널/사용자 파라미터로 페이징 수집
- File: JSON/CSV/XLSX 파싱 후 표준화
- Clipboard: paste raw text → line/message 파서
- Mock: `samples/chat-messages.json`
- Thread 그룹핑: `threadId` 기준, 없으면 `replyToMessageId`/시간근접도 기반
- 필터링: 기준월 + 키워드 + 채널 + 역할 + 법인/모듈 언급
- 마스킹: 금액/계정/이름/법인코드 설정별 치환

## 7) LLM Prompt 설계

`services/llmService.js`, `schemas/*.json`에 포함.

- Prompt1(Chat 분석): thread 단위로 `supportRequests` 추출
- Prompt2(Dashboard 요약): KPI 고정값 기반 요약/위험/조치 생성
- 공통: 수치 재계산 금지, 스키마 불일치 시 재요청

## 8) HTML 대시보드 템플릿

- `templates/dashboard.hbs` 사용
- 이메일 호환성 위해 테이블/인라인 CSS 중심
- 섹션: KPI 카드, 법인 비교, 3개월 추세, 이슈, 지원요청, 리스크/액션

## 9) 실행 방법

```bash
npm install
cp .env.example .env
npm start
```

## 10) 메일 발송 흐름

1. 수신자 그룹 선택
2. 테스트 메일 발송(옵션)
3. 미리보기 승인
4. HTML 메일 발송(+첨부)
5. 발송 이력 저장

## 11) 예시 데이터/결과물

- ERP 샘플: `samples/erp-close-status.json`
- Chat 샘플: `samples/chat-messages.json`
- Chat 분석 결과: `samples/support-requests.json`
- 통합 입력: `samples/dashboard-input.json`
- Dashboard LLM 출력: `samples/dashboard-summary.json`
- 최종 HTML: 앱 실행 시 `output/*.html`
