import { Sparkles, Chrome } from "lucide-react"
import { NavLink } from "react-router"


export default function HeaderNav() {
    return (
        <div className="mb-10 flex flex-col text-sm text-white/80 md:flex-row md:items-center md:gap-6">

            {/* BRAND */}
            <div className="inline-flex items-center gap-2 md:w-1/2">
                <Sparkles className="h-4 w-4" />
                <span className="text-xl font-semibold tracking-tight">
                    <NavLink to="/">Insightful Stays</NavLink>
                </span>

            </div>

            {/* MOBILE DIVIDER */}
            <div className="my-3 h-px w-full bg-white/20 md:hidden" />

            {/* NAV + LANG */}
            <div className="flex w-full justify-between md:w-auto md:gap-6 md:items-center">

                {/* NAV */}
                <nav className="flex gap-6 items-center">
                    <NavLink
                        to="/travelers"
                        className={({ isActive }) =>
                            `hover:text-white ${
                                isActive ? "text-white font-semibold" : "text-white/80"
                            }`
                        }
                    >
                        Travelers
                    </NavLink>

                    {/*<NavLink*/}
                    {/*    to="/prices"*/}
                    {/*    className={({ isActive }) =>*/}
                    {/*        `hover:text-white ${*/}
                    {/*            isActive ? "text-white font-semibold" : "text-white/80"*/}
                    {/*        }`*/}
                    {/*    }*/}
                    {/*>*/}
                    {/*    Pricing*/}
                    {/*</NavLink>*/}

                    <NavLink
                        to="/contact"
                        className={({ isActive }) =>
                            `hover:text-white ${
                                isActive ? "text-white font-semibold" : "text-white/80"
                            }`
                        }
                    >
                        Contact
                    </NavLink>

                    {/*<NavLink*/}
                    {/*    to="/developers"*/}
                    {/*    className={({ isActive }) =>*/}
                    {/*        `hover:text-white ${*/}
                    {/*            isActive ? "text-white font-semibold" : "text-white/80"*/}
                    {/*        }`*/}
                    {/*    }*/}
                    {/*>*/}
                    {/*    Developers*/}
                    {/*</NavLink>*/}
                    <NavLink
                        to="/privacy"
                        className={({ isActive }) =>
                            `hover:text-white ${
                                isActive ? "text-white font-semibold" : "text-white/80"
                            }`
                        }
                    >
                        Privacy
                    </NavLink>
                    <NavLink
                        to="https://chromewebstore.google.com/detail/guest-review-insights-for/jkfmlkedfhejopfgkfjabbahicadpdof"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
        ml-auto md:inline-flex
items-center gap-2
rounded-lg
bg-gradient-to-br from-sky-400/20 via-cyan-400/20 to-emerald-400/20
border border-white/30
px-4 py-2
text-xs font-semibold text-white
backdrop-blur-md
shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_8px_30px_rgba(56,189,248,0.15)]
transition-all
hover:from-sky-400/30 hover:via-cyan-400/30 hover:to-emerald-400/30
hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_40px_rgba(56,189,248,0.35)]

    "
                    >
                        <Chrome className="h-4 w-4 text-emerald-300" />
                        <span>Chrome extension</span>
                    </NavLink>
                </nav>

                {/* LANGUAGE SWITCHER */}


            </div>

            {/* MOBILE DIVIDER */}
            <div className="mt-3 h-px w-full bg-white/20 md:hidden" />
        </div>
    )
}
