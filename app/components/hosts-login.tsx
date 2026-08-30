import { useState } from "react"
import { Globe } from "lucide-react"
import { Button } from "~/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "~/components/ui/dialog"
import LanguageSwitcher from "~/components/language-switcher"

export default function HostsLogin() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <div className="flex items-center justify-end mb-8 gap-3">
                {/*<LanguageSwitcher />*/}

                <button
                    onClick={() => setOpen(true)}
                    className="
            rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-700
            shadow-[4px_4px_0_rgba(0,0,0,0.25)]
            transition hover:-translate-y-0.5
            hover:shadow-[6px_6px_0_rgba(0,0,0,0.25)]
          "
                >
                    Login for hosts
                </button>
            </div>

            {/* COMING SOON DIALOG */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Host dashboard — coming soon</DialogTitle>
                        <DialogDescription className="mt-2 text-sm text-muted-foreground">
                            The host dashboard is currently in development.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                        <p>
                            The dashboard will let hosts:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Analyze all Airbnb reviews for their listings</li>
                            <li>See recurring issues across guests</li>
                            <li>Track changes as new reviews appear</li>
                            <li>Prioritize what to improve next</li>
                        </ul>

                        <p className="pt-2">
                            For now, hosts can use the Chrome extension to unlock
                            <strong> “What to improve next”</strong> directly on Airbnb listings.
                        </p>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button onClick={() => setOpen(false)}>
                            Got it
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
