"use client";

import { useMemo, useState } from "react";
import type { Attribution } from "@/lib/attribution";
import type { BookingErrors, BookingInput } from "@/lib/booking";

export function BookingForm({ attribution }: { attribution: Attribution }) {
  const token = useMemo(() => crypto.randomUUID(), []);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(formData: FormData) {
    if (submitting) return;
    setSubmitting(true);
    setErrors({});
    setMessage(null);

    const input: BookingInput = {
      travel_date: String(formData.get("travel_date") ?? ""),
      traveler_count: Number(formData.get("traveler_count")),
      full_name: String(formData.get("full_name") ?? ""),
      country: String(formData.get("country") ?? ""),
      whatsapp: String(formData.get("whatsapp") ?? ""),
      email: String(formData.get("email") ?? ""),
      notes: String(formData.get("notes") ?? "") || null,
      submission_token: token,
      ...attribution,
    };

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.errors) setErrors(result.errors);
        setMessage(result.message ?? "Please review your booking details and try again.");
        return;
      }
      window.location.assign(result.successUrl);
    } catch {
      setMessage("Network error. Please try again or contact us for help.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={submit} className="card grid gap-5 p-6 md:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="field">
          <label htmlFor="travel_date">Travel Date *</label>
          <input id="travel_date" name="travel_date" type="date" required aria-invalid={Boolean(errors.travel_date)} aria-describedby={errors.travel_date ? "travel_date-error" : undefined} />
          {errors.travel_date && <div id="travel_date-error" className="field-error" role="alert">{errors.travel_date}</div>}
        </div>
        <div className="field">
          <label htmlFor="traveler_count">Number of Travelers *</label>
          <select id="traveler_count" name="traveler_count" defaultValue="2" required aria-invalid={Boolean(errors.traveler_count)} aria-describedby={errors.traveler_count ? "traveler_count-error" : undefined}>
            <option value="2">2 travelers</option>
            <option value="3">3 travelers</option>
            <option value="4">4 travelers</option>
          </select>
          {errors.traveler_count && <div id="traveler_count-error" className="field-error" role="alert">{errors.traveler_count}</div>}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="field">
          <label htmlFor="full_name">Full Name *</label>
          <input id="full_name" name="full_name" autoComplete="name" required aria-invalid={Boolean(errors.full_name)} aria-describedby={errors.full_name ? "full_name-error" : undefined} />
          {errors.full_name && <div id="full_name-error" className="field-error" role="alert">{errors.full_name}</div>}
        </div>
        <div className="field">
          <label htmlFor="country">Country / Region *</label>
          <input id="country" name="country" defaultValue="Malaysia" autoComplete="country-name" required aria-invalid={Boolean(errors.country)} aria-describedby={errors.country ? "country-error" : undefined} />
          {errors.country && <div id="country-error" className="field-error" role="alert">{errors.country}</div>}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="field">
          <label htmlFor="whatsapp">WhatsApp *</label>
          <input id="whatsapp" name="whatsapp" type="tel" autoComplete="tel" placeholder="+60 ..." required aria-invalid={Boolean(errors.whatsapp)} aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined} />
          {errors.whatsapp && <div id="whatsapp-error" className="field-error" role="alert">{errors.whatsapp}</div>}
        </div>
        <div className="field">
          <label htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />
          {errors.email && <div id="email-error" className="field-error" role="alert">{errors.email}</div>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={4} placeholder="Dietary needs, room preference, arrival details, or anything else we should know." />
      </div>

      <div className="rounded-2xl bg-[#f5f1e8] p-4 text-sm leading-6 text-neutral-700">
        Submitting this form sends a booking request, not a payment. We&apos;ll confirm availability, final itinerary and pricing before any payment is required.
      </div>

      {message && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{message}</div>}
      <button className="button-primary w-full md:w-fit" type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit Booking Request"}
      </button>
    </form>
  );
}
