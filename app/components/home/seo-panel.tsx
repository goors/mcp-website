import { useState } from "react"

export default function SeoPanel() {
    const [expanded, setExpanded] = useState(false)

    return (
        <div
            className="
        relative w-full max-w-[720px] mx-auto
      "
        >
            <div
                className={`
          transition-all duration-300 ease-out
        `}
            >
                {/* GRAB HANDLE (mobile visual) */}
                <div className="flex justify-center pt-3 md:hidden">
                    <div className="h-1.5 w-12 rounded-full bg-white/40" />
                </div>


                {/* CONTENT */}
                <div className="pb-6 space-y-6 overflow-y-auto pt-10">
                    <h2 className="text-xl font-semibold">
                        Smarter Airbnb/Booking review insights for travelers
                    </h2>

                    <p className="text-sm text-white/85">
                        Insightful Stays helps travelers make sense of Airbnb/Booking and short-term rental
                        reviews by automatically grouping guest feedback into clear topics like
                        Wi-Fi, noise, cleanliness, location, and communication.
                        Instead of reading dozens of individual comments, travelers can quickly see
                        what guests tend to talk about and where mixed or negative feedback appears.
                    </p>

                    <p className="text-sm text-white/85">
                        Insights are generated automatically from publicly available reviews and are
                        intended as a reading aid, not a score or guarantee. Some nuance or context
                        may be missed.
                    </p>


                    <p className="text-sm text-white/70">
                        Insightful Stays does not modify listings, ratings, or reviews.
                        It offers an independent, automated lens on existing guest feedback.
                    </p>
                </div>
            </div>
        </div>
    )
}
