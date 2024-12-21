import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-lg">La página que buscas no fue encontrada.</p>
      <Link href="/" className="mt-4 underline hover:text-accent">
        Volver al inicio
      </Link>
    </div>
  );
}
