import { programs, tournaments } from "../content/academy";

export default function EnquiryForm({ initialProgramId, initialTournamentId }: {
  kind?: "trial" | "contact"; mode: string; initialProgramId?: string; initialTournamentId?: string; idPrefix?: string;
}) {
  const program = programs.find(item => item.id === initialProgramId);
  const tournament = tournaments.find(item => item.id === initialTournamentId);
  return <div className="public-enquiry-notice">
    <p className="eyebrow">READ-ONLY PUBLIC PREVIEW</p>
    <h3>Explore the academy.</h3>
    <p>Enquiries and bookings are not available on this GitHub Pages site. No personal information is requested, stored or sent.</p>
    {program && <p><strong>Program you explored:</strong> {program.title}</p>}
    {tournament && <p><strong>Sample event:</strong> {tournament.name}</p>}
    <p>Photo editing and local enquiry capture remain available only to the owner in the separate laptop application.</p>
  </div>;
}
