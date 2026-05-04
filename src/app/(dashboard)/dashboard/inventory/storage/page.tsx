import { PageHeader } from "@/components/layout/page-header"
import { StoragePageClient } from "@/components/storage/storage-page-client"
import { listBuildings, listRooms } from "@/lib/actions/storage"

export default async function StoragePage() {
  const [buildings, rooms] = await Promise.all([listBuildings(), listRooms()])

  return (
    <>
      <PageHeader
        title="คลังจัดเก็บ 3D"
        description="จัดการเชลฟ์ ตู้ ช่องเก็บ พร้อมมุมมอง 3D — ค้นหารหัสอะไหล่เพื่อดูตำแหน่งทันที"
        breadcrumb={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "คลังอะไหล่", href: "/dashboard/inventory" },
          { title: "คลังจัดเก็บ 3D" },
        ]}
      />
      <div className="px-3 pb-6 sm:px-6">
        <StoragePageClient buildings={buildings} rooms={rooms} />
      </div>
    </>
  )
}
