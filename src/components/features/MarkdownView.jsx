import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import stripMetadatos from '../../utils/stripMetadatos';

/**
 * MarkdownView
 * Renderiza el Markdown que producen los agentes con tipografía legible (claro/oscuro).
 * Antes de renderizar elimina el bloque de metadatos de máquina (ver stripMetadatos).
 *
 * No usa dangerouslySetInnerHTML: react-markdown sanitiza por defecto.
 *
 * @param {{ children: string }} props - El string Markdown a renderizar.
 */
const COMPONENTS = {
  h1: (props) => <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-4 mb-2 first:mt-0" {...props} />,
  h2: (props) => <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-4 mb-2 first:mt-0" {...props} />,
  h3: (props) => <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200 mt-3 mb-1.5 first:mt-0" {...props} />,
  p: (props) => <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300 my-2" {...props} />,
  ul: (props) => <ul className="list-disc pl-5 my-2 space-y-1 text-sm text-stone-700 dark:text-stone-300" {...props} />,
  ol: (props) => <ol className="list-decimal pl-5 my-2 space-y-1 text-sm text-stone-700 dark:text-stone-300" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  strong: (props) => <strong className="font-semibold text-stone-900 dark:text-stone-100" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  a: (props) => <a className="text-lime-700 dark:text-lime-400 underline" target="_blank" rel="noreferrer" {...props} />,
  blockquote: (props) => <blockquote className="border-l-4 border-stone-300 dark:border-stone-600 pl-3 my-2 italic text-stone-600 dark:text-stone-400" {...props} />,
  code: (props) => <code className="bg-stone-100 dark:bg-stone-800 rounded px-1 py-0.5 text-xs font-mono" {...props} />,
  hr: (props) => <hr className="my-4 border-stone-200 dark:border-stone-700" {...props} />,
  table: (props) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse" {...props} />
    </div>
  ),
  th: (props) => <th className="border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-left font-semibold bg-stone-100 dark:bg-stone-800" {...props} />,
  td: (props) => <td className="border border-stone-300 dark:border-stone-600 px-3 py-1.5 align-top" {...props} />,
};

const MarkdownView = ({ children }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
    {stripMetadatos(children)}
  </ReactMarkdown>
);

export default MarkdownView;
