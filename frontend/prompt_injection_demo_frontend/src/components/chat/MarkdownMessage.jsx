import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function MarkdownMessage({ text }) {
  return (
    <div className="chat-markdown break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noreferrer"
            />
          ),
        }}
      >
        {text || ""}
      </ReactMarkdown>
    </div>
  )
}
