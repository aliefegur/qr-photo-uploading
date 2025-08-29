"use client";

import {FormEvent, useEffect, useState} from "react";
import {onAuthStateChanged, signInWithEmailAndPassword} from "firebase/auth";
import {auth} from "@/lib/firebase";
import {useRouter, useSearchParams} from "next/navigation";
import {FirebaseError} from "@firebase/app";

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params?.get("redirect") || "/gallery";

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zaten girişliyse redirect
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace(redirect);
    });
    return () => unsub();
  }, [router, redirect]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      router.replace(redirect);
    } catch (err: unknown) {
      let msg = "Giriş yapılamadı. Lütfen tekrar deneyin.";

      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-credential":
          case "auth/wrong-password":
            msg = "E-posta veya şifre hatalı.";
            break;
          case "auth/user-not-found":
            msg = "Kullanıcı bulunamadı.";
            break;
          case "auth/too-many-requests":
            msg = "Çok fazla deneme. Bir süre sonra tekrar deneyin.";
            break;
          default:
            // İstersen err.message gösterme; genel mesaj daha güvenli
            msg = "Giriş yapılamadı. Lütfen tekrar deneyin.";
        }
      } else {
        // unknown türündeki diğer hatalar
        msg = "Beklenmeyen bir hata oluştu.";
      }

      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4"
      >
        <h1 className="text-lg font-semibold">Oturum Aç</h1>

        <div className="flex flex-col gap-1 space-y-1">
          <label htmlFor="email" className="text-sm text-slate-600">E-posta</label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-col gap-1 space-y-1">
          <label htmlFor="pw" className="text-sm text-slate-600">Şifre</label>
          <input
            id="pw"
            type="password"
            required
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 text-white py-2 font-medium disabled:opacity-60"
        >
          {submitting ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>

        <p className="text-xs text-slate-500">
          Hesap oluşturma kapalıdır. Lütfen yöneticiden kullanıcı oluşturmasını isteyin.
        </p>
      </form>
    </main>
  );
}
