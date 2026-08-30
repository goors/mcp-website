import { Globe } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Button } from "~/components/ui/button"

const LANGUAGES = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "sr", label: "Srpski", flag: "🇷🇸" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
]

export default function LanguageSwitcher() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="
            text-white/80 hover:text-white
            hover:bg-white/10
            px-2
          "
                >
                    <Globe className="h-4 w-4 mr-1" />
                    EN
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="bg-[#0b0f14] border border-white/10 text-white"
            >
                {LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        className="
              flex items-center gap-2
              cursor-pointer
              text-sm
              hover:bg-white/10
            "
                        onClick={() => {
                            // TODO: wire this to i18n / route / cookie
                            console.log("Switch language to:", lang.code)
                        }}
                    >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
