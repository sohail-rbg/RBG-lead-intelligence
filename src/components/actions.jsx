"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Eye, Loader2, Play, RotateCcw, Send, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

async function mutate(url, { method = "POST", body } = {}) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/** Shared mutate hook: runs the request then revalidates the server-rendered page. */
function useMutate() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

export function MutateError({ error }) {
  if (!error) return null;
  return <p className="mt-1.5 flex items-center gap-1 text-[11px] text-rose-600"><AlertTriangle className="h-3 w-3" /> {error}</p>;
}

/* ---------------- Tasks ---------------- */

export function TaskActions({ task }) {
  const { busy, error, run } = useMutate();
  const patch = (body) => () => run(() => mutate(`/api/tasks/${task._id}`, { method: "PATCH", body }));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {task.status === "todo" && (
        <Button size="xs" variant="outline" disabled={busy} onClick={patch({ status: "in-progress" })}>
          <Play className="h-3 w-3" /> Start
        </Button>
      )}
      {(task.status === "todo" || task.status === "in-progress") && (
        <Button size="xs" disabled={busy} onClick={patch({ done: true })}>
          <Check className="h-3 w-3" /> Done
        </Button>
      )}
      {task.status === "in-progress" && (
        <Button size="xs" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" disabled={busy} onClick={patch({ status: "blocked" })}>
          <Square className="h-3 w-3" /> Block
        </Button>
      )}
      {task.status === "blocked" && (
        <Button size="xs" variant="outline" disabled={busy} onClick={patch({ status: "in-progress" })}>
          <Play className="h-3 w-3" /> Unblock
        </Button>
      )}
      {task.status === "done" && (
        <Button size="xs" variant="outline" disabled={busy} onClick={patch({ done: false })}>
          <RotateCcw className="h-3 w-3" /> Reopen
        </Button>
      )}
      <MutateError error={error} />
    </div>
  );
}

/* ---------------- QC checks ---------------- */

export function QcCheckButtons({ pageId, check }) {
  const { busy, error, run } = useMutate();
  const set = (status) => () => run(() => mutate("/api/qc/check", { body: { pageId, checkId: check._id, status } }));

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        title="Pass"
        disabled={busy}
        onClick={set("pass")}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md border transition-colors",
          check.status === "pass" ? "border-emerald-300 bg-emerald-500 text-white" : "border-input bg-background text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600"
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Fail"
        disabled={busy}
        onClick={set("fail")}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md border transition-colors",
          check.status === "fail" ? "border-rose-300 bg-rose-500 text-white" : "border-input bg-background text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
        )}
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Reset to pending"
        disabled={busy}
        onClick={set("pending")}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md border transition-colors",
          check.status === "pending" ? "border-zinc-300 bg-zinc-400 text-white" : "border-input bg-background text-muted-foreground hover:bg-zinc-100"
        )}
      >
        <RotateCcw className="h-3 w-3" />
      </button>
      {busy && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      <MutateError error={error} />
    </div>
  );
}

/* ---------------- Page approval (client) ---------------- */

const FEEDBACK_CATEGORIES = ["Design", "Content", "Functionality", "Other"];

export function ApprovalActions({ page }) {
  const { busy, error, run } = useMutate();
  const [mode, setMode] = useState(null); // null | "changes"
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState(FEEDBACK_CATEGORIES[0]);

  const approve = () => run(() => mutate(`/api/pages/${page._id}/approve`));
  const requestChanges = () =>
    run(async () => {
      await mutate(`/api/pages/${page._id}/request-changes`, { body: { reason, category } });
      setMode(null);
      setReason("");
    });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={busy} onClick={approve}>
          <Check className="h-4 w-4" /> Approve v{page.version}
        </Button>
        <Button size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" disabled={busy} onClick={() => setMode(mode ? null : "changes")}>
          <X className="h-4 w-4" /> Request changes
        </Button>
      </div>
      <MutateError error={error} />

      {mode === "changes" && (
        <div className="rise-in mt-3 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
          <p className="text-sm font-medium text-rose-800">What needs to change on {page.name} v{page.version}?</p>
          <Textarea
            className="mt-2 bg-white"
            rows={3}
            placeholder="Explain the change in detail (min 10 characters). It becomes a task for the page owner."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-8 rounded-lg border border-input bg-white px-2 text-xs"
            >
              {FEEDBACK_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700" disabled={busy || reason.trim().length < 10} onClick={requestChanges}>
              <Send className="h-3.5 w-3.5" /> Send feedback
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Send page to client (internal) ---------------- */

export function SendToClient({ page }) {
  const { busy, error, run } = useMutate();
  return (
    <div>
      <Button size="xs" variant="outline" disabled={busy} onClick={() => run(() => mutate(`/api/pages/${page._id}/send`))}>
        <Send className="h-3 w-3" /> Send to client
      </Button>
      <MutateError error={error} />
    </div>
  );
}

/* ---------------- Questions ---------------- */

export function AnswerQuestion({ question }) {
  const { busy, error, run } = useMutate();
  const [answer, setAnswer] = useState("");
  return (
    <div>
      <Textarea rows={2} placeholder="Type your answer…" value={answer} onChange={(e) => setAnswer(e.target.value)} />
      <div className="mt-2 flex items-center justify-end gap-2">
        <MutateError error={error} />
        <Button size="sm" disabled={busy || !answer.trim()} onClick={() => run(() => mutate(`/api/questions/${question._id}/answer`, { body: { answer } }))}>
          Send answer
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Onboarding ---------------- */

export function OnboardingToggle({ stepId, item }) {
  const { busy, run } = useMutate();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => run(() => mutate("/api/onboarding/toggle", { body: { stepId, itemId: item._id } }))}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary/60"
    >
      <span
        className={cn(
          "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors",
          item.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-input bg-background"
        )}
      >
        {item.done && <Check className="h-3 w-3" />}
      </span>
      <span className={cn(item.done && "text-muted-foreground line-through decoration-zinc-300")}>{item.label}</span>
    </button>
  );
}

/* ---------------- Vault ---------------- */

export function VaultReveal({ credentialId, label = "Reveal" }) {
  const { busy, error, run } = useMutate();
  const [secret, setSecret] = useState(null);
  return (
    <div>
      {secret ? (
        <code className="rounded bg-zinc-900 px-2 py-1 text-xs text-emerald-300">{secret}</code>
      ) : (
        <Button
          size="xs"
          variant="outline"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const data = await mutate(`/api/vault/${credentialId}/reveal`, { body: {} });
              setSecret(data.password || data.secret || "•••");
            })
          }
        >
          <Eye className="h-3 w-3" /> {label}
        </Button>
      )}
      <MutateError error={error} />
    </div>
  );
}

/* ---------------- Upload requests ---------------- */

export function UploadRequestAction({ request }) {
  const { busy, error, run } = useMutate();
  if (request.status === "uploaded") {
    return <span className="text-xs font-medium text-emerald-600">Uploaded ✓</span>;
  }
  return (
    <div>
      <Button size="xs" variant="outline" disabled={busy} onClick={() => run(() => mutate(`/api/files/requests/${request._id}`, { method: "PATCH", body: { status: "uploaded" } }))}>
        <Check className="h-3 w-3" /> Mark uploaded
      </Button>
      <MutateError error={error} />
    </div>
  );
}
