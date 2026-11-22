"use client";
import { useState } from "react";
import { sendMessage } from "@/lib/store";
import type { Member } from "@/lib/seed";
import { Modal, toast } from "./ui";

const TEMPLATES: { label: string; text: (first: string) => string }[] = [
  {
    label: "Missed sessions",
    text: (n) =>
      `Hi ${n}, I noticed you have missed your last few sessions. Is anything getting in the way? Even a 30-minute session this week keeps the habit going.`,
  },
  {
    label: "Great week",
    text: (n) => `Hi ${n}, strong week. You hit every planned session. Keep the same schedule next week and add one rep to your main lifts.`,
  },
  {
    label: "New plan ready",
    text: (n) =>
      `Hi ${n}, your new training plan is ready in the app. Open the Plan tab, check the first session and message me if any exercise is unclear.`,
  },
  {
    label: "Nutrition check-in",
    text: (n) =>
      `Hi ${n}, quick nutrition check-in. How are you finding your meal plan? Tell me what you are skipping and I will swap it for something you will actually eat.`,
  },
];

export default function MessageDialog({
  member,
  fromName,
  fromRole,
  onClose,
}: {
  member: Member;
  fromName: string;
  fromRole: "trainer" | "owner";
  onClose: () => void;
}) {
  const first = member.name.split(" ")[0];
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function send() {
    const text = body.trim();
    if (!text) {
      setErr("Write a message before sending.");
      return;
    }
    sendMessage({ memberId: member.id, fromName, fromRole, body: text });
    toast(`Sent to ${first}. They will see it the next time they open the app.`);
    onClose();
  }

  return (
    <Modal title={`Message ${first}`} kicker={`From ${fromName}`} onClose={onClose} maxWidth={560}>
      <div className="kicker mb-2">Quick fill</div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.label}
            type="button"
            className="chip"
            onClick={() => {
              setBody(t.text(first));
              setErr(null);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <label className="field-label" htmlFor="msg-body">
        Message
      </label>
      <textarea
        id="msg-body"
        className="input"
        rows={5}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          if (err) setErr(null);
        }}
        placeholder={`Write to ${first}`}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? "msg-err" : undefined}
      />
      {err && (
        <p id="msg-err" className="mt-2 text-[13px] font-semibold text-red" role="alert">
          {err}
        </p>
      )}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={send}>
          Send message
        </button>
      </div>
    </Modal>
  );
}
