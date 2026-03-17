import { getAllTenants } from "@/lib/actions/super-admin"
import TenantsClient from "./tenants-client"

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const tenants = await getAllTenants(params.search)

  return <TenantsClient tenants={tenants} initialSearch={params.search || ""} />
}
