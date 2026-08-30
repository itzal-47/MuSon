interface Props {
  text: string;
}

/**
 * Renderiza texto guardado pelo painel de administração: parágrafos
 * separados por linha em branco; se a primeira linha de um parágrafo
 * estiver envolvida em **asteriscos**, aparece a negrito (usado para
 * títulos de secção nos Termos/Privacidade).
 */
export default function RichTextViewer({ text }: Props) {
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim().length > 0);

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        const firstLine = lines[0];
        const boldMatch = firstLine.match(/^\*\*(.+)\*\*$/);

        if (boldMatch) {
          const rest = lines.slice(1).join('\n');
          return (
            <p key={i}>
              <strong className="text-white">{boldMatch[1]}</strong>
              {rest && <><br />{rest}</>}
            </p>
          );
        }

        return <p key={i}>{block}</p>;
      })}
    </div>
  );
}
