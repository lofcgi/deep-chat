"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  Squares2X2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { getChatSessions, ChatSession, deleteChatSession } from "../lib/api";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  currentSessionId?: number;
  refreshSessions?: number;
}

export function Sidebar({
  isOpen,
  onToggle,
  onNewChat,
  currentSessionId,
  refreshSessions,
}: SidebarProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredSession, setHoveredSession] = useState<number | null>(null);

  // 세션 목록 로드
  useEffect(() => {
    const loadSessions = async () => {
      try {
        console.log("사이드바 세션 목록 로드 시작");
        const sessionList = await getChatSessions();
        console.log("사이드바 세션 목록 로드 성공:", sessionList);
        setSessions(sessionList);
      } catch (error) {
        console.error("Failed to load sessions:", error);
        // 에러가 발생해도 빈 배열로 설정
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  // 새 채팅 생성 시에만 세션 목록 새로고침
  useEffect(() => {
    if (refreshSessions && refreshSessions > 0) {
      const loadSessions = async () => {
        try {
          console.log("사이드바 세션 목록 새로고침 시작");
          const sessionList = await getChatSessions();
          console.log("사이드바 세션 목록 새로고침 성공:", sessionList);
          setSessions(sessionList);
        } catch (error) {
          console.error("Failed to load sessions:", error);
          // 에러가 발생해도 빈 배열로 설정
          setSessions([]);
        }
      };
      loadSessions();
    }
  }, [refreshSessions]);

  const handleSessionClick = (sessionId: number) => {
    // 현재 세션과 같은 세션을 클릭한 경우 새로고침하지 않음
    if (sessionId === currentSessionId) {
      return;
    }

    // 다른 세션으로 이동할 때는 새로고침하지 않고 라우팅만 변경
    router.push(`/session/${sessionId}`, { scroll: false });
  };

  const handleDeleteSession = async (
    sessionId: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지

    if (confirm("이 세션을 삭제하시겠습니까?")) {
      try {
        await deleteChatSession(sessionId);

        // 삭제된 세션을 목록에서 제거
        setSessions((prev) =>
          prev.filter((session) => session.id !== sessionId)
        );

        // 현재 세션이 삭제된 세션이라면 메인 페이지로 이동
        if (sessionId === currentSessionId) {
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to delete session:", error);
        alert("세션 삭제에 실패했습니다.");
      }
    }
  };

  return (
    <div
      className={`h-screen bg-[#0a0a0a] border-r border-[#333] transition-all duration-300 ease-in-out flex flex-col overflow-hidden z-10 ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-[#333] flex-shrink-0">
        {isOpen && (
          <div className="flex items-center space-x-2">
            <span className="text-white font-semibold">Deep Chat</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-[#333] transition-colors"
        >
          {isOpen ? (
            <ChevronLeftIcon className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* 네비게이션 */}
      <div className="p-4 space-y-2 flex-shrink-0">
        {/* 새 채팅 버튼 */}
        <button
          onClick={onNewChat}
          className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
            isOpen
              ? "bg-[#a96b4a] hover:bg-[#c97b4a] text-white"
              : "bg-[#a96b4a] hover:bg-[#c97b4a] text-white justify-center"
          }`}
        >
          <PlusIcon className="w-5 h-5" />
          {isOpen && <span className="font-medium">새 채팅</span>}
        </button>
      </div>

      {/* 최근 항목 */}
      {isOpen && (
        <div className="px-4 flex-1 flex flex-col min-h-0">
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex-shrink-0">
            최근 항목
          </h3>
          <div className="space-y-1 flex-1 overflow-y-auto scrollbar-hover custom-scrollbar">
            {loading ? (
              <div className="text-gray-400 text-sm p-2">로딩 중...</div>
            ) : sessions.length === 0 ? (
              <div className="text-gray-400 text-sm p-2">
                채팅 세션이 없습니다
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`w-full text-left p-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    session.id === currentSessionId
                      ? "bg-[#333] text-white"
                      : "text-gray-300 hover:bg-[#333]"
                  }`}
                  onMouseEnter={() => setHoveredSession(session.id)}
                  onMouseLeave={() => setHoveredSession(null)}
                >
                  <button
                    onClick={() => handleSessionClick(session.id)}
                    className="flex-1 text-left truncate"
                  >
                    {session.title || `세션 ${session.id}`}
                  </button>
                  {hoveredSession === session.id && (
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="ml-2 text-red-500 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
