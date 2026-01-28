// Force dynamic rendering for all auth pages to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
