import Markdown from 'markdown-to-jsx'

type ChatMarkdownProps = {
  children: string
  variant?: 'user' | 'assistant'
}

const userOverrides = {
  p: { props: { className: 'leading-relaxed' } },
  strong: { props: { className: 'font-semibold' } },
  em: { props: { className: 'italic' } },
  a: {
    props: {
      className: 'underline underline-offset-2 hover:no-underline',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  },
  ul: { props: { className: 'list-disc pl-5 space-y-1' } },
  ol: { props: { className: 'list-decimal pl-5 space-y-1' } },
  li: { props: { className: 'leading-relaxed' } },
  h1: { props: { className: 'text-lg font-bold' } },
  h2: { props: { className: 'text-base font-bold' } },
  h3: { props: { className: 'font-bold' } },
  blockquote: {
    props: {
      className:
        'border-l-2 border-white/30 pl-3 italic opacity-90',
    },
  },
  code: {
    props: {
      className: 'bg-white/15 rounded px-1.5 py-0.5 text-sm font-mono',
    },
  },
  pre: {
    props: {
      className: 'bg-white/10 rounded-lg p-3 overflow-x-auto text-sm font-mono my-2',
    },
  },
  hr: { props: { className: 'border-white/20 my-3' } },
}

const assistantOverrides = {
  p: { props: { className: 'leading-relaxed' } },
  strong: { props: { className: 'font-semibold text-white' } },
  em: { props: { className: 'italic' } },
  a: {
    props: {
      className:
        'text-emerald-400 hover:text-emerald-300 underline underline-offset-2 hover:no-underline transition-colors',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  },
  ul: { props: { className: 'list-disc pl-5 space-y-1' } },
  ol: { props: { className: 'list-decimal pl-5 space-y-1' } },
  li: { props: { className: 'leading-relaxed' } },
  h1: { props: { className: 'text-lg font-bold text-white' } },
  h2: { props: { className: 'text-base font-bold text-white' } },
  h3: { props: { className: 'font-bold text-white' } },
  blockquote: {
    props: {
      className:
        'border-l-2 border-slate-600 pl-3 italic text-slate-400',
    },
  },
  code: {
    props: {
      className:
        'bg-slate-700/60 rounded px-1.5 py-0.5 text-sm font-mono text-slate-200',
    },
  },
  pre: {
    props: {
      className:
        'bg-slate-900/60 rounded-lg p-3 overflow-x-auto text-sm font-mono my-2',
    },
  },
  hr: { props: { className: 'border-slate-700 my-3' } },
}

export const ChatMarkdown = ({
  children,
  variant = 'assistant',
}: ChatMarkdownProps) => {
  const overrides = variant === 'user' ? userOverrides : assistantOverrides

  return (
    <Markdown
      options={{
        overrides,
        forceBlock: true,
      }}
    >
      {children}
    </Markdown>
  )
}
