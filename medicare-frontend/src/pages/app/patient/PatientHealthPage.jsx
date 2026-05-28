import { useState } from "react";
import {
  FolderHeart,
  Pill,
  FileText,
  Stethoscope,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  statusTone,
  PageLoader,
  EmptyState,
} from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/Dashboard";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Card";
import { useResource } from "@/hooks/useResource";
import { useAuth } from "@/hooks/useAuth";
import { appointmentApi, recordApi } from "@/api/resources.api";
import { qk } from "@/lib/queryKeys";
import { formatDate, formatDateTime } from "@/lib/utils";

/**
 * PatientHealthPage — the patient's health record: completed visits,
 * with access to the visit notes and prescription for each.
 */
export default function PatientHealthPage() {
  const { user } = useAuth();
  const [viewing, setViewing] = useState(null);

  const apptParams = { status: "COMPLETED", limit: 100 };
  const { data, loading, error } = useResource(
    qk.appointments.list(apptParams),
    () => appointmentApi.list(apptParams),
  );

  const visits =
    data?.appointments || data?.items || (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Health"
        subtitle="Your visit history, notes, and prescriptions."
      />

      {loading ? (
        <PageLoader label="Loading your health record…" />
      ) : error ? (
        <Card>
          <EmptyState title="Couldn't load your records" message={error} />
        </Card>
      ) : visits.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderHeart}
            title="No visit records yet"
            message="After a completed appointment, your visit notes and prescriptions will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => {
            const doc = visit.doctor || {};
            const docName = `Dr. ${
              doc.firstName || doc.user?.firstName || ""
            } ${doc.lastName || doc.user?.lastName || ""}`.trim();
            return (
              <Card key={visit.id}>
                <CardBody>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-pine-100 p-2.5 text-pine-700">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-pine-900">
                          {docName || "Consultation"}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-paper-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDateTime(visit.startTime || visit.scheduledAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone(visit.status)}>
                        {visit.status}
                      </Badge>
                      <button
                        onClick={() => setViewing(visit)}
                        className="rounded-lg border border-pine-300 px-3 py-1.5 text-sm font-medium text-pine-700 transition-colors hover:bg-pine-50"
                      >
                        View record
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {viewing && (
        <HealthRecordModal
          appointment={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

/**
 * HealthRecordModal — read-only view of a visit's notes and
 * prescription for the patient.
 */
function HealthRecordModal({ appointment, onClose }) {
  const { data: record, loading: recordLoading } = useResource(
    qk.records.record(appointment.id),
    () => recordApi.getRecord(appointment.id).catch(() => null),
  );
  const { data: prescription, loading: rxLoading } = useResource(
    qk.records.prescription(appointment.id),
    () => recordApi.getPrescription(appointment.id).catch(() => null),
  );

  const rec = record?.record || record;
  const rx = prescription?.prescription || prescription;

  // ✅ Backend 'items' array use karta hai, 'medications' nahi
  const rxItems = rx?.items || rx?.medications || [];

  return (
    <Modal
      open
      onClose={onClose}
      title="Visit record"
      description={formatDate(appointment.startTime || appointment.scheduledAt)}
      size="lg"
    >
      <div className="space-y-5">
        {/* Visit notes */}
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-pine-900">
            <FileText className="h-4 w-4 text-pine-600" />
            Visit notes
          </h4>
          {recordLoading ? (
            <Spinner size={20} />
          ) : rec ? (
            <div className="space-y-2 rounded-xl border border-paper-200 bg-paper-100 p-4 text-sm">
              {rec.diagnosis && (
                <RecordLine label="Diagnosis" value={rec.diagnosis} />
              )}
              {rec.symptoms && (
                <RecordLine label="Symptoms" value={rec.symptoms} />
              )}
              {(rec.bloodPressure ||
                rec.pulse ||
                rec.temperature ||
                rec.spo2) && (
                <RecordLine
                  label="Vitals"
                  value={[
                    rec.bloodPressure && `BP ${rec.bloodPressure}`,
                    rec.temperature && `Temp ${rec.temperature}°F`,
                    rec.pulse && `Pulse ${rec.pulse}`,
                    rec.spo2 && `SpO2 ${rec.spo2}%`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              )}
              {/* ✅ vitals nested object bhi handle karo */}
              {rec.vitals && (
                <RecordLine
                  label="Vitals"
                  value={[
                    rec.vitals.bloodPressure &&
                      `BP ${rec.vitals.bloodPressure}`,
                    rec.vitals.temperature &&
                      `Temp ${rec.vitals.temperature}°F`,
                    rec.vitals.pulse && `Pulse ${rec.vitals.pulse}`,
                    rec.vitals.weight && `Weight ${rec.vitals.weight}kg`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              )}
              {(rec.notes || rec.clinicalNotes) && (
                <RecordLine
                  label="Notes"
                  value={rec.notes || rec.clinicalNotes}
                />
              )}
              {rec.followUpInstructions && (
                <RecordLine
                  label="Follow-up"
                  value={rec.followUpInstructions}
                />
              )}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-paper-300 py-4 text-center text-sm text-paper-500">
              No visit notes recorded.
            </p>
          )}
        </section>

        {/* Prescription */}
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-pine-900">
            <Pill className="h-4 w-4 text-pine-600" />
            Prescription
          </h4>
          {rxLoading ? (
            <Spinner size={20} />
          ) : rxItems.length > 0 ? (
            <div className="space-y-2">
              {rxItems.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-paper-200 bg-paper-100 p-3"
                >
                  <p className="font-semibold text-pine-900">
                    {/* ✅ drugName (backend) ya name (fallback) */}
                    {m.drugName || m.name}
                    {m.dosage && (
                      <span className="font-normal text-paper-500">
                        {" "}
                        · {m.dosage}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-paper-500">
                    {/* ✅ durationDays (backend) ya duration (fallback) */}
                    {[
                      m.frequency,
                      m.durationDays ? `${m.durationDays} days` : m.duration,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {/* ✅ instructions bhi show karo agar hai */}
                  {m.instructions && (
                    <p className="mt-1 text-xs text-paper-400">
                      {m.instructions}
                    </p>
                  )}
                </div>
              ))}
              {rx.advice && (
                <div className="rounded-xl border border-pine-200 bg-pine-50 p-3 text-sm text-pine-800">
                  <span className="font-semibold">Advice: </span>
                  {rx.advice}
                </div>
              )}
              {/* ✅ followUpDate bhi show karo */}
              {rx.followUpDate && (
                <div className="rounded-xl border border-paper-200 bg-paper-50 p-3 text-sm text-paper-700">
                  <span className="font-semibold">Follow-up date: </span>
                  {formatDate(rx.followUpDate)}
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-paper-300 py-4 text-center text-sm text-paper-500">
              No prescription was issued for this visit.
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}

function RecordLine({ label, value }) {
  return (
    <p>
      <span className="font-semibold text-paper-700">{label}: </span>
      <span className="text-paper-600">{value}</span>
    </p>
  );
}
