import { Modal } from "@/components/ui/Modal.tsx";
import { t } from "@/components/ui/theme.ts";
import type { UserRow } from "@/features/users/_logic/types.ts";
import { UserIdentity } from "@/features/users/_components/parts.tsx";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{label}</p>
        <div className="mt-0.5 text-sm text-zinc-100">{children}</div>
      </div>
    </div>
  );
}

export function UserDetailModal({ row, onClose }: { row: UserRow; onClose: () => void }) {
  const u = row.user;
  return (
    <Modal title="Detail pengguna" onClose={onClose}>
      <UserIdentity row={row} />
      <p className="mt-1 pl-12 text-sm text-zinc-500">ID {u.id}</p>
      <dl className="mt-4 space-y-4">
        <Row label="Email"><a href={`mailto:${u.email}`} className={t.link}>{u.email}</a></Row>
        <Row label="Telepon"><a href={`tel:${u.phone}`} className={t.link}>{u.phone}</a></Row>
        <Row label="Situs web"><a href={row.siteHref} target="_blank" rel="noreferrer" className={t.link}>{u.website}</a></Row>
        <Row label="Alamat">
          <address className="not-italic">
            {u.address.street}, {u.address.suite}<br />
            {u.address.city} {u.address.zipcode}<br />
            <a href={row.mapsHref} target="_blank" rel="noreferrer" className={t.link}>
              Lihat di peta ({u.address.geo.lat}, {u.address.geo.lng})
            </a>
          </address>
        </Row>
        <Row label="Perusahaan">
          <p className="font-medium">{u.company.name}</p>
          <p className="text-zinc-400 italic">“{u.company.catchPhrase}”</p>
          <p className="text-zinc-400">{u.company.bs}</p>
        </Row>
      </dl>
    </Modal>
  );
}
