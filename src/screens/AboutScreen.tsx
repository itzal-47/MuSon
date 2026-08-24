import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Music, FileText, Shield, Mail } from 'lucide-react';

type View = 'menu' | 'termos' | 'privacidade' | 'contacto';

export default function AboutScreen() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('menu');

  if (view === 'termos') {
    return (
      <div className="min-h-screen bg-black pb-32">
        <header className="px-6 pt-14 pb-6 flex items-center gap-4">
          <button onClick={() => setView('menu')} className="text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">Termos de Uso</h1>
        </header>
        <div className="px-6 max-w-sm mx-auto">
          <div className="prose prose-invert space-y-4 text-neutral-400 text-sm leading-relaxed">
            <p>Estes Termos de Uso regem a utilização da plataforma MuSon. Ao utilizar a aplicação, aceitas estes termos na totalidade.</p>
            <p><strong className="text-white">1. Utilização da plataforma</strong><br />O MuSon é uma plataforma de streaming de música. Comprometes-te a utilizar a aplicação de forma lícita e respeitosa.</p>
            <p><strong className="text-white">2. Conteúdo</strong><br />És responsável pelo conteúdo que publicares. Não deves publicar conteúdo que viole direitos de autor ou seja ofensivo.</p>
            <p><strong className="text-white">3. Conta</strong><br />És responsável pela segurança da tua conta e pela atividade realizada através dela.</p>
            <p><strong className="text-white">4. Serviço</strong><br />O MuSon pode ser interrompido ou modificado a qualquer momento, sem aviso prévio.</p>
            <p className="text-neutral-600 text-xs pt-4">Última atualização: Agosto 2026</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'privacidade') {
    return (
      <div className="min-h-screen bg-black pb-32">
        <header className="px-6 pt-14 pb-6 flex items-center gap-4">
          <button onClick={() => setView('menu')} className="text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">Política de Privacidade</h1>
        </header>
        <div className="px-6 max-w-sm mx-auto">
          <div className="space-y-4 text-neutral-400 text-sm leading-relaxed">
            <p>O MuSon respeita a tua privacidade. Esta política descreve como recolhemos e usamos os teus dados.</p>
            <p><strong className="text-white">1. Dados recolhidos</strong><br />Recolhemos o teu email, nome de utilizador e preferências de utilização necessárias para o funcionamento da plataforma.</p>
            <p><strong className="text-white">2. Utilização dos dados</strong><br />Os teus dados são utilizados exclusivamente para fornecer e melhorar o serviço MuSon.</p>
            <p><strong className="text-white">3. Partilha</strong><br />Não partilhamos os teus dados pessoais com terceiros sem o teu consentimento.</p>
            <p><strong className="text-white">4. Segurança</strong><br />Implementamos medidas de segurança para proteger os teus dados.</p>
            <p className="text-neutral-600 text-xs pt-4">Última atualização: Agosto 2026</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'contacto') {
    return (
      <div className="min-h-screen bg-black pb-32">
        <header className="px-6 pt-14 pb-6 flex items-center gap-4">
          <button onClick={() => setView('menu')} className="text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">Contacto e Suporte</h1>
        </header>
        <div className="px-6 max-w-sm mx-auto">
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/10 border border-amber-600/30 flex items-center justify-center mx-auto mb-4">
              <Mail size={26} className="text-amber-500" />
            </div>
            <p className="text-white font-semibold mb-1">Precisas de ajuda?</p>
            <p className="text-neutral-400 text-sm mb-4">Estamos aqui para te ajudar com qualquer questão.</p>
            <a
              href="mailto:suporte@muson.ao"
              className="inline-block px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors"
            >
              suporte@muson.ao
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-6 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-white">Sobre e Ajuda</h1>
      </header>

      <div className="px-6 max-w-sm mx-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-600/10 border border-amber-600/30 flex items-center justify-center mb-3">
            <Music size={30} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-white">MuSon</h2>
          <p className="text-neutral-500 text-sm">Versão 1.0.0</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setView('termos')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors"
          >
            <FileText size={18} className="text-amber-500" />
            <span className="flex-1 text-left text-white">Termos de uso</span>
            <ChevronRight size={18} className="text-neutral-600" />
          </button>

          <button
            onClick={() => setView('privacidade')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors"
          >
            <Shield size={18} className="text-amber-500" />
            <span className="flex-1 text-left text-white">Política de privacidade</span>
            <ChevronRight size={18} className="text-neutral-600" />
          </button>

          <button
            onClick={() => setView('contacto')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors"
          >
            <Mail size={18} className="text-amber-500" />
            <span className="flex-1 text-left text-white">Contacto e suporte</span>
            <ChevronRight size={18} className="text-neutral-600" />
          </button>
        </div>

        <p className="text-neutral-600 text-xs text-center mt-8">
          MuSon — Música Angolana e Lusófona<br />© 2026 MuSon. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
