"use client";

import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/supabase/types";
import { useI18n } from "@/lib/i18n";

export function Chat({
  roomCode,
  senderId,
  senderName,
}: {
  roomCode: string;
  senderId: string | null;
  senderName: string;
}) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase
      .from("messages")
      .select("*")
      .eq("room_code", roomCode)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }: { data: ChatMessage[] | null }) => {
        if (active && data) setMessages(data);
      });

    const channel = supabase
      .channel(`room:${roomCode}:messages`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_code=eq.${roomCode}` },
        (payload: { new: ChatMessage }) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase?.removeChannel(channel);
    };
  }, [roomCode]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !supabase || !senderId) return;
    setDraft("");
    await supabase.from("messages").insert({
      room_code: roomCode,
      sender_id: senderId,
      sender_name: senderName,
      body,
    });
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="card p-4 text-sm opacity-70">{t.auth.needsSupabase}</div>
    );
  }

  return (
    <div className="card flex h-72 flex-col p-3">
      <div ref={listRef} className="flex-1 space-y-1 overflow-y-auto text-sm">
        {messages.map((m) => (
          <div key={m.id}>
            <span className="font-semibold">{m.sender_name}: </span>
            <span>{m.body}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t.game.chatPlaceholder}
          className="flex-1 rounded-md border px-2 py-1 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--bg)" }}
          disabled={!senderId}
        />
        <button
          onClick={send}
          disabled={!senderId}
          className="rounded-md px-3 py-1 text-sm text-white disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          {t.game.send}
        </button>
      </div>
    </div>
  );
}
