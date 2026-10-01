import ChatExperience from "@/components/ChatExperience";
import { cases } from "@/lib/records";
export default function Home() {
  return <ChatExperience cases={cases} />;
}
