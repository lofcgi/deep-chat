import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen bg-[#232323] items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-[#e2b97f] text-6xl mb-4">404</div>
        <h2 className="text-2xl font-bold text-white mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-gray-400 mb-6">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <Link
          href="/"
          className="bg-[#a96b4a] hover:bg-[#c97b4a] text-white px-6 py-3 rounded-lg transition-colors inline-block"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
