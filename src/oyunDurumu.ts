/** Oyun modülü yalnızca açıkça etkinleştirildiğinde kullanılabilir. */
export function oyunModuluEtkinMi(): boolean {
  return process.env.TURKOD_OYUN_MODULU === '1';
}
