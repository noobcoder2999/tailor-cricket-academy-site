"use client";
import { useEffect, useState } from "react";
import { programs } from "../content/academy";
import EnquiryForm from "./EnquiryForm";
import { Dialog, type EnquirySelection } from "./ui";

export default function EnquiryDialog({ mode }: { mode: string }) {
  const [selection, setSelection] = useState<EnquirySelection | null>(null);
  useEffect(() => {
    const open = (event: Event) => setSelection((event as CustomEvent<EnquirySelection>).detail);
    window.addEventListener("academy-enquiry", open);
    return () => window.removeEventListener("academy-enquiry", open);
  }, []);
  if (!selection) return null;
  const program = programs.find(item => item.id === selection.programId);
  return <Dialog title={selection.kind === "contact" ? "Ask the academy" : "Start your innings"} wide onClose={() => setSelection(null)}>
    {program && <><p className="eyebrow">{program.title}</p><p>{program.description}</p></>}
    <p>This is a public preview, not a booking service. Closing this window returns you to the same place on the page.</p>
    <EnquiryForm key={`${selection.kind}:${selection.programId}:${selection.tournamentId}`} kind={selection.kind} mode={mode}
      initialProgramId={selection.programId} initialTournamentId={selection.tournamentId} idPrefix="overlay" />
  </Dialog>;
}
