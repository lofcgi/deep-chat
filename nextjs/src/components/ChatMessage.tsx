"use client";

import { memo, useState } from "react";
import { ChatMessage as ChatMessageType } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: ChatMessageType;
}

// 라우팅 점수 표시 컴포넌트
const RoutingScores = ({ scores }: { scores: Record<string, unknown> }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!scores || typeof scores !== "object") return null;

  const scoreEntries = Object.entries(scores);
  if (scoreEntries.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
      >
        <span>{isExpanded ? "▼" : "▶"}</span>
        상세 정보 ({scoreEntries.length}개 모델)
      </button>

      {isExpanded && (
        <div className="mt-2 p-2 bg-[#1a1a1a] rounded-lg">
          <div className="text-xs text-gray-400 mb-2">후보 모델 점수:</div>
          <div className="space-y-2">
            {scoreEntries.map(([model, scoreData]) => {
              const data = scoreData as {
                score: number;
                grade_label?: string;
                grade_value?: number;
              };
              return (
                <div
                  key={model}
                  className="border-b border-[#333] pb-2 last:border-b-0"
                >
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-300 font-medium">{model}</span>
                    <span className="text-blue-400">
                      {typeof data.score === "number"
                        ? data.score.toFixed(3)
                        : String(data.score)}
                    </span>
                  </div>
                  {data.grade_label && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">등급:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          (data.grade_value ?? 0) >= 4
                            ? "bg-green-900 text-green-300"
                            : (data.grade_value ?? 0) >= 3
                            ? "bg-yellow-900 text-yellow-300"
                            : (data.grade_value ?? 0) >= 2
                            ? "bg-orange-900 text-orange-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {data.grade_label} ({data.grade_value ?? 0}/5)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const ChatMessage = memo(function ChatMessage({
  message,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[90%] ${
          isUser ? "bg-[#2a2a2a] text-gray-100" : "text-gray-100"
        } rounded-2xl px-4 py-3`}
      >
        {isUser ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        ) : (
          <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mb-2 text-white">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold mb-2 text-white">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold mb-1 text-white">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-2 text-gray-100">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 text-gray-100">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 text-gray-100">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-[#333] px-1 py-0.5 rounded text-sm text-gray-200">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-[#333] p-3 rounded-lg mb-2 overflow-x-auto">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-500 pl-4 italic text-gray-300 mb-2">
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-white">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-200">{children}</em>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* 모델 정보와 라우팅 점수 표시 */}
        {!isUser && (message.model_used || message.routing_scores) && (
          <div className="mt-3 pt-3 border-t border-[#333]">
            {message.model_used && (
              <div className="flex items-center text-xs text-gray-400 mb-2">
                <span className="mr-2">선택된 모델:</span>
                <span className="text-blue-400 font-medium">
                  {message.model_used}
                </span>
              </div>
            )}
            {message.routing_scores && (
              <RoutingScores scores={message.routing_scores} />
            )}
          </div>
        )}
      </div>
    </div>
  );
});
