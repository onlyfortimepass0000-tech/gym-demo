import ClientDetail from "@/components/ClientDetail";

export default function ClientPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string };
}) {
  return <ClientDetail id={params.id} from={searchParams.from === "owner" ? "owner" : "trainer"} />;
}
