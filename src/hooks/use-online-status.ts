import { useEffect, useState } from "react";

export interface OnlineStatus {
  online: boolean;
}

function browserIsOnline() {
  return typeof navigator === "undefined" || navigator.onLine;
}

export function useOnlineStatus(): OnlineStatus {
  const [online, setOnline] = useState(browserIsOnline);

  useEffect(() => {
    const updateStatus = () => setOnline(browserIsOnline());

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return { online };
}
