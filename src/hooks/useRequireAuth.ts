"use client";

import {useEffect, useState} from "react";
import {onAuthStateChanged, User} from "firebase/auth";
import {auth} from "@/lib/firebase";
import {usePathname, useRouter, useSearchParams} from "next/navigation";

export function useRequireAuth({redirectToLogin = true} = {}) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user === undefined) return; // hala yükleniyor
    if (user) return; // oturum var

    if (redirectToLogin) {
      const current = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
      const next = `/login?redirect=${encodeURIComponent(current)}`;
      router.replace(next);
    }
  }, [user, redirectToLogin, router, pathname, searchParams]);

  return {user, loading: user === undefined};
}
