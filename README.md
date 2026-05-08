# 🍁 Maple Letters

> 캐나다 어학연수 시절 친구들끼리 편지를 남기는 **땅따먹기 롤링페이퍼**.
> 캐나다 국기 위 16×8 = 128칸의 그리드에서 친구들이 칸을 골라 자기 땅을 차지하고 편지를 남깁니다. 편지 내용은 주인(나)만 비밀번호로 열어볼 수 있어요.

![Maple Letters preview](./docs/preview.png)

## ✨ Features

- 🇨🇦 진짜 캐나다 국기(공식 SVG path) 위 16×8 그리드
- 🪧 닉네임 + 메시지(최대 500자) + 카드 색상 + 스티커
- 🔒 주인 비밀번호 인증 — 본인만 모든 편지 내용 열람 가능, 나머지는 닉네임만 보임
- ❤️ 편지에 하트 누르기
- 🌐 한국어 / English 토글
- ✏️ 편지지 이름 자유롭게 수정 (예: "민지의 캐나다 어학연수")

## 🛠 Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + Radix UI
- **TanStack Query** (서버 상태)
- **Drizzle ORM** + **Vercel Postgres**
- **Pretendard** 폰트 + Caveat/Gaegu(편지 손글씨용)

## 🚀 Local development

```bash
# 1. Install
npm install

# 2. Env vars
cp .env.example .env.local
# .env.local 열어서 POSTGRES_URL 채우기
# (Vercel Postgres 무료 티어 권장)

# 3. Push schema
npm run db:push

# 4. Dev server
npm run dev
# → http://localhost:5000
```

## ☁️ Deploy to Vercel

1. **Vercel에 GitHub 저장소 import**
2. **Storage → Postgres** 추가하면 `POSTGRES_URL`이 자동 주입됩니다
3. 환경 변수에 `OWNER_SALT` 직접 추가 (긴 랜덤 문자열 권장)
4. **Deploy** 클릭
5. 첫 배포 후 `npm run db:push`를 한 번 실행해서 테이블 생성
   - 또는 Drizzle migration을 빌드 hook에 추가

## 📁 Project structure

```
maple-letters/
├── app/
│   ├── layout.tsx              # Root layout (Pretendard, providers)
│   ├── page.tsx                # 메인 페이지 (그리드 + 다이얼로그들)
│   ├── globals.css             # Tailwind + 디자인 토큰
│   ├── providers.tsx           # React Query provider
│   └── api/
│       ├── settings/route.ts            # GET/PATCH 편지지 설정
│       ├── owner/verify/route.ts        # POST 비밀번호 검증
│       └── messages/
│           ├── route.ts                 # GET/POST 메시지
│           └── [id]/heart/route.ts      # POST 하트 +1
├── components/
│   ├── MapleLeaf.tsx           # 단풍잎/하트/별 SVG
│   └── ui/                     # 슬림 shadcn-스타일 (Button, Dialog, Input...)
├── lib/
│   ├── schema.ts               # Drizzle 스키마 + Zod 검증
│   ├── db.ts                   # Drizzle 클라이언트
│   ├── auth.ts                 # 비밀번호 SHA-256 해시
│   ├── i18n.ts                 # KR/EN 번역
│   └── api-client.ts           # fetch 래퍼 + owner 헤더
└── drizzle.config.ts
```

## 🔐 보안 메모

- 비밀번호는 `OWNER_SALT`와 함께 SHA-256으로 해시되어 저장됩니다
- 편지 내용은 헤더 `X-Owner-Password`가 검증된 요청에만 응답됩니다 (비주인은 `hasContent: true/false`만 받음)

## 📜 License

MIT
