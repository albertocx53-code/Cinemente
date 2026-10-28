// Variáveis de ambiente do servidor. Nunca importe este arquivo em componentes 'use client'.
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}. Veja .env.example`);
  return v;
}

export const env = {
  get codePepper() {
    return required('CODE_PEPPER');
  },
  get sessionSecret() {
    return required('SESSION_SECRET');
  },
  get webhookSecret() {
    return required('WEBHOOK_SECRET');
  },
  get isProd() {
    return process.env.NODE_ENV === 'production';
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  },
  get supportEmail() {
    return process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '';
  },
};
