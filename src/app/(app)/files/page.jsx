import { FileText, FolderOpen, Upload } from "lucide-react";
import { db } from "@/server/store";
import { leanAll, userMap } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { UploadRequestAction } from "@/components/actions";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  const session = await getSession();
  const models = await db();
  const [files, requests] = await Promise.all([leanAll(await models.FileAsset.find({})), leanAll(await models.UploadRequest.find({}))]);
  const categories = [...new Set(files.map((f) => f.category))];

  return (
    <div>
      <PageHeader title="Files & assets" description="Brand packs, copy, contracts and deliverables — versioned and shared with the client." />

      {requests.length > 0 && (
        <section className="rise-in mb-6 rounded-xl border bg-card shadow-sm">
          <header className="flex items-center gap-2 border-b px-5 py-4">
            <Upload className="h-4 w-4 text-sky-600" />
            <h2 className="font-semibold">Requested uploads</h2>
          </header>
          <ul className="divide-y">
            {requests.map((r) => (
              <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">requested {fmtDate(r.requestedOn)}{r.blocks ? ` · blocks: ${r.blocks}` : ""}</p>
                </div>
                <UploadRequestAction request={r} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {categories.map((cat, ci) => (
          <section key={cat} className={`rise-in rise-in-${Math.min(ci + 1, 4)} rounded-xl border bg-card shadow-sm`}>
            <header className="flex items-center gap-2 border-b px-5 py-3.5">
              <FolderOpen className="h-4 w-4 text-indigo-500" />
              <h2 className="text-sm font-semibold">{cat}</h2>
              <Badge variant="outline" className="ml-auto text-[10px]">{files.filter((f) => f.category === cat).length}</Badge>
            </header>
            <ul className="divide-y">
              {files.filter((f) => f.category === cat).map((f) => (
                <li key={f._id} className="flex items-center gap-3 px-5 py-3">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.size} · v{f.version} · {fmtDate(f.updated)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
