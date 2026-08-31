import { useEffect, useState } from "react";
import { getDiscordUsername } from "../desktop";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatWatermarkTimestamp(date: Date): string {
  return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}/${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

export function PreReleaseWatermark() {
  const [username, setUsername] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      void getDiscordUsername().then((value) => {
        if (!cancelled) {
          setUsername(value);
        }
      });
    };

    refresh();
    // Discord may connect after launch; keep the name in sync.
    const id = window.setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const timestamp = formatWatermarkTimestamp(now);

  return (
    <div aria-hidden="true" className="pre-release-watermark">
      <div className="pre-release-watermark-title">PRE-RELEASE BUILD</div>
      <div className="pre-release-watermark-meta">
        {username ? `${username} @ ${timestamp}` : timestamp}
      </div>
    </div>
  );
}
