export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="text-center max-w-md">
        <h1 className="mb-3 text-4xl font-bold">404</h1>
        <p className="mb-5 text-xl text-muted-foreground">페이지를 찾을 수 없어요.</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}
