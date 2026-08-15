import { notFound } from "next/navigation";
import PersonalOS from "../components/PersonalOS";

const sections = ["projects", "tasks", "calendar", "career", "work", "notes", "archive", "settings"] as const;
type Section = (typeof sections)[number];

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as Section)) notFound();
  return <PersonalOS initialSection={section as Section} />;
}

