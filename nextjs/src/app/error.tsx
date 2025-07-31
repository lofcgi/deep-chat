"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen bg-[#232323] items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-500 mb-4">
          오류가 발생했습니다
        </h2>
        <p className="text-gray-400 mb-6">
          {error.message ||
            "예상치 못한 오류가 발생했습니다. 다시 시도해주세요."}
        </p>
        <button
          onClick={reset}
          className="bg-[#a96b4a] hover:bg-[#c97b4a] text-white px-6 py-3 rounded-lg transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
