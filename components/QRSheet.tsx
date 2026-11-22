"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { checkIn } from "@/lib/store";
import { Modal, toast } from "./ui";

export default function QRSheet({ memberId, onClose }: { memberId: string; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const link = `${window.location.origin}/scan?as=${memberId}`;
    setUrl(link);
    let alive = true;
    QRCode.toDataURL(link, { margin: 2, width: 280 })
      .then((data) => alive && setSrc(data))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [memberId]);

  function simulate() {
    checkIn(memberId);
    onClose();
    toast("Scanned at the door. You are checked in.");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied.");
    } catch {
      toast(`Copy was blocked. Select the link shown under the code: ${url}`);
    }
  }

  return (
    <Modal title="Door check-in code" kicker="Scan to check in" onClose={onClose} maxWidth={440}>
      <div className="mx-auto grid h-[280px] w-[280px] max-w-full place-items-center border-2 border-ink bg-white">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} width={280} height={280} alt="QR code that checks this member in" />
        ) : failed ? (
          <span className="muted px-4 text-center text-[14px]">The code could not be drawn. Use the link below.</span>
        ) : (
          <span className="kicker">Drawing code</span>
        )}
      </div>
      <p className="muted mt-4 text-center text-[14px]">
        Scanning opens the check-in page on the phone that scanned it. Trainer and owner screens on another device only update once a shared data store is connected. On this device, use Simulate door scan.
      </p>
      <p className="mono mt-2 select-all break-all text-center text-[12px] text-ink-3">{url}</p>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        <button className="btn btn-primary" onClick={simulate}>
          Simulate door scan
        </button>
        <button className="btn" onClick={copy}>
          Copy link
        </button>
      </div>
    </Modal>
  );
}
