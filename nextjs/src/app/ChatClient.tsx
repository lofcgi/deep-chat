"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatInput } from "../components/ChatInput";
import { Sidebar } from "../components/Sidebar";
import { createChatSession } from "@/lib/api";

export function ChatClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshSessions, setRefreshSessions] = useState(0);

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

  const handleSendMessage = async (content: string) => {
    console.log("=== handleSendMessage 시작 ===");
    console.log("content:", content);

    try {
      setIsLoading(true);

      // 새 세션 생성
      console.log("새 세션 생성 중...");
      const newSession = await createChatSession();
      console.log("생성된 세션:", newSession);

      // 새 세션 페이지로 이동하면서 초기 메시지 전달
      router.push(
        `/session/${newSession.id}?message=${encodeURIComponent(content)}`
      );

      // 사이드바 새로고침
      setRefreshSessions((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to create session:", error);
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
        refreshSessions={refreshSessions}
      />

      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#e2b97f] flex items-center justify-center mb-2">
              무엇을 도와드릴까요?
            </h1>
          </div>
          <div className="w-[600px]">
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
