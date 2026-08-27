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
            <p className="text-neutral-500 text-xs bg-neutral-900 border border-neutral-800 rounded-xl p-3">
              Este documento descreve as regras de utilização do MuSon. Não substitui aconselhamento jurídico — antes de um lançamento público ou de introduzir pagamentos reais, recomenda-se a revisão por um advogado.
            </p>

            <p><strong className="text-white">1. Aceitação dos termos</strong><br />
            Ao criar uma conta ou utilizar o MuSon, aceitas estes Termos de Uso na totalidade. Se não concordares, não deves utilizar a plataforma.</p>

            <p><strong className="text-white">2. Descrição do serviço</strong><br />
            O MuSon é uma plataforma de streaming de música focada em artistas e produtores angolanos e lusófonos. Permite ouvir, descobrir, publicar e partilhar música, criar playlists, seguir artistas e interagir com outros utilizadores.</p>

            <p><strong className="text-white">3. Contas de utilizador</strong><br />
            Precisas de fornecer um email válido e escolher uma senha para criar conta. És responsável por manter a tua senha em segurança e por toda a atividade realizada na tua conta. Deves ter pelo menos 13 anos para criar conta no MuSon. Podes escolher entre perfil de Ouvinte, Artista ou Produtor — o tipo de perfil pode ser alterado ou revisto no futuro.</p>

            <p><strong className="text-white">4. Conteúdo publicado por artistas e produtores</strong><br />
            Se publicares faixas, capas, videoclipes ou outro conteúdo, declaras que és o titular dos direitos desse conteúdo (ou tens autorização para o publicar). É proibido publicar música que uses instrumentais, amostras ("samples") ou gravações de terceiros sem autorização. O MuSon pode remover conteúdo que viole direitos de autor ou estas regras, mediante denúncia ou verificação interna, sem aviso prévio quando a situação o justificar.</p>

            <p><strong className="text-white">5. Selo de verificação</strong><br />
            Artistas e produtores podem pedir um selo de verificação, submetendo informação e provas de identidade (ex: redes sociais, outras plataformas). A atribuição do selo é uma decisão da equipa do MuSon e não constitui garantia legal de identidade — serve apenas como indicador de confiança para os ouvintes.</p>

            <p><strong className="text-white">6. Regras de conduta</strong><br />
            É proibido: assediar ou ameaçar outros utilizadores; publicar conteúdo ilegal, discriminatório ou que incite ao ódio ou à violência; criar contas falsas ou fazer-se passar por outra pessoa; usar bots, scripts ou automação para manipular reproduções, gostos ou seguidores; tentar contornar os limites técnicos da plataforma (ex: publicação em massa, denúncias em massa).</p>

            <p><strong className="text-white">7. Denúncias e moderação</strong><br />
            Podes denunciar conteúdo ou comportamento que viole estas regras. As denúncias são revistas pela equipa de administração do MuSon, que pode remover conteúdo, suspender ou encerrar contas em caso de violação repetida ou grave.</p>

            <p><strong className="text-white">8. Propriedade intelectual da plataforma</strong><br />
            O nome "MuSon", o logótipo e o design da plataforma são propriedade do MuSon. O conteúdo publicado por artistas e produtores continua a pertencer a quem o publicou — o MuSon não reivindica propriedade sobre a tua música.</p>

            <p><strong className="text-white">9. Disponibilidade do serviço</strong><br />
            O MuSon está em desenvolvimento ativo e pode ser interrompido, alterado ou descontinuado, no todo ou em parte, a qualquer momento. Fazemos o possível para avisar com antecedência sempre que praticável.</p>

            <p><strong className="text-white">10. Limitação de responsabilidade</strong><br />
            O MuSon é disponibilizado "tal como está". Na máxima medida permitida por lei, não nos responsabilizamos por perdas resultantes da utilização ou impossibilidade de utilização da plataforma, incluindo perda de conteúdo, dados ou receita.</p>

            <p><strong className="text-white">11. Encerramento de conta</strong><br />
            Podes encerrar a tua conta a qualquer momento nas Definições. Podemos suspender ou encerrar contas que violem estes termos, com aviso sempre que a situação o permitir.</p>

            <p><strong className="text-white">12. Lei aplicável</strong><br />
            Estes termos são regidos pela lei angolana, sem prejuízo de direitos de proteção ao consumidor aplicáveis no país de residência do utilizador.</p>

            <p><strong className="text-white">13. Alterações a estes termos</strong><br />
            Podemos atualizar estes Termos de Uso à medida que a plataforma evolui. Alterações significativas serão comunicadas dentro da aplicação.</p>

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
            <p className="text-neutral-500 text-xs bg-neutral-900 border border-neutral-800 rounded-xl p-3">
              Este documento explica que dados o MuSon recolhe e como são usados. Não substitui aconselhamento jurídico — recomenda-se revisão por um advogado antes de um lançamento público.
            </p>

            <p><strong className="text-white">1. Quem trata os teus dados</strong><br />
            O MuSon é responsável pelo tratamento dos dados recolhidos através da plataforma. Usamos o Supabase como infraestrutura de base de dados e autenticação — os teus dados ficam armazenados nos servidores do Supabase, sujeitos às medidas de segurança dessa infraestrutura.</p>

            <p><strong className="text-white">2. Dados que recolhemos</strong><br />
            <strong className="text-neutral-200">Dados de conta:</strong> email, senha (encriptada, nunca visível a nós), username, nome apresentado.<br />
            <strong className="text-neutral-200">Dados de perfil (opcionais):</strong> foto, bio, província, géneros musicais, redes sociais.<br />
            <strong className="text-neutral-200">Dados de utilização:</strong> faixas ouvidas e histórico, gostos, playlists, seguidores, comentários, streak de audição.<br />
            <strong className="text-neutral-200">Dados técnicos guardados no teu dispositivo:</strong> fila de reprodução, preferência de poupança de dados, e cache temporário de áudio para audição offline (até 3 dias, apagado automaticamente).</p>

            <p><strong className="text-white">3. Como usamos os dados</strong><br />
            Para: criar e gerir a tua conta; guardar as tuas playlists, gostos e histórico; mostrar-te recomendações e conteúdo relevante (ex: rádio por província, artistas semelhantes); calcular estatísticas para artistas e produtores sobre as suas próprias faixas; moderar conteúdo e responder a denúncias.</p>

            <p><strong className="text-white">4. Partilha de dados</strong><br />
            Não vendemos os teus dados pessoais. Alguns dados do teu perfil público (nome, foto, bio, faixas publicadas, número de seguidores) são visíveis a qualquer pessoa que use o MuSon, por serem essenciais ao funcionamento de uma plataforma de música. Dados de estatísticas (ex: província de quem ouve) só são mostrados de forma agregada ao artista dono da faixa, nunca identificando ouvintes individuais.</p>

            <p><strong className="text-white">5. Segurança</strong><br />
            Usamos controlo de acesso ao nível da base de dados (Row Level Security) para garantir que cada utilizador só acede aos dados que lhe pertencem ou que são públicos. As senhas nunca são guardadas em texto simples.</p>

            <p><strong className="text-white">6. Os teus direitos</strong><br />
            Podes aceder, corrigir ou eliminar os teus dados a qualquer momento a partir das Definições da tua conta. Ao eliminar a conta, os teus dados pessoais são removidos, com exceção de informação que sejamos legalmente obrigados a reter.</p>

            <p><strong className="text-white">7. Retenção de dados</strong><br />
            Mantemos os teus dados enquanto a conta estiver ativa. O cache de áudio offline no teu dispositivo expira automaticamente ao fim de 3 dias, independentemente da tua conta.</p>

            <p><strong className="text-white">8. Menores de idade</strong><br />
            O MuSon não é destinado a crianças com menos de 13 anos. Não recolhemos intencionalmente dados de crianças abaixo dessa idade.</p>

            <p><strong className="text-white">9. Alterações a esta política</strong><br />
            Podemos atualizar esta política à medida que a plataforma evolui, especialmente ao introduzir funcionalidades de pagamento. Alterações significativas serão comunicadas dentro da aplicação.</p>

            <p><strong className="text-white">10. Contacto</strong><br />
            Para questões sobre os teus dados, contacta-nos através da secção "Contacto e suporte".</p>

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
