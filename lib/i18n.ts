export type Lang = "ko" | "en";

type Dict = {
  madeIn: string;
  subtitle: string;
  progress: (filled: number, total: number) => string;
  cta: string;
  flagFull: string;
  writeTitle: string;
  writeDesc: string;
  nickname: string;
  nicknamePh: string;
  message: string;
  messagePh: string;
  color: string;
  sticker: string;
  save: string;
  cancel: string;
  charCount: (n: number) => string;
  detailTitle: string;
  locked: string;
  unlockHint: string;
  settingsTitle: string;
  paperName: string;
  paperNamePh: string;
  ownerPassword: string;
  currentPassword: string;
  newPassword: string;
  firstSetup: string;
  settingsSaved: string;
  settingsFailed: string;
  unlockTitle: string;
  unlockDesc: string;
  unlock: string;
  locking: string;
  locked2: string;
  cellTaken: string;
  saveFailed: string;
  wrongPassword: string;
  copyUrl: string;
  copied: string;
};

export const translations: Record<"ko" | "en", Dict> = {
  ko: {
    madeIn: "Made with ♥ in Canada",
    subtitle: "캐나다에서 함께한 시간을 편지로 남겨주세요",
    progress: (filled: number, total: number) => `${filled} / ${total} 칸 · 주인만 읽을 수 있는 편지예요`,
    cta: "칸을 골라 내 편지를 남겨주세요",
    flagFull: "← 좌우로 스크롤해서 국기 전체를 보세요 →",

    // Write dialog
    writeTitle: "이 칸에 편지 남기기",
    writeDesc: "여긴 비어있어요. 닉네임과 메시지를 적으면 이 칸이 내 땅이 돼요.",
    nickname: "닉네임",
    nicknamePh: "예: 민지",
    message: "메시지",
    messagePh: "캐나다에서 함께한 추억, 응원, 한마디...",
    color: "카드 색상",
    sticker: "스티커",
    save: "이 칸 차지하기",
    cancel: "취소",
    charCount: (n: number) => `${n} / 500자`,

    // Detail dialog
    detailTitle: "편지",
    locked: "이 편지는 주인만 읽을 수 있어요",
    unlockHint: "주인이라면 자물쇠 아이콘으로 잠금을 풀어주세요",

    // Settings
    settingsTitle: "편지지 설정",
    paperName: "편지지 이름",
    paperNamePh: "예: 민지의 캐나다 어학연수",
    ownerPassword: "주인 비밀번호",
    currentPassword: "현재 비밀번호",
    newPassword: "새 비밀번호",
    firstSetup: "처음이라면 새 비밀번호만 입력하세요",
    settingsSaved: "저장되었습니다",
    settingsFailed: "저장 실패. 비밀번호를 확인하세요",

    // Unlock
    unlockTitle: "주인 인증",
    unlockDesc: "비밀번호를 입력하면 모든 편지 내용을 볼 수 있어요",
    unlock: "잠금 해제",
    locking: "잠금",
    locked2: "잠금 해제됨",

    // Errors
    cellTaken: "이미 다른 사람이 차지한 칸이에요. 다른 칸을 골라주세요.",
    saveFailed: "저장 중 문제가 발생했어요. 다시 시도해주세요.",
    wrongPassword: "비밀번호가 틀려요",

    // Share
    copyUrl: "링크 복사",
    copied: "복사됨!",
  },
  en: {
    madeIn: "Made with ♥ in Canada",
    subtitle: "Leave a letter from your Canada days",
    progress: (filled: number, total: number) => `${filled} / ${total} tiles · Only the owner can read`,
    cta: "Pick a tile and leave your letter",
    flagFull: "← Scroll to explore the whole flag →",

    writeTitle: "Leave a letter on this tile",
    writeDesc: "This tile is empty. Write your nickname and message to claim it.",
    nickname: "Nickname",
    nicknamePh: "e.g., Min-ji",
    message: "Message",
    messagePh: "Memories from Canada, encouragement, anything...",
    color: "Card color",
    sticker: "Sticker",
    save: "Claim this tile",
    cancel: "Cancel",
    charCount: (n: number) => `${n} / 500`,

    detailTitle: "Letter",
    locked: "Only the owner can read this letter",
    unlockHint: "If you're the owner, click the lock icon to unlock",

    settingsTitle: "Paper settings",
    paperName: "Paper name",
    paperNamePh: "e.g., Min-ji's Canada Journey",
    ownerPassword: "Owner password",
    currentPassword: "Current password",
    newPassword: "New password",
    firstSetup: "First time? Just set a new password",
    settingsSaved: "Saved",
    settingsFailed: "Save failed. Check your password",

    unlockTitle: "Owner verification",
    unlockDesc: "Enter the password to read every letter",
    unlock: "Unlock",
    locking: "Locked",
    locked2: "Unlocked",

    cellTaken: "Someone already claimed this tile. Pick another one.",
    saveFailed: "Something went wrong. Try again.",
    wrongPassword: "Wrong password",

    copyUrl: "Copy link",
    copied: "Copied!",
  },
};

export type T = Dict;
