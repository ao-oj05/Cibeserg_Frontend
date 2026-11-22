import { ScanDetailPage } from "@/components/scan-detail-page";

export const instant = false;

interface ScanDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function ScanDetailRoute({
  params,
}: ScanDetailRouteProps) {
  const { id } = await params;
  return <ScanDetailPage scanId={id} />;
}
