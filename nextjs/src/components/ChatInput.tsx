"use client";

import { useState, useRef, useEffect } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // textarea 높이 자동 조절
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // 메시지가 변경될 때마다 높이 조절
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !disabled) {
        onSend(message);
        setMessage("");
      }
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="bg-[#2a2a2a] rounded-2xl shadow-2xl px-5 py-2 flex flex-col gap-2 border border-[#3a3a3a]/50 relative"
      >
        {/* 입력창 */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Deep Chat으로 물어보기"
          className="w-full bg-transparent outline-none text-base text-gray-100 placeholder-gray-400 resize-none min-h-[40px] leading-relaxed border-none p-0"
          disabled={disabled}
          rows={2}
          onKeyDown={handleKeyDown}
          ref={textareaRef}
        />

        {/* 모델 선택 & 전송 버튼 */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="submit"
            disabled={disabled || !message.trim()}
            className="bg-[#a96b4a] hover:bg-[#c97b4a] text-white rounded-xl px-3 py-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
