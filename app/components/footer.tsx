import { Sparkles } from "lucide-react"
import {NavLink} from "react-router";

export default function FooterNav() {
    return (
        <div className="border-t border-white/20 relative z-10">
            <div
                className="
          mx-auto max-w-3xl px-6 py-4
          flex flex-col gap-3
          sm:flex-row sm:items-center sm:justify-between
        "
            >
                {/* LEFT */}
                <p className="text-sm text-white/60">
                    © {new Date().getFullYear()} Insightful Stays. All rights reserved.
                </p>

                {/* RIGHT — PAYMENTS */}
                <div className="flex items-center gap-2 opacity-70">
                    <img
                        src="/visa.svg"
                        alt="Visa"
                        title="Visa"
                        className="h-6 transition-opacity hover:opacity-100"
                    />
                    <img
                        src="/master.svg"
                        alt="Mastercard"
                        title="Mastercard"
                        className="h-6 transition-opacity hover:opacity-100"
                    />
                    <img
                        src="/maestro.svg"
                        alt="Maestro"
                        title="Maestro"
                        className="h-4 transition-opacity hover:opacity-100"
                    />
                    <img
                        src="/dina.svg"
                        alt="DinaCard"
                        title="DinaCard"
                        className="h-6 transition-opacity hover:opacity-100"
                    />
                    <img
                        src="/american.svg"
                        alt="American Express"
                        title="American Express"
                        className="h-10 transition-opacity hover:opacity-100"
                    />
                </div>

            </div>
        </div>
    )
}

