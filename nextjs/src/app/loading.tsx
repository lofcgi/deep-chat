export default function Loading() {
  return (
    <div className="flex h-screen bg-[#232323] items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#e2b97f] mx-auto mb-4"></div>
        <p className="text-gray-400 text-lg">로딩 중...</p>
      </div>
    </div>
  );
}
