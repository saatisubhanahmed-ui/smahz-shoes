import { whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "../Icons";

export default function WhatsAppFloat() {
  return (
    <a
      className="wa-float"
      href={whatsappLink("Assalam o Alaikum! I have a question about SMAHZ shoes.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      <span className="wa-tip">Chat with us</span>
      <WhatsAppIcon size={30} />
    </a>
  );
}
