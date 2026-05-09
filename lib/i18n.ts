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
  saveSettings: string;
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
  // Custom text labels (settings)
  customTextHeading: string;
  customTextDesc: string;
  customSubtitleLabel: string;
  customCtaLabel: string;
  customWriteTitleLabel: string;
  customWriteDescLabel: string;
  customLockedMsgLabel: string;
  customShareTextLabel: string;
  customPlaceholder: string;
  // Lock controls (in settings)
  lockSection: string;
  lockBtn: string;
  unlockBtn: string;
  passwordSection: string;
  changePassword: string;
  setPasswordFirst: string;
  // Delete
  deleteBtn: string;
  deleteConfirm: string;
  deleteConfirmYes: string;
  deleted: string;
  deleteFailed: string;
};

export const translations: Record<"ko" | "en", Dict> = {
  ko: {
    madeIn: "Made with ♥ in Canada",
    subtitle: "캐나다에서 함께한 시간을 편지로 남겨주세요",
    progress: (filled: number, total: number) => `${filled} / ${total} 칸 · 비밀번호를 아는 사람만 읽을 수 있는 편지예요`,
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
    save: "편지 남기기",
    saveSettings: "저장",
    cancel: "취소",
    charCount: (n: number) => `${n} / 500자`,

    // Detail dialog
    detailTitle: "편지",
    locked: "이 편지는 비밀번호를 아는 사람만 읽을 수 있어요",
    unlockHint: "비밀번호를 알고 있다면 자물쇠 아이콘으로 잠금을 풀어주세요",

    // Settings
    settingsTitle: "편지지 설정",
    paperName: "편지지 이름",
    paperNamePh: "예: 민지의 캐나다 어학연수",
    ownerPassword: "관리 비밀번호",
    currentPassword: "현재 비밀번호",
    newPassword: "새 비밀번호",
    firstSetup: "처음이라면 새 비밀번호만 입력하세요",
    settingsSaved: "저장되었습니다",
    settingsFailed: "저장 실패. 비밀번호를 확인하세요",

    // Unlock
    unlockTitle: "비밀번호 확인",
    unlockDesc: "비밀번호를 입력하면 모든 편지 내용을 볼 수 있어요",
    unlock: "잠금 해제",
    locking: "잠금",
    locked2: "잠금 해제됨",

    // Errors
    cellTaken: "이미 다른 사람이 차지한 칸이에요. 다른 칸을 골라주세요.",
    saveFailed: "저장 중 문제가 발생했어요. 다시 시도해주세요.",
    wrongPassword: "비밀번호가 틀려요",

    // Share
    copyUrl: "공유하기",
    copied: "링크가 복사됐어요",

    // Custom text labels
    customTextHeading: "문구 직접 바꾸기",
    customTextDesc: "비워두면 기본 문구가 사용돼요",
    customSubtitleLabel: "부제목",
    customCtaLabel: "안내 문구 (메인 하단)",
    customWriteTitleLabel: "편지 작성 제목",
    customWriteDescLabel: "편지 작성 설명",
    customLockedMsgLabel: "잠긴 편지 안내",
    customShareTextLabel: "공유 문구",
    customPlaceholder: "기본값 사용",

    // Lock
    lockSection: "잠금",
    lockBtn: "다시 잠그기",
    unlockBtn: "잠금 해제",
    passwordSection: "비밀번호",
    changePassword: "비밀번호 변경",
    setPasswordFirst: "처음이라면 새 비밀번호를 설정해주세요",

    // Delete
    deleteBtn: "삭제",
    deleteConfirm: "이 편지를 정말 삭제할까요? 되돌릴 수 없어요.",
    deleteConfirmYes: "삭제할게요",
    deleted: "편지를 삭제했어요",
    deleteFailed: "삭제하지 못했어요. 다시 시도해주세요.",
  },
  en: {
    madeIn: "Made with ♥ in Canada",
    subtitle: "Leave a letter from your Canada days",
    progress: (filled: number, total: number) => `${filled} / ${total} tiles · Only people with the password can read`,
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
    save: "Leave letter",
    saveSettings: "Save",
    cancel: "Cancel",
    charCount: (n: number) => `${n} / 500`,

    detailTitle: "Letter",
    locked: "Only people with the password can read this letter",
    unlockHint: "If you know the password, click the lock icon to unlock",

    settingsTitle: "Paper settings",
    paperName: "Paper name",
    paperNamePh: "e.g., Min-ji's Canada Journey",
    ownerPassword: "Admin password",
    currentPassword: "Current password",
    newPassword: "New password",
    firstSetup: "First time? Just set a new password",
    settingsSaved: "Saved",
    settingsFailed: "Save failed. Check your password",

    unlockTitle: "Password verification",
    unlockDesc: "Enter the password to read every letter",
    unlock: "Unlock",
    locking: "Locked",
    locked2: "Unlocked",

    cellTaken: "Someone already claimed this tile. Pick another one.",
    saveFailed: "Something went wrong. Try again.",
    wrongPassword: "Wrong password",

    copyUrl: "Share",
    copied: "Link copied",

    // Custom text labels
    customTextHeading: "Custom text",
    customTextDesc: "Leave blank to use the default",
    customSubtitleLabel: "Subtitle",
    customCtaLabel: "Hint text (below grid)",
    customWriteTitleLabel: "Write dialog title",
    customWriteDescLabel: "Write dialog description",
    customLockedMsgLabel: "Locked-letter message",
    customShareTextLabel: "Share message",
    customPlaceholder: "Using default",

    // Lock
    lockSection: "Lock",
    lockBtn: "Lock again",
    unlockBtn: "Unlock",
    passwordSection: "Password",
    changePassword: "Change password",
    setPasswordFirst: "First time? Set a new password",

    // Delete
    deleteBtn: "Delete",
    deleteConfirm: "Delete this letter? This can't be undone.",
    deleteConfirmYes: "Yes, delete",
    deleted: "Letter deleted",
    deleteFailed: "Couldn't delete. Try again.",
  },
};

export type T = Dict;
