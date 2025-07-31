"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatInput } from "../../../components/ChatInput";
import { ChatMessage } from "../../../components/ChatMessage";
import { Sidebar } from "../../../components/Sidebar";
import ReactMarkdown from "react-markdown";
import {
  createChatSession,
  sendMessage,
  getChatSession,
  ChatSession,
  ChatMessage as ChatMessageType,
  StreamingChunk,
} from "@/lib/api";

interface SessionClientProps {
  sessionId: number;
}

// 스트리밍 메시지용 라우팅 점수 컴포넌트
const StreamingRoutingScores = ({
  scores,
}: {
  scores: Record<string, unknown>;
}) => {
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

export function SessionClient({ sessionId }: SessionClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [modelUsed, setModelUsed] = useState("");
  const [routingScores, setRoutingScores] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [isWaitingForFirstChunk, setIsWaitingForFirstChunk] = useState(false);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const [refreshSessions, setRefreshSessions] = useState(0);
  const initialMessageProcessed = useRef(false);

  // 자동 스크롤 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지가 추가될 때마다 자동 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // localStorage에서 사이드바 상태를 바로 읽어와서 초기 상태로 설정
  const getInitialSidebarState = () => {
    if (typeof window !== "undefined") {
      const savedSidebarState = localStorage.getItem("sidebarOpen");
      return savedSidebarState === "true";
    }
    return false;
  };

  const [sidebarOpen, setSidebarOpen] = useState(getInitialSidebarState);

  // 사이드바 상태 변경 시 localStorage에 저장
  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("sidebarOpen", newState.toString());
  };

  // 세션 데이터 로드
  useEffect(() => {
    const loadSession = async () => {
      try {
        console.log("세션 로드 시작:", sessionId);
        const session = await getChatSession(sessionId);
        console.log("세션 로드 성공:", session);
        setCurrentSession(session);

        // 초기 메시지가 있는 경우 사용자 메시지 추가
        const initialMessage = searchParams.get("message");
        if (initialMessage && session.messages.length === 0) {
          const userMessage: ChatMessageType = {
            id: Date.now(),
            session_id: sessionId,
            role: "user",
            content: initialMessage,
            created_at: new Date().toISOString(),
          };
          setMessages([userMessage]);
        } else {
          setMessages(session.messages || []);
        }
      } catch (error) {
        console.error("Failed to load session:", error);
        // 세션이 없으면 새로 생성
        try {
          console.log("새 세션 생성 중...");
          const newSession = await createChatSession();
          console.log("새 세션 생성됨:", newSession);
          router.push(`/session/${newSession.id}`);
        } catch (createError) {
          console.error("Failed to create new session:", createError);
          // 에러가 발생하면 홈페이지로 리다이렉트
          router.push("/");
        }
      }
    };

    if (sessionId && !isNaN(sessionId)) {
      loadSession();
    } else {
      console.error("Invalid session ID:", sessionId);
      router.push("/");
    }
  }, [sessionId, router, searchParams]);

  // 초기 메시지 처리 (별도의 useEffect)
  useEffect(() => {
    if (currentSession && !initialMessageProcessed.current) {
      const initialMessage = searchParams.get("message");
      if (initialMessage && currentSession.messages.length === 0) {
        console.log("초기 메시지 전송:", initialMessage);
        initialMessageProcessed.current = true;
        setInitialMessageSent(true);

        // 즉시 API 호출
        handleSendMessage(initialMessage, true);
      }
    }
  }, [currentSession, sessionId, searchParams]);

  const handleSendMessage = async (
    content: string,
    skipUserMessage = false
  ) => {
    try {
      console.log(
        "handleSendMessage 호출:",
        content,
        "skipUserMessage:",
        skipUserMessage
      );
      setIsLoading(true);
      setStreamingMessage("");
      setModelUsed("");
      setRoutingScores(null);
      setIsWaitingForFirstChunk(true); // 첫 번째 청크를 기다리기 시작

      // 사용자 메시지를 먼저 UI에 추가 (skipUserMessage가 false인 경우만)
      if (!skipUserMessage) {
        const userMessage: ChatMessageType = {
          id: Date.now(),
          session_id: sessionId,
          role: "user",
          content,
          created_at: new Date().toISOString(),
        };

        console.log("handleSendMessage에서 사용자 메시지 추가:", userMessage);
        setMessages((prev) => {
          console.log("handleSendMessage 이전 메시지:", prev);
          const newMessages = [...prev, userMessage];
          console.log("handleSendMessage 새 메시지 배열:", newMessages);
          return newMessages;
        });

        // 첫 번째 메시지인 경우 즉시 제목 설정
        if (messages.length === 0) {
          console.log("첫 번째 메시지 - 즉시 제목 설정");
          const title =
            content.length > 20 ? content.substring(0, 20) + "..." : content;

          // 현재 세션 정보 업데이트
          setCurrentSession((prev) =>
            prev
              ? {
                  ...prev,
                  title: title,
                }
              : null
          );

          // 사이드바 새로고침
          setRefreshSessions((prev) => prev + 1);
        }
      }

      let accumulatedContent = "";
      let finalModelUsed = "";
      let finalRoutingScores: Record<string, unknown> | null = null;

      await sendMessage(sessionId, content, (chunk: StreamingChunk) => {
        if (chunk.content) {
          accumulatedContent += chunk.content;
          setStreamingMessage(accumulatedContent);
          setIsWaitingForFirstChunk(false); // 첫 번째 청크를 받았으므로 대기 상태 해제
        }
        if (chunk.model_used) {
          finalModelUsed = chunk.model_used;
          setModelUsed(chunk.model_used);
        }
        if (chunk.routing_scores) {
          finalRoutingScores = chunk.routing_scores;
          setRoutingScores(chunk.routing_scores);
        }

        if (chunk.is_finished) {
          const assistantMessage: ChatMessageType = {
            id: Date.now() + 1,
            session_id: sessionId,
            role: "assistant",
            content: accumulatedContent,
            model_used: finalModelUsed || undefined,
            routing_scores: finalRoutingScores || undefined,
            created_at: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingMessage("");
          setModelUsed("");
          setRoutingScores(null);
          setIsWaitingForFirstChunk(false);

          // 첫 번째 메시지인 경우 서버에서 생성된 제목으로 업데이트
          if (messages.length === 0) {
            setTimeout(async () => {
              try {
                const updatedSession = await getChatSession(sessionId);
                setCurrentSession(updatedSession);
                setRefreshSessions((prev) => prev + 1);
              } catch (error) {
                console.error("세션 정보 업데이트 오류:", error);
              }
            }, 100);
          }
        }
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-[#232323]">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
        onNewChat={handleNewChat}
        currentSessionId={sessionId}
        refreshSessions={refreshSessions}
      />

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-white font-semibold truncate">
            {currentSession?.title || "새 채팅"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-400 space-y-4 message-scrollbar">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />

          {isLoading && isWaitingForFirstChunk && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[90%] text-gray-100 rounded-2xl px-4 py-3">
                <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-gray-400">
                      메시지를 생성하는 중...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {streamingMessage && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[90%] text-gray-100 rounded-2xl px-4 py-3">
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
                      li: ({ children }) => (
                        <li className="mb-1">{children}</li>
                      ),
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
                        <strong className="font-bold text-white">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-gray-200">{children}</em>
                      ),
                    }}
                  >
                    {streamingMessage}
                  </ReactMarkdown>
                  <span className="animate-pulse">▋</span>
                </div>

                {/* 모델 정보와 라우팅 점수 표시 */}
                {(modelUsed || routingScores) && (
                  <div className="mt-3 pt-3 border-t border-[#333]">
                    {modelUsed && (
                      <div className="flex items-center text-xs text-gray-400 mb-2">
                        <span className="mr-2">선택된 모델:</span>
                        <span className="text-blue-400 font-medium">
                          {modelUsed}
                        </span>
                      </div>
                    )}
                    {routingScores && (
                      <StreamingRoutingScores scores={routingScores} />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-400 pb-4">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
