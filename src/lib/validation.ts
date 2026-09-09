const VALID_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4'];
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

function ok(): ValidationResult {
  return { valid: true, error: null };
}

function fail(error: string): ValidationResult {
  return { valid: false, error };
}

/**
 * Valida a senha escolhida no registo — mínimo de caracteres e
 * confirmação igual. Lógica pura, sem tocar em estado de React.
 */
export function validateSignupPassword(password: string, confirmPassword: string): ValidationResult {
  if (password.length < 8) {
    return fail('A senha deve ter pelo menos 8 caracteres.');
  }
  if (password !== confirmPassword) {
    return fail('As senhas não coincidem.');
  }
  return ok();
}

/**
 * Valida um ficheiro de áudio antes do upload — tipo e tamanho.
 * Aceita tanto o `type` MIME reportado pelo browser (que às vezes vem
 * vazio ou errado, dependendo do dispositivo) como a extensão do nome do
 * ficheiro, como reforço.
 */
export function validateAudioFile(file: { type: string; size: number; name: string }): ValidationResult {
  const tipoValido = VALID_AUDIO_TYPES.includes(file.type) || /\.(mp3|wav|m4a)$/i.test(file.name);
  if (!tipoValido) {
    return fail('Formato não suportado. Usa MP3, WAV ou M4A.');
  }
  if (file.size > MAX_AUDIO_SIZE) {
    return fail('O ficheiro é demasiado grande. Máximo 20MB.');
  }
  return ok();
}

/**
 * Valida um ficheiro de imagem (capa, avatar) — só o tipo, sem limite de
 * tamanho próprio (o storage aplica os seus próprios limites).
 */
export function validateImageFile(file: { type: string }): ValidationResult {
  if (!file.type.startsWith('image/')) {
    return fail('A capa deve ser uma imagem.');
  }
  return ok();
}
