import { useState } from "react";
import { Stethoscope, CalendarDays, Clock, Check } from "lucide-react";
import { Card, CardBody, Spinner, Badge } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useResource, useMutation } from "@/hooks/useResource";
import { doctorApi, appointmentApi } from "@/api/resources.api";
import { qk } from "@/lib/queryKeys";
import { notify } from "@/store/ui.store";
import { upcomingDays } from "@/lib/dates";
import { formatTime, errorMessage, cn } from "@/lib/utils";

/**
 * BookingFlow — the shared appointment booking wizard.
 *
 * Steps: pick doctor -> pick date -> pick slot -> confirm.
 *
 * Uses the backend's transaction-safe two-phase booking: `hold` places
 * a temporary HOLD on the slot, then `confirm` finalises it. This
 * prevents double-booking under concurrency.
 *
 * @param {string}  patientId  required when booking on behalf of a
 *                             patient (receptionist/admin). Omitted
 *                             when a patient books for themselves.
 * @param {Function} onBooked  called with the confirmed appointment.
 */
export default function BookingFlow({ patientId, onBooked }) {
  const [step, setStep] = useState(1);
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [reason, setReason] = useState("");
  const [held, setHeld] = useState(null); // the HOLD appointment

  const days = upcomingDays(14);

  // --- doctors -----------------------------------------------------
  const { data: docData, loading: docLoading } = useResource(
    qk.doctors.list({ limit: 50 }),
    () => doctorApi.list({ limit: 50 }),
  );
  const doctors =
    docData?.doctors ||
    docData?.items ||
    (Array.isArray(docData) ? docData : []);

  // --- slots for the chosen doctor + date --------------------------
  const { data: slotData, loading: slotLoading } = useResource(
    qk.doctors.slots(doctor?.id, date),
    () => doctorApi.slots(doctor.id, date),
    { enabled: !!doctor && !!date },
  );
  const slots = slotData?.slots || (Array.isArray(slotData) ? slotData : []);

  // --- hold + confirm ---------------------------------------------
  const holdMutation = useMutation((body) => appointmentApi.hold(body), {
    invalidate: [qk.appointments.all],
    onError: (err) => notify.error(errorMessage(err)),
  });
  const confirmMutation = useMutation(
    (held) =>
      held.reason
        ? appointmentApi.confirm(held.id, { reason: held.reason })
        : appointmentApi.confirm(held.id),
    {
      invalidate: [qk.appointments.all],
      onError: (err) => notify.error(errorMessage(err)),
    },
  );

  const docName = (d) => {
    const first = d.user?.firstName || d.firstName || "";
    const last = d.user?.lastName || d.lastName || "";
    return `Dr. ${first} ${last}`.trim();
  };

  // Place a hold, then advance to the confirm step.
  const placeHold = async (chosenSlot) => {
    setSlot(chosenSlot);
    try {
      const body = {
        doctorId: doctor.id,
        startTime: chosenSlot.startTime || chosenSlot.start || chosenSlot,
        ...(patientId ? { patientId } : {}),
      };
      const appt = await holdMutation.mutateAsync(body);
      console.log("Hold response:", appt);
      setHeld(appt?.appointment || appt);
      setStep(4);
    } catch {
      // error already surfaced by the mutation
    }
  };

  const confirmBooking = async () => {
    if (!held) return;
    try {
      const confirmed = await confirmMutation.mutateAsync({
        id: held.id,
        reason: reason || undefined,
      });
      notify.success("Appointment confirmed.");
      onBooked?.(confirmed || held);
    } catch {
      // error surfaced
    }
  };

  // --- step indicator ---------------------------------------------
  const steps = ["Doctor", "Date", "Time", "Confirm"];

  return (
    <div>
      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {steps.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done && "bg-pine-700 text-paper-50",
                  active && "bg-pine-700 text-paper-50 ring-4 ring-pine-100",
                  !done && !active && "bg-paper-200 text-paper-500",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : n}
              </div>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:block",
                  active ? "text-pine-900" : "text-paper-500",
                )}
              >
                {label}
              </span>
              {n < steps.length && <div className="h-px flex-1 bg-paper-200" />}
            </div>
          );
        })}
      </div>

      {/* Step 1 — doctor */}
      {step === 1 && (
        <div>
          <h3 className="mb-3 font-semibold text-pine-900">Choose a doctor</h3>
          {docLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : doctors.length === 0 ? (
            <p className="py-8 text-center text-sm text-paper-500">
              No doctors are available right now.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {doctors.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setDoctor(d);
                    setStep(2);
                  }}
                  className="flex items-center gap-3 rounded-xl border border-paper-200 p-3.5 text-left transition-colors hover:border-pine-300 hover:bg-pine-50"
                >
                  <div className="rounded-xl bg-pine-100 p-2.5 text-pine-700">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-pine-900">
                      {docName(d)}
                    </p>
                    <p className="truncate text-xs text-paper-500">
                      {d.speciality || d.specialization || "General"}
                      {d.consultationFee ? ` · ₹${d.consultationFee}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2 — date */}
      {step === 2 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-pine-900">Pick a date</h3>
            <Button size="sm" variant="ghost" onClick={() => setStep(1)}>
              Change doctor
            </Button>
          </div>
          <p className="mb-3 text-sm text-paper-500">
            Booking with{" "}
            <span className="font-medium text-pine-700">{docName(doctor)}</span>
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {days.map((d) => (
              <button
                key={d.value}
                onClick={() => {
                  setDate(d.value);
                  setStep(3);
                }}
                className="flex flex-col items-center rounded-xl border border-paper-200 py-2.5 transition-colors hover:border-pine-300 hover:bg-pine-50"
              >
                <span className="text-xs text-paper-500">{d.weekday}</span>
                <span className="font-display text-lg font-semibold text-pine-900">
                  {d.day}
                </span>
                <span className="text-xs text-paper-400">{d.month}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — slot */}
      {step === 3 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-pine-900">Choose a time</h3>
            <Button size="sm" variant="ghost" onClick={() => setStep(2)}>
              Change date
            </Button>
          </div>
          {slotLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : slots.length === 0 ? (
            <Card>
              <CardBody>
                <p className="py-4 text-center text-sm text-paper-500">
                  No open slots on this date. Try another day.
                </p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((s, i) => {
                const start = s.startTime || s.start || s;
                const available = s.available !== false;
                return (
                  <button
                    key={i}
                    disabled={!available || holdMutation.loading}
                    onClick={() => placeHold(s)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition-colors",
                      available
                        ? "border-paper-200 text-pine-800 hover:border-pine-400 hover:bg-pine-50"
                        : "cursor-not-allowed border-paper-100 bg-paper-100 text-paper-400",
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(start)}
                  </button>
                );
              })}
            </div>
          )}
          {holdMutation.loading && (
            <p className="mt-3 text-center text-xs text-paper-500">
              Holding your slot…
            </p>
          )}
        </div>
      )}

      {/* Step 4 — confirm */}
      {step === 4 && held && (
        <div>
          <h3 className="mb-3 font-semibold text-pine-900">
            Confirm your appointment
          </h3>
          <Card>
            <CardBody className="space-y-3">
              <Row icon={Stethoscope} label="Doctor" value={docName(doctor)} />
              <Row
                icon={CalendarDays}
                label="When"
                value={`${date} at ${formatTime(
                  slot?.startTime || slot?.start || slot,
                )}`}
              />
              <div className="flex items-center gap-2">
                <Badge tone="amber">Slot held</Badge>
                <span className="text-xs text-paper-500">
                  Confirm soon — holds expire automatically.
                </span>
              </div>
            </CardBody>
          </Card>

          <div className="mt-4">
            <Textarea
              label="Reason for visit"
              rows={3}
              placeholder="Briefly describe the reason for this appointment (optional)."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="mt-5 flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setHeld(null);
                setStep(3);
              }}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              loading={confirmMutation.loading}
              onClick={confirmBooking}
            >
              <Check className="h-4 w-4" />
              Confirm appointment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-paper-100 p-2 text-paper-500">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-paper-500">
          {label}
        </p>
        <p className="text-sm font-medium text-pine-900">{value}</p>
      </div>
    </div>
  );
}
